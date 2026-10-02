# NSUT Hub

Premium all-in-one campus utility app for NSUT students built with Expo (React Native) + FastAPI + MongoDB.

## Features
- 🎓 IMS NSUT login via embedded WebView with credential autofill
- 📊 Attendance tracker scraped from IMS (per-subject progress)
- 🏫 Live vacant classrooms (IST-aware, 36 rooms × 10 time slots)
- 📈 Semester results via resulthubnsut.com scraping
- 📰 Trending news (coming soon)

## Design
Dark glassmorphic UI with NSUT crimson accent (#D32F2F). Full tokens in `design_guidelines.json`.

## Status
Work-in-progress. Current progress + next steps documented in **[HANDOFF.md](./HANDOFF.md)**.

## Stack
- Expo SDK 57 + expo-router
- FastAPI + Motor (MongoDB)
- react-native-webview, expo-blur, expo-linear-gradient, Feather icons

## Dev
```bash
# Backend
cd backend && pip install -r requirements.txt && uvicorn server:app --reload --port 8001

# Frontend
cd frontend && yarn && yarn start
```
