"""Verified schedule input and conservative, timetable-based room availability."""
from datetime import datetime, timezone, date
from typing import Literal
from zoneinfo import ZoneInfo
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator
import re

IST = ZoneInfo('Asia/Kolkata')

def minute(value: str) -> int:
    if not re.fullmatch(r'(?:[01]\d|2[0-3]):[0-5]\d', value):
        raise ValueError('Use 24-hour HH:MM')
    h, m = map(int, value.split(':'))
    return h * 60 + m

class Window(BaseModel):
    model_config = ConfigDict(extra='forbid')
    day: int = Field(ge=0, le=6)
    start: str
    end: str

    @model_validator(mode='after')
    def ordered(self):
        if minute(self.end) <= minute(self.start):
            raise ValueError('End must follow start; split overnight bookings by day')
        return self

class Booking(Window):
    title: str = Field(min_length=1, max_length=160)
    cancelled: bool = False

class Room(BaseModel):
    model_config = ConfigDict(extra='forbid')
    id: str = Field(min_length=1, max_length=80, pattern=r'^[\w .-]+$')
    building: str = Field(min_length=1, max_length=80)
    room_type: str = Field(default='Classroom', min_length=1, max_length=60)
    coverage: list[Window] = Field(default_factory=list, max_length=100)
    bookings: list[Booking] = Field(default_factory=list, max_length=200)

class Schedule(BaseModel):
    model_config = ConfigDict(extra='forbid')
    source: Literal['verified_schedule']
    source_url: str = Field(max_length=500)
    observed_at: datetime
    valid_from: date
    valid_until: date
    rooms: list[Room] = Field(min_length=1, max_length=200)

    @field_validator('source_url')
    @classmethod
    def trusted_source(cls, value):
        from urllib.parse import urlparse
        u = urlparse(value)
        if u.scheme != 'https' or u.hostname not in {'imsnsit.org', 'www.imsnsit.org', 'nsut.ac.in', 'www.nsut.ac.in'} or u.username or u.password or u.query or u.fragment:
            raise ValueError('Use an official HTTPS source URL without session parameters')
        return value

    @model_validator(mode='after')
    def valid(self):
        if self.observed_at.tzinfo is None or self.observed_at.timestamp() > datetime.now(timezone.utc).timestamp() + 60:
            raise ValueError('observed_at must be timezone-aware and not in the future')
        if self.valid_until < self.valid_from:
            raise ValueError('Invalid validity interval')
        ids = [r.id.casefold() for r in self.rooms]
        if len(ids) != len(set(ids)):
            raise ValueError('Room ids must be unique')
        return self

def availability(schedule: Schedule | None, now: datetime, max_age_seconds: int = 86400):
    local = now.astimezone(IST)
    current = local.hour * 60 + local.minute
    stale = schedule is not None and ((now - schedule.observed_at).total_seconds() > max_age_seconds or not schedule.valid_from <= local.date() <= schedule.valid_until)
    output = []
    for room in schedule.rooms if schedule else []:
        today = [b for b in room.bookings if b.day == local.weekday() and not b.cancelled]
        today.sort(key=lambda b: minute(b.start))
        active = [b for b in today if minute(b.start) <= current < minute(b.end)]
        covered = [w for w in room.coverage if w.day == local.weekday() and minute(w.start) <= current < minute(w.end)]
        future = next((b for b in today if minute(b.start) > current), None)
        change = None
        if stale:
            state, reason = 'unknown', 'Schedule is outdated or outside its validity dates.'
        elif active:
            state, reason = 'occupied', 'Occupied according to timetable; physical occupancy is not measured.'
            end = max(minute(b.end) for b in active)
            # Merge overlapping/adjacent bookings so we never promise a false gap.
            for b in today:
                if minute(b.start) <= end and minute(b.end) > current:
                    end = max(end, minute(b.end))
            change = end
        elif covered:
            state, reason = 'available', 'Available according to a complete timetable window; check on arrival.'
            end = max(minute(w.end) for w in covered)
            change = min(end, minute(future.start)) if future else end
        else:
            state, reason = 'unknown', 'No complete schedule coverage for this time. Missing bookings do not imply a free room.'
        output.append({'id': room.id, 'building': room.building, 'room_type': room.room_type,
                       'status': state, 'reason': reason, 'minutes_until_change': change - current if change is not None else None,
                       'next_class': {'title': future.title, 'start': future.start, 'end': future.end} if future and not stale else None})
    return {'as_of': now.isoformat(), 'timezone': 'Asia/Kolkata', 'source': schedule.source if schedule else None,
            'source_url': schedule.source_url if schedule else None, 'observed_at': schedule.observed_at.isoformat() if schedule else None,
            'stale': bool(stale), 'rooms': output, 'message': None if schedule else 'No verified room schedule has been imported. Availability is unknown.'}
