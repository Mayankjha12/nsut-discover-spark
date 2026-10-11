"""Public campus information. IMS credentials/sessions and student records never enter this API."""
import asyncio
import hashlib
import logging
import os
import secrets
from contextlib import asynccontextmanager
from datetime import datetime, timezone, timedelta
from pathlib import Path
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from motor.motor_asyncio import AsyncIOMotorClient
from starlette.middleware.cors import CORSMiddleware
from schedules import Schedule, availability

load_dotenv(Path(__file__).parent / '.env')
logger = logging.getLogger('nsut-hub')
mongo_url = os.environ['MONGO_URL']
db_name = os.environ['DB_NAME']
client = AsyncIOMotorClient(mongo_url, serverSelectionTimeoutMS=5000, socketTimeoutMS=8000, tz_aware=True)
db = client[db_name]
MAX_AGE = max(60, min(int(os.environ.get('SCHEDULE_MAX_AGE_SECONDS', '86400')), 604800))
NOTICES_URL = 'https://nsut.ac.in/en/home'

@asynccontextmanager
async def lifespan(app):
    # Mongo's unique _id index handles upserts; TTL applies only to public notice cache.
    try:
        await db.notices_cache.create_index('expires_at', expireAfterSeconds=0)
    except Exception:
        logger.warning('Database initialization unavailable; readiness will remain unhealthy')
    yield
    client.close()

app = FastAPI(title='NSUT Hub API', version='2.0.0', lifespan=lifespan)
origins = [s.strip() for s in os.environ.get('CORS_ORIGINS', 'http://localhost:8081').split(',') if s.strip()]
if '*' in origins:
    raise RuntimeError('CORS_ORIGINS must list explicit web origins')
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=False, allow_methods=['GET', 'PUT'], allow_headers=['Content-Type', 'Authorization'])

class BodyLimit:
    def __init__(self, app): self.app = app
    async def __call__(self, scope, receive, send):
        if scope['type'] != 'http': return await self.app(scope, receive, send)
        chunks, length = [], 0
        while True:
            message = await receive()
            if message['type'] == 'http.disconnect': return
            length += len(message.get('body', b''))
            if length > 1_000_000:
                return await JSONResponse({'detail': 'Request is too large'}, 413)(scope, receive, send)
            chunks.append(message)
            if not message.get('more_body'): break
        async def replay(): return chunks.pop(0) if chunks else await receive()
        await self.app(scope, replay, send)
app.add_middleware(BodyLimit)

@app.exception_handler(RequestValidationError)
async def invalid_input(request, exc):
    # Do not echo submitted values (or accidental secrets) in validation errors.
    return JSONResponse(status_code=422, content={'detail': 'Invalid data. Check the documented schedule schema and field limits.'})

@app.exception_handler(Exception)
async def unexpected_error(request, exc):
    logger.error('Request failed (%s)', type(exc).__name__)
    return JSONResponse(status_code=503, content={'detail': 'Campus service is temporarily unavailable. Please try again later.'})

@app.get('/api/')
async def root(): return {'message': 'NSUT Hub API', 'version': '2.0.0'}

@app.get('/api/health')
async def health(): return {'ok': True, 'ts': datetime.now(timezone.utc).isoformat()}

@app.get('/api/ready')
async def ready():
    try: await client.admin.command('ping')
    except Exception: raise HTTPException(503, 'Database unavailable')
    return {'ok': True}

bearer = HTTPBearer(auto_error=False)
async def admin(credentials: HTTPAuthorizationCredentials | None = Depends(bearer)):
    configured = os.environ.get('SCHEDULE_ADMIN_TOKEN', '')
    if len(configured) < 32: raise HTTPException(503, 'Schedule publishing is not configured')
    if credentials is None or not secrets.compare_digest(credentials.credentials, configured):
        raise HTTPException(401, 'Valid administrator authorization required', headers={'WWW-Authenticate': 'Bearer'})

@app.put('/api/admin/room-schedule', dependencies=[Depends(admin)])
async def import_schedule(schedule: Schedule):
    data = schedule.model_dump(mode='json')
    revision = hashlib.sha256(schedule.model_dump_json().encode()).hexdigest()
    # Atomic replacement prevents merges mixing different semesters. Same input is safe to retry.
    await db.room_schedules.replace_one({'_id': 'current'}, {'_id': 'current', 'data': data, 'revision': revision}, upsert=True)
    return {'ok': True, 'revision': revision, 'rooms': len(schedule.rooms)}

@app.get('/api/rooms')
@app.get('/api/vacant-rooms')
async def rooms():
    row = await db.room_schedules.find_one({'_id': 'current'})
    schedule = Schedule.model_validate(row['data']) if row else None
    return availability(schedule, datetime.now(timezone.utc), MAX_AGE)

@app.get('/api/results/{roll_number}')
async def results(roll_number: str):
    # Backward-compatible route with no scraping or disclosure of student results.
    return {'status': 'coming_soon', 'message': 'Results are under development.'}

@app.get('/api/news')
async def news(): return {'status': 'coming_soon', 'message': 'Student news is under development. Official notices are available separately.'}

# A Mongo lease suppresses duplicate upstream requests across workers and users.
def scrape_notices():
    with requests.get(NOTICES_URL, timeout=(4, 10), headers={'User-Agent': 'NSUT-Hub/2.0 (public campus notices)'}, stream=True) as response:
        response.raise_for_status()
        payload = bytearray()
        for chunk in response.iter_content(16384):
            payload.extend(chunk)
            if len(payload) > 2_000_000: raise ValueError('Upstream response too large')
    soup = BeautifulSoup(payload, 'html.parser')
    items, seen = [], set()
    for anchor in soup.select('marquee a[href]'):
        title = anchor.get_text(' ', strip=True)
        url = urljoin(NOTICES_URL, anchor['href'])
        parsed = urlparse(url)
        if len(title) < 12 or parsed.scheme != 'https' or parsed.username or parsed.password or url in seen: continue
        seen.add(url)
        items.append({'title': title[:500], 'url': url, 'source': 'nsut.ac.in'})
        if len(items) >= 100: break
    if not items: raise ValueError('Notice format unavailable')
    return items

@app.get('/api/notices')
async def notices():
    now = datetime.now(timezone.utc)
    cached = await db.notices_cache.find_one({'_id': 'official'})
    if cached and cached.get('fetched_at') and cached['fetched_at'] < now - timedelta(days=7):
        cached = None
    if cached and cached['refresh_after'] > now:
        return {'ok': bool(cached.get('items')), 'items': cached.get('items', []), 'fetched_at': cached.get('fetched_at'), 'stale': cached.get('stale', False), 'message': cached.get('message')}
    from pymongo.errors import DuplicateKeyError
    acquired = False
    owner = secrets.token_hex(16)
    try:
        lease = await db.sync_leases.update_one({'_id': 'notices', '$or': [{'until': {'$lte': now}}, {'until': {'$exists': False}}]}, {'$set': {'until': now + timedelta(seconds=60), 'owner': owner}}, upsert=True)
        acquired = bool(lease.modified_count or lease.upserted_id)
    except DuplicateKeyError: pass
    if not acquired:
        return {'ok': bool(cached and cached.get('items')), 'items': (cached or {}).get('items', []), 'fetched_at': (cached or {}).get('fetched_at'), 'stale': True, 'message': 'Notices are refreshing. Try again shortly.'}
    try:
        items = await asyncio.wait_for(asyncio.to_thread(scrape_notices), timeout=20)
        record = {'items': items, 'fetched_at': now, 'stale': False, 'refresh_after': now + timedelta(hours=1), 'expires_at': now + timedelta(days=7)}
    except Exception as exc:
        logger.warning('Official notices unavailable (%s)', type(exc).__name__)
        record = {'items': (cached or {}).get('items', []), 'fetched_at': (cached or {}).get('fetched_at'), 'stale': True, 'refresh_after': now + timedelta(minutes=5), 'expires_at': now + timedelta(days=7), 'message': 'Official notices could not be refreshed. Visit the NSUT website or try later.'}
    try: await db.notices_cache.replace_one({'_id': 'official'}, {'_id': 'official', **record}, upsert=True)
    finally: await db.sync_leases.delete_one({'_id': 'notices', 'owner': owner})
    return {'ok': bool(record['items']), **{k: v for k, v in record.items() if k not in ('refresh_after', 'expires_at')}}
