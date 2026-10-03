"""Backend regression tests for NSUT Hub API.

Covers: /api/health, /api/vacant-rooms, /api/news, /api/results/{roll},
/api/profile (POST + GET), /api/attendance (POST + GET).
"""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ["EXPO_PUBLIC_BACKEND_URL"].rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# ---- Health ----
class TestHealth:
    def test_health_ok(self, client):
        r = client.get(f"{API}/health", timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert d.get("ok") is True
        assert "ts" in d

    def test_root(self, client):
        r = client.get(f"{API}/", timeout=15)
        assert r.status_code == 200
        assert "message" in r.json()


# ---- Vacant Rooms ----
class TestVacantRooms:
    def test_vacant_default(self, client):
        r = client.get(f"{API}/vacant-rooms", timeout=15)
        assert r.status_code == 200
        d = r.json()
        for key in ("weekday", "weekday_name", "current_slot", "chosen_slot", "ist_time", "slots"):
            assert key in d
        assert isinstance(d["slots"], list) and len(d["slots"]) == 10
        s0 = d["slots"][0]
        for key in ("index", "start", "end", "vacant_count", "total", "rooms", "is_current"):
            assert key in s0
        assert s0["total"] > 0
        assert isinstance(s0["rooms"], list)
        assert s0["vacant_count"] == len(s0["rooms"])

    def test_vacant_slot_param(self, client):
        r = client.get(f"{API}/vacant-rooms", params={"slot": 3}, timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert d["chosen_slot"] == 3

    def test_vacant_all_slots_indexed(self, client):
        r = client.get(f"{API}/vacant-rooms", timeout=15)
        slots = r.json()["slots"]
        for i, s in enumerate(slots):
            assert s["index"] == i


# ---- News ----
class TestNews:
    def test_news_coming_soon(self, client):
        r = client.get(f"{API}/news", timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert d["status"] == "coming_soon"
        assert "message" in d


# ---- Results (external scrape) ----
class TestResults:
    def test_results_returns_json(self, client):
        r = client.get(f"{API}/results/2023UCS1234", timeout=20)
        assert r.status_code == 200
        d = r.json()
        # ok may be true or false; both acceptable
        assert "ok" in d


# ---- Profile CRUD ----
class TestProfile:
    def test_upsert_and_get_profile(self, client):
        roll = f"TEST{uuid.uuid4().hex[:8].upper()}"
        payload = {
            "roll_number": roll,
            "name": "TEST User",
            "branch": "CSE",
            "year": "2",
            "section": "A",
        }
        r = client.post(f"{API}/profile", json=payload, timeout=15)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["roll_number"] == roll
        assert d["name"] == "TEST User"
        assert "id" in d

        # Verify persistence via GET
        g = client.get(f"{API}/profile/{roll}", timeout=15)
        assert g.status_code == 200
        gd = g.json()
        assert gd is not None
        assert gd["roll_number"] == roll
        assert gd["branch"] == "CSE"
        assert gd["year"] == "2"
        assert gd["section"] == "A"

    def test_get_nonexistent_profile_returns_null(self, client):
        r = client.get(f"{API}/profile/TEST_NOT_EXIST_{uuid.uuid4().hex[:6]}", timeout=15)
        assert r.status_code == 200
        assert r.json() is None


# ---- Attendance CRUD ----
class TestAttendance:
    def test_save_and_get_attendance(self, client):
        roll = f"TEST{uuid.uuid4().hex[:8].upper()}"
        payload = {
            "roll_number": roll,
            "overall_percent": 82.5,
            "subjects": [
                {"name": "Data Structures", "code": "CS201", "percent": 85.0},
                {"name": "DBMS Lab", "code": "CS205P", "percent": 90.0},
            ],
        }
        r = client.post(f"{API}/attendance", json=payload, timeout=15)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["roll_number"] == roll
        assert d["overall_percent"] == 82.5
        assert len(d["subjects"]) == 2

        g = client.get(f"{API}/attendance/{roll}", timeout=15)
        assert g.status_code == 200
        gd = g.json()
        assert gd is not None
        assert gd["roll_number"] == roll
        assert gd["overall_percent"] == 82.5
        assert len(gd["subjects"]) == 2
        assert gd["subjects"][0]["name"] == "Data Structures"

    def test_get_nonexistent_attendance_returns_null(self, client):
        r = client.get(f"{API}/attendance/TEST_NO_ATT_{uuid.uuid4().hex[:6]}", timeout=15)
        assert r.status_code == 200
        assert r.json() is None
