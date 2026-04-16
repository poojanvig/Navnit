import json
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from auth import router as auth_router, hash_password
from database import SessionLocal, init_db
from models import Portfolio, User
from portfolio import router as portfolio_router

app = FastAPI(title="Navnit API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(portfolio_router)


@app.on_event("startup")
def startup():
    init_db()
    seed_demo_account()


def seed_demo_account():
    """Auto-create the demo account and portfolio if DB is empty."""
    db = SessionLocal()
    try:
        # Skip if account already exists
        if db.query(User).filter(User.email == "test@test.com").first():
            return

        # Create demo user
        user = User(
            name="Poojan",
            email="test@test.com",
            password_hash=hash_password("123456"),
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        # Load seed portfolio data
        seed_file = Path(__file__).parent / "seed_data.json"
        if not seed_file.exists():
            return

        data = json.loads(seed_file.read_text())
        portfolio = Portfolio(
            user_id=user.id,
            pan=data.get("investor", {}).get("pan", ""),
            investor_name=data.get("investor", {}).get("name", ""),
            total_value=data.get("summary", {}).get("total_value", 0),
        )
        portfolio.set_data(data)
        db.add(portfolio)
        db.commit()
    finally:
        db.close()


@app.get("/api/health")
def health():
    return {"status": "ok"}
