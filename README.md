# Navnit — Investment Portfolio Dashboard

A full-stack mobile + web app that fetches and displays Indian investment portfolio data (mutual funds, stocks, bonds, ETFs) from CDSL via [CASParser.in](https://casparser.in) API.

Built with **Expo (React Native)** + **FastAPI** + **SQLite**.

---

## Architecture

```
Navnit/
├── backend/              ← FastAPI server
│   ├── main.py           App entry, CORS, routers
│   ├── auth.py           Signup/login, JWT tokens
│   ├── portfolio.py      CASParser proxy, merge, store, seed
│   ├── models.py         SQLAlchemy models (User, Portfolio)
│   ├── schemas.py        Pydantic validation
│   ├── database.py       SQLite setup
│   ├── config.py         Environment variables
│   ├── render.yaml       Render deployment config
│   └── requirements.txt
├── mobile/               ← Expo (React Native) app
│   ├── app/
│   │   ├── index.tsx              Splash screen
│   │   ├── (auth)/login.tsx       Login
│   │   ├── (auth)/signup.tsx      Signup
│   │   ├── add-portfolio.tsx      PAN + BO ID + DOB form
│   │   ├── verify-otp.tsx         OTP verification
│   │   └── (main)/
│   │       ├── index.tsx          Dashboard
│   │       ├── holdings.tsx       Holdings detail
│   │       └── profile.tsx        User profile
│   ├── lib/
│   │   ├── api.ts         API client (all endpoints)
│   │   ├── auth.tsx       Auth context + token storage
│   │   ├── storage.ts     Cross-platform storage (SecureStore / localStorage)
│   │   └── theme.ts       CRED-style dark theme
│   ├── app.json           Expo config
│   └── eas.json           EAS Build + OTA config
├── test_casparser.py      CLI API tester (standalone)
└── dashboard.py           Streamlit dashboard (standalone)
```

---

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- Expo account (`npx expo login`)

### Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Create .env file
cat > .env << EOF
CASPARSER_API_KEY=your-api-key-here
JWT_SECRET=your-secret-here
DATABASE_URL=sqlite:///./navnit.db
EOF

# Run
uvicorn main:app --reload --port 8000
```

API docs available at http://localhost:8000/docs

### Mobile / Web App

```bash
cd mobile
npm install

# Run on web
npm run web

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android
```

### For local development

Set `EXPO_PUBLIC_API_URL=http://localhost:8000` or edit `PROD_URL` in `mobile/lib/api.ts` to point to localhost.

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/signup` | No | Create account |
| POST | `/api/auth/login` | No | Login, returns JWT |
| GET | `/api/auth/me` | Yes | Current user profile |
| POST | `/api/portfolio/request-otp` | Yes | CDSL OTP request (PAN + BO ID + DOB) |
| POST | `/api/portfolio/verify-otp` | Yes | Verify OTP, download + parse CAS PDFs, store |
| POST | `/api/portfolio/seed` | Yes | Seed portfolio with pre-parsed JSON data |
| GET | `/api/portfolio/` | Yes | List all portfolios |
| GET | `/api/portfolio/:id` | Yes | Full portfolio data |
| GET | `/api/health` | No | Health check |

---

## Deployment

### Backend — Render

1. Go to [dashboard.render.com](https://dashboard.render.com)
2. New → Web Service → Connect GitHub repo
3. Configure:
   - **Root Directory:** `backend`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type:** Free
4. Add environment variables:
   - `CASPARSER_API_KEY` — your CASParser API key
   - `JWT_SECRET` — any random secret string
   - `DATABASE_URL` — `sqlite:///./navnit.db`

Environment variables can be changed anytime from Render dashboard → Environment tab.

> **Note:** Render free tier resets SQLite on every redeploy. For persistent data, use Render PostgreSQL (free tier available).

### Mobile — EAS Build

```bash
cd mobile

# Android APK (for testing / direct install)
eas build --platform android --profile preview

# Android AAB (for Play Store)
eas build --platform android --profile production

# iOS (requires Apple Developer account)
eas build --platform ios --profile production
```

---

## OTA Updates

The app uses **EAS Update** for over-the-air JavaScript bundle updates. This means you can push UI changes, bug fixes, and logic updates **without rebuilding the APK**.

### Push an OTA update

```bash
cd mobile
eas update --branch preview --message "description of what changed"
```

The app will automatically download the new bundle on next launch.

### When OTA works (no rebuild needed)

- UI / styling changes
- New screens or screen modifications
- API logic changes
- Bug fixes in JavaScript/TypeScript code
- Theme updates

### When you need a new build

- Adding / removing native packages (e.g. `expo install expo-camera`)
- Changing `app.json` configuration
- Upgrading Expo SDK version
- Changing native Android/iOS settings

---

## Standalone Tools

### CLI API Tester

```bash
source .venv/bin/activate
python test_casparser.py
```

Interactive menu to test CASParser API endpoints directly (smart parse, CDSL OTP fetch, CAS generator, credits check).

### Streamlit Dashboard

```bash
source .venv/bin/activate
streamlit run dashboard.py
```

Web-based portfolio dashboard that auto-aggregates all saved JSON response files by PAN.

---

## Data Flow

```
User enters PAN + BO ID + DOB
        │
        ▼
Backend → CASParser /v4/cdsl/fetch (request OTP)
        │
        ▼
User enters OTP received on mobile
        │
        ▼
Backend → CASParser /v4/cdsl/fetch/{session}/verify
        │    Returns PDF download URLs
        ▼
Backend → Downloads each PDF
        │
        ▼
Backend → CASParser /v4/cdsl/parse (for each PDF)
        │    Returns structured JSON
        ▼
Backend → Merges all data (dedup by bo_id / folio_number)
        │
        ▼
Backend → Stores in SQLite (upsert by user + PAN)
        │
        ▼
App displays dashboard with portfolio data
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile + Web | Expo (React Native), TypeScript, expo-router |
| Backend | FastAPI, SQLAlchemy, SQLite |
| Auth | JWT (python-jose), bcrypt |
| Data Source | CASParser.in API (CDSL OTP fetch + CAS parse) |
| Deployment | Render (backend), EAS Build (mobile) |
| OTA Updates | EAS Update |

---

## Environment Variables

### Backend (`.env`)

| Variable | Description |
|----------|-------------|
| `CASPARSER_API_KEY` | API key from [app.casparser.in](https://app.casparser.in) |
| `JWT_SECRET` | Secret for signing JWT tokens |
| `DATABASE_URL` | Database connection string |

### Mobile (`eas.json` env or `.env`)

| Variable | Description |
|----------|-------------|
| `EXPO_PUBLIC_API_URL` | Backend API URL (defaults to Render URL) |

---

## Test Account

For demo purposes:

| Field | Value |
|-------|-------|
| Email | `test@test.com` |
| Password | `123456` |

> Note: Account needs to be re-created after Render free tier redeploys (SQLite resets).

---

## Roadmap

- [ ] Account Aggregator (AA) integration — PAN-only flow, no BO ID needed
- [ ] PostgreSQL for persistent production data
- [ ] NSDL support
- [ ] Push notifications for portfolio changes
- [ ] Investment analytics and recommendations
