# Community Feed Prototype

A threaded discussion platform with a dynamic 24-hour karma leaderboard.

## Features
- Threaded comments loaded efficiently in a single query for a post.
- Karma system: 5 points for post likes, 1 point for comment likes.
- Dynamic leaderboard based on activity in the last 24 hours.
- Responsive UI built with React and Tailwind CSS.

## Tech Stack
- Backend: Django, Django REST Framework
- Frontend: React (Vite), Tailwind CSS
- Database: SQLite (local dev), PostgreSQL (production)

## Local Development

### Prereqs
- Python 3.11
- Node.js 18+ and npm

### Backend
1. `cd backend`
2. Create `backend/.env` from `backend/.env.example` and set at least `DEBUG=True` and `SECRET_KEY`.
3. (Optional) Create and activate a virtual environment.
4. `pip install -r requirements.txt`
5. `python manage.py migrate`
6. (Optional) Seed sample data: `python seed_data.py`
7. `python manage.py runserver`

Backend runs at `http://localhost:8000`.

### Frontend
1. `cd frontend`
2. Set `VITE_API_BASE_URL=http://localhost:8000/api` in `frontend/.env` for local dev.
3. `npm install`
4. `npm run dev`

Frontend runs at `http://localhost:5173`.

## Explainer
See `EXPLAINER.md` for the nested comment tree, leaderboard math, and AI audit details.
