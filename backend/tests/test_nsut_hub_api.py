"""Contract/security checks using an isolated real Mongo database per test worker."""
import os
import uuid
from datetime import datetime, timezone, timedelta
import pytest
from fastapi.testclient import TestClient
from pymongo import MongoClient

os.environ['DB_NAME'] = 'nsut_test_' + uuid.uuid4().hex
os.environ['SCHEDULE_ADMIN_TOKEN'] = 'synthetic-test-token-' + 'x' * 32
import server
from schedules import Schedule, availability

@pytest.fixture(scope='module')
def client():
    with TestClient(server.app, raise_server_exceptions=False) as client:
        yield client
    mongo = MongoClient(os.environ['MONGO_URL'])
    mongo.drop_database(os.environ['DB_NAME'])
    mongo.close()

@pytest.fixture
def database():
    mongo = MongoClient(os.environ['MONGO_URL'], tz_aware=True)
    db = mongo[os.environ['DB_NAME']]
    for name in ['room_schedules', 'notices_cache', 'sync_leases']: db[name].delete_many({})
    yield db
    mongo.close()

def schedule():
    now = datetime.now(timezone.utc)
    return {'source':'verified_schedule','source_url':'https://www.imsnsit.org/imsnsit/',
            'observed_at':now.isoformat(),'valid_from':(now-timedelta(days=2)).date().isoformat(),
            'valid_until':(now+timedelta(days=2)).date().isoformat(),
            'rooms':[{'id':'TEST-101','building':'Synthetic','coverage':[{'day':0,'start':'08:00','end':'18:00'}],
                      'bookings':[{'day':0,'start':'09:00','end':'10:00','title':'Synthetic class'}]}]}

def test_health_and_no_private_endpoints(client, database):
    assert client.get('/api/ready').json()['ok']
    assert client.get('/api/health').json()['ok']
    for path in ['/api/profile/TEST', '/api/attendance/TEST']:
        assert client.get(path).status_code == 404
    for path in ['/api/profile','/api/attendance']:
        assert client.post(path,json={'password':'must-not-echo'}).status_code == 404
    assert client.get('/api/results/TEST').json()['status'] == 'coming_soon'
    empty = client.get('/api/rooms').json()
    assert empty['rooms'] == [] and empty['source'] is None

def test_admin_auth_validation_and_atomic_idempotency(client, database):
    body=schedule(); headers={'Authorization':'Bearer '+os.environ['SCHEDULE_ADMIN_TOKEN']}
    assert client.put('/api/admin/room-schedule',json=body).status_code == 401
    assert client.put('/api/admin/room-schedule',json=body,headers={'Authorization':'Bearer wrong'}).status_code == 401
    a=client.put('/api/admin/room-schedule',json=body,headers=headers)
    b=client.put('/api/admin/room-schedule',json=body,headers=headers)
    assert a.status_code == 200 and a.json()==b.json()
    assert database.room_schedules.count_documents({}) == 1
    assert client.get('/api/rooms').json()['rooms'][0]['id']=='TEST-101'
    body['source_url']='https://evil.test/?secret=must-not-echo'
    r=client.put('/api/admin/room-schedule',json=body,headers=headers)
    assert r.status_code==422 and 'must-not-echo' not in r.text
    assert client.get('/api/rooms').json()['rooms'][0]['id']=='TEST-101'
    assert client.put('/api/admin/room-schedule',content=b'x'*1_000_001,headers=headers).status_code==413

def test_notice_cache_lease_and_stale_fallback(client, database, monkeypatch):
    calls=[]
    def scrape():
        calls.append(1)
        return [{'title':'Synthetic examination notice','url':'https://nsut.ac.in/test','source':'nsut.ac.in'}]
    monkeypatch.setattr(server,'scrape_notices',scrape)
    assert client.get('/api/notices').json()['stale'] is False
    assert client.get('/api/notices').json()['ok'] is True
    assert len(calls)==1
    database.notices_cache.update_one({'_id':'official'},{'$set':{'refresh_after':datetime.now(timezone.utc)-timedelta(seconds=1)}})
    database.sync_leases.insert_one({'_id':'notices','owner':'other','until':datetime.now(timezone.utc)+timedelta(seconds=60)})
    assert client.get('/api/notices').json()['stale'] is True and len(calls)==1
    database.sync_leases.delete_many({})
    def fail(): raise RuntimeError('private diagnostics')
    monkeypatch.setattr(server,'scrape_notices',fail)
    r=client.get('/api/notices')
    assert r.json()['stale'] is True and r.json()['items'] and 'private diagnostics' not in r.text
    assert database.sync_leases.count_documents({})==0
    # Expired records cannot be revived by a failed refresh.
    database.notices_cache.update_one({'_id':'official'},{'$set':{'fetched_at':datetime.now(timezone.utc)-timedelta(days=8)}})
    assert client.get('/api/notices').json()['items']==[]
    assert any(i.get('expireAfterSeconds')==0 for i in database.notices_cache.list_indexes())

def fixed_schedule():
    body=schedule();body.update(observed_at='2026-10-05T00:00:00Z',valid_from='2026-10-05',valid_until='2026-10-11')
    # Construct historic fixture without wall-clock assumptions in the validator.
    return Schedule.model_validate(body)

def at(hour,minute=0): return datetime(2026,10,5,hour,minute,tzinfo=timezone(timedelta(hours=5,minutes=30)))

def test_room_gaps_overlap_cancelled_missing_coverage_and_stale():
    s=fixed_schedule(); r=s.rooms[0]
    from schedules import Booking
    r.bookings += [Booking(day=0,start='09:30',end='11:00',title='Overlap'),Booking(day=0,start='11:00',end='12:00',title='Adjacent'),Booking(day=0,start='13:00',end='14:00',title='Cancelled',cancelled=True)]
    def room(now,max_age=86400): return availability(s,now,max_age)['rooms'][0]
    assert room(at(8))['status']=='available'
    assert room(at(8))['minutes_until_change']==60
    assert room(at(9,30))['minutes_until_change']==150
    assert room(at(12))['status']=='available'
    assert room(at(13))['status']=='available'
    assert room(at(18))['status']=='unknown'
    assert room(at(9),60)['status']=='unknown'
    r.coverage=[]
    assert room(at(8))['status']=='unknown'
    assert room(at(9))['status']=='occupied'
    assert availability(s,at(9)+timedelta(days=6),604800)['rooms'][0]['status']=='unknown'
    assert availability(s,at(9)+timedelta(days=8),999999)['stale']

@pytest.mark.parametrize('mutate',[
    lambda b:b.update(observed_at='2026-01-01T00:00:00'),
    lambda b:b['rooms'].append(b['rooms'][0]),
    lambda b:b['rooms'][0]['coverage'][0].update(end='07:00'),
    lambda b:b['rooms'][0]['coverage'][0].update(day=7),
])
def test_invalid_schedules(mutate):
    body=schedule();mutate(body)
    with pytest.raises(ValueError):Schedule.model_validate(body)
