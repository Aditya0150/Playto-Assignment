# Community Feed Prototype

A threaded discussion platform with a dynamic 24-hour karma leaderboard.

## Features
- **Threaded Comments**: Efficiently loaded in a single query.
- **Karma System**: 5 points for post likes, 1 point for comment likes.
- **Dynamic Leaderboard**: Real-time calculation based on activity in the last 24 hours.
- **Responsive UI**: Built with React and Tailwind CSS.

## Tech Stack
- **Backend**: Django, Django REST Framework
- **Frontend**: React (Vite), Tailwind CSS
- **Database**: SQLite (default for development), PostgreSQL (for production)

## Getting Started

### Backend Setup
1. Navigate to the `backend` directory.
2. Install dependencies: `pip install -r requirements.txt`.
3. Run migrations: `python manage.py migrate`.
4. Seed test data: `python seed_data.py`.
5. Start the server: `python manage.py runserver`.

### Frontend Setup
1. Navigate to the `frontend` directory.
2. Install dependencies: `npm install`.
3. Start the dev server: `npm run dev`.

## Deployment
This project is configured for:
- **Frontend**: Vercel (see `frontend/vercel.json`)
- **Backend**: Render (see `render.yaml`)

## Explainer
See [EXPLAINER.md](./EXPLAINER.md) for technical details on the comment threading and leaderboard logic.

