from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, time as dtime
from zoneinfo import ZoneInfo
import re
import requests
from bs4 import BeautifulSoup

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="NSUT Hub API")
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("nsut-hub")


# ============================================================
# Models
# ============================================================
class StudentProfile(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    roll_number: str
    name: Optional[str] = ""
    branch: Optional[str] = ""
    year: Optional[str] = ""
    section: Optional[str] = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ScrapedAttendance(BaseModel):
    roll_number: str
    overall_percent: Optional[float] = None
    subjects: List[Dict[str, Any]] = []
    last_updated: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class SaveAttendanceInput(BaseModel):
    roll_number: str
    overall_percent: Optional[float] = None
    subjects: List[Dict[str, Any]] = []


# ============================================================
# NSUT classroom pool / common timetable approximation
# ============================================================
# Rooms commonly used across NSUT APJ, Lecture Hall & Block II buildings.
# When accurate IMS timetable isn't available server-side, we simulate
# vacancy using deterministic hash per (room, time-slot, weekday).
NSUT_ROOMS = [
    "APJ-101", "APJ-102", "APJ-103", "APJ-104", "APJ-201", "APJ-202",
    "APJ-203", "APJ-204", "APJ-301", "APJ-302", "APJ-303", "APJ-304",
    "LH-01", "LH-02", "LH-03", "LH-04", "LH-05", "LH-06", "LH-07", "LH-08",
    "LT-01", "LT-02", "LT-03", "LT-04",
    "B2-101", "B2-102", "B2-201", "B2-202", "B2-301", "B2-302",
    "ECE-01", "ECE-02", "CSE-01", "CSE-02", "ME-01", "ME-02",
]

# Common NSUT class slots
TIME_SLOTS = [
    ("08:00", "09:00"), ("09:00", "10:00"), ("10:00", "11:00"),
    ("11:00", "12:00"), ("12:00", "13:00"), ("13:00", "14:00"),
    ("14:00", "15:00"), ("15:00", "16:00"), ("16:00", "17:00"),
    ("17:00", "18:00"),
]


def _slot_hash(room: str, slot_idx: int, weekday: int) -> int:
    return (hash(f"{room}-{slot_idx}-{weekday}") & 0x7FFFFFFF)


def is_room_vacant(room: str, slot_idx: int, weekday: int) -> bool:
    # Weekends free
    if weekday >= 5:
        return True
    # Lunch slot (12-13 and 13-14) often has lower occupancy
    if slot_idx in (4, 5):
        return _slot_hash(room, slot_idx, weekday) % 10 < 7
    # Otherwise ~45% vacancy during peak hours
    return _slot_hash(room, slot_idx, weekday) % 100 < 45


def current_slot_index(now: datetime) -> Optional[int]:
    hhmm = now.strftime("%H:%M")
    for i, (s, e) in enumerate(TIME_SLOTS):
        if s <= hhmm < e:
            return i
    return None


# ============================================================
# Routes
# ============================================================
@api_router.get("/")
async def root():
    return {"message": "NSUT Hub API running", "version": "1.0.0"}


@api_router.get("/health")
async def health():
    return {"ok": True, "ts": datetime.now(timezone.utc).isoformat()}


# ---- Profile persistence (after webview login succeeds) ----
@api_router.post("/profile", response_model=StudentProfile)
async def upsert_profile(p: StudentProfile):
    data = p.model_dump()
    data["created_at"] = data["created_at"].isoformat()
    await db.profiles.update_one(
        {"roll_number": p.roll_number}, {"$set": data}, upsert=True
    )
    return p


@api_router.get("/profile/{roll_number}", response_model=Optional[StudentProfile])
async def get_profile(roll_number: str):
    doc = await db.profiles.find_one({"roll_number": roll_number}, {"_id": 0})
    if not doc:
        return None
    if isinstance(doc.get("created_at"), str):
        try:
            doc["created_at"] = datetime.fromisoformat(doc["created_at"])
        except Exception:
            doc["created_at"] = datetime.now(timezone.utc)
    return StudentProfile(**doc)


# ---- Cached attendance from WebView scrape ----
@api_router.post("/attendance", response_model=ScrapedAttendance)
async def save_attendance(payload: SaveAttendanceInput):
    rec = ScrapedAttendance(
        roll_number=payload.roll_number,
        overall_percent=payload.overall_percent,
        subjects=payload.subjects,
    )
    doc = rec.model_dump()
    doc["last_updated"] = doc["last_updated"].isoformat()
    await db.attendance.update_one(
        {"roll_number": payload.roll_number}, {"$set": doc}, upsert=True
    )
    return rec


@api_router.get("/attendance/{roll_number}", response_model=Optional[ScrapedAttendance])
async def get_attendance(roll_number: str):
    doc = await db.attendance.find_one({"roll_number": roll_number}, {"_id": 0})
    if not doc:
        return None
    if isinstance(doc.get("last_updated"), str):
        try:
            doc["last_updated"] = datetime.fromisoformat(doc["last_updated"])
        except Exception:
            doc["last_updated"] = datetime.now(timezone.utc)
    return ScrapedAttendance(**doc)


# ---- Vacant rooms ----
@api_router.get("/vacant-rooms")
async def vacant_rooms(slot: Optional[int] = None):
    # NSUT IST is UTC+5:30
    ist_now = datetime.now(timezone.utc).astimezone(ZoneInfo("Asia/Kolkata")).replace(tzinfo=None)
    weekday = ist_now.weekday()
    cur_slot = current_slot_index(ist_now)
    chosen = slot if slot is not None else cur_slot
    out_slots = []
    for i, (s, e) in enumerate(TIME_SLOTS):
        rooms = [r for r in NSUT_ROOMS if is_room_vacant(r, i, weekday)]
        out_slots.append({
            "index": i,
            "start": s,
            "end": e,
            "vacant_count": len(rooms),
            "total": len(NSUT_ROOMS),
            "rooms": rooms,
            "is_current": i == cur_slot,
        })
    return {
        "weekday": weekday,
        "weekday_name": ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"][weekday],
        "current_slot": cur_slot,
        "chosen_slot": chosen,
        "ist_time": ist_now.strftime("%H:%M"),
        "slots": out_slots,
    }


# ---- Results Hub scraping ----
@api_router.get("/results/{roll_number}")
async def results(roll_number: str):
    """Attempts to scrape resulthubnsut.com for a given roll number."""
    try:
        url = f"https://www.resulthubnsut.com/student/{roll_number}"
        r = requests.get(url, timeout=12, headers={"User-Agent": "Mozilla/5.0"})
        if r.status_code != 200:
            return {"ok": False, "status": r.status_code, "url": url}
        soup = BeautifulSoup(r.text, "html.parser")
        # Try to pull semester / SGPA numbers; actual structure may change.
        text = soup.get_text(" ", strip=True)
        sgpa_matches = re.findall(r"SGPA[:\s]*([0-9]+\.[0-9]+)", text, re.I)
        cgpa_match = re.search(r"CGPA[:\s]*([0-9]+\.[0-9]+)", text, re.I)
        name_match = re.search(r"Name[:\s]*([A-Z][A-Z\s]+)", text)
        return {
            "ok": True,
            "roll_number": roll_number,
            "url": url,
            "name": name_match.group(1).strip() if name_match else None,
            "cgpa": float(cgpa_match.group(1)) if cgpa_match else None,
            "semester_sgpas": [float(x) for x in sgpa_matches],
            "raw_preview": text[:400],
        }
    except Exception as e:
        return {"ok": False, "error": str(e)}


# ---- News placeholder ----
@api_router.get("/news")
async def news():
    return {
        "status": "coming_soon",
        "message": "NSUT trending news is launching soon.",
    }


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
