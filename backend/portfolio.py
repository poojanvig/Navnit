import json
from datetime import datetime

import httpx
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from auth import get_current_user
from config import CASPARSER_API_KEY, CASPARSER_BASE_URL
from database import get_db
from models import Portfolio, User
from schemas import OTPRequest, OTPVerify

router = APIRouter(prefix="/api/portfolio", tags=["portfolio"])

API = CASPARSER_BASE_URL
HEADERS = {"x-api-key": CASPARSER_API_KEY}


def merge_into_portfolio(existing_data: dict, new_data: dict) -> dict:
    """Merge new CAS data into existing portfolio, deduplicating by bo_id / folio_number."""
    if not existing_data or "investor" not in existing_data:
        return new_data

    # Merge demat accounts by bo_id
    demat_map = {}
    for acct in existing_data.get("demat_accounts", []):
        demat_map[acct.get("bo_id", "")] = acct
    for acct in new_data.get("demat_accounts", []):
        bo = acct.get("bo_id", "")
        if not bo:
            continue
        if bo not in demat_map or acct.get("value", 0) >= demat_map[bo].get("value", 0):
            demat_map[bo] = acct
    existing_data["demat_accounts"] = list(demat_map.values())

    # Merge MF folios by folio_number
    folio_map = {}
    for f in existing_data.get("mutual_funds", []):
        folio_map[f.get("folio_number", "")] = f
    for f in new_data.get("mutual_funds", []):
        fno = f.get("folio_number", "")
        if not fno:
            continue
        if fno not in folio_map or f.get("value", 0) >= folio_map[fno].get("value", 0):
            folio_map[fno] = f
    existing_data["mutual_funds"] = list(folio_map.values())

    # Recalculate summary
    demat_val = sum(a.get("value", 0) for a in existing_data["demat_accounts"])
    mf_val = sum(f.get("value", 0) for f in existing_data["mutual_funds"])
    existing_data["summary"] = {
        "total_value": demat_val + mf_val,
        "accounts": {
            "demat": {"count": len(existing_data["demat_accounts"]), "total_value": demat_val},
            "mutual_funds": {"count": len(existing_data["mutual_funds"]), "total_value": mf_val},
            "insurance": existing_data.get("summary", {}).get("accounts", {}).get("insurance", {"count": 0, "total_value": 0}),
            "nps": existing_data.get("summary", {}).get("accounts", {}).get("nps", {"count": 0, "total_value": 0}),
        },
    }

    # Keep investor from latest
    if "investor" in new_data:
        existing_data["investor"] = new_data["investor"]

    return existing_data


@router.post("/request-otp")
def request_otp(req: OTPRequest, user: User = Depends(get_current_user)):
    resp = httpx.post(
        f"{API}/v4/cdsl/fetch",
        headers={**HEADERS, "Content-Type": "application/json"},
        json={"pan": req.pan.upper(), "bo_id": req.bo_id, "dob": req.dob},
        timeout=60,
    )
    data = resp.json()

    if resp.status_code >= 400 or data.get("status") == "failed":
        raise HTTPException(resp.status_code or 400, data.get("msg", "OTP request failed"))

    session_id = data.get("session_id") or data.get("request_id")
    return {"session_id": session_id, "message": data.get("msg", "OTP sent")}


@router.post("/verify-otp")
def verify_otp(
    req: OTPVerify,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Step 1: Verify OTP and get PDF URLs
    resp = httpx.post(
        f"{API}/v4/cdsl/fetch/{req.session_id}/verify",
        headers={**HEADERS, "Content-Type": "application/json"},
        json={"otp": req.otp, "num_periods": req.num_periods},
        timeout=120,
    )
    data = resp.json()

    if resp.status_code >= 400 or data.get("status") == "failed":
        raise HTTPException(resp.status_code or 400, data.get("msg", "OTP verification failed"))

    files = data.get("files", [])
    if not files:
        raise HTTPException(400, "No CAS files returned")

    # Step 2: Download and parse each PDF
    all_parsed = []
    pan = ""
    for f in files:
        url = f.get("url", "")
        name = f.get("filename", "file.pdf")
        if not url:
            continue
        try:
            pdf_resp = httpx.get(url, timeout=60)
            if pdf_resp.status_code != 200:
                continue
            parse_resp = httpx.post(
                f"{API}/v4/cdsl/parse",
                headers=HEADERS,
                files={"file": (name, pdf_resp.content, "application/pdf")},
                data={"password": ""},
                timeout=120,
            )
            parsed = parse_resp.json()
            if "investor" in parsed:
                all_parsed.append(parsed)
                pan = parsed.get("investor", {}).get("pan", pan)
        except Exception:
            continue

    if not all_parsed:
        raise HTTPException(500, "Failed to parse any CAS files")

    # Step 3: Merge all parsed data
    merged = all_parsed[0]
    for extra in all_parsed[1:]:
        merged = merge_into_portfolio(merged, extra)

    # Step 4: Store in DB (upsert by user + PAN)
    investor_name = merged.get("investor", {}).get("name", "")
    total_value = merged.get("summary", {}).get("total_value", 0)

    portfolio = db.query(Portfolio).filter(
        Portfolio.user_id == user.id, Portfolio.pan == pan
    ).first()

    if portfolio:
        existing = portfolio.get_data()
        merged = merge_into_portfolio(existing, merged)
        portfolio.set_data(merged)
        portfolio.investor_name = investor_name
        portfolio.total_value = merged.get("summary", {}).get("total_value", 0)
        portfolio.updated_at = datetime.utcnow()
    else:
        portfolio = Portfolio(
            user_id=user.id,
            pan=pan,
            investor_name=investor_name,
            total_value=total_value,
        )
        portfolio.set_data(merged)
        db.add(portfolio)

    db.commit()
    db.refresh(portfolio)

    return {
        "portfolio_id": portfolio.id,
        "investor_name": investor_name,
        "total_value": portfolio.total_value,
        "message": f"Parsed {len(all_parsed)} statement(s)",
    }


@router.post("/seed")
def seed_portfolio(
    payload: dict,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Seed portfolio with pre-parsed CAS data (for migration/demo)."""
    data = payload.get("data", {})
    if "investor" not in data:
        raise HTTPException(400, "Invalid portfolio data")

    pan = data.get("investor", {}).get("pan", "")
    investor_name = data.get("investor", {}).get("name", "")
    total_value = data.get("summary", {}).get("total_value", 0)

    portfolio = db.query(Portfolio).filter(
        Portfolio.user_id == user.id, Portfolio.pan == pan
    ).first()

    if portfolio:
        existing = portfolio.get_data()
        merged = merge_into_portfolio(existing, data)
        portfolio.set_data(merged)
        portfolio.investor_name = investor_name
        portfolio.total_value = merged.get("summary", {}).get("total_value", 0)
        portfolio.updated_at = datetime.utcnow()
    else:
        portfolio = Portfolio(
            user_id=user.id, pan=pan,
            investor_name=investor_name, total_value=total_value,
        )
        portfolio.set_data(data)
        db.add(portfolio)

    db.commit()
    db.refresh(portfolio)
    return {"portfolio_id": portfolio.id, "total_value": portfolio.total_value}


@router.get("/")
def list_portfolios(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    portfolios = db.query(Portfolio).filter(Portfolio.user_id == user.id).all()
    return [
        {
            "id": p.id,
            "pan": p.pan,
            "investor_name": p.investor_name,
            "total_value": p.total_value,
            "fetched_at": p.fetched_at.isoformat(),
            "updated_at": p.updated_at.isoformat() if p.updated_at else None,
        }
        for p in portfolios
    ]


@router.get("/{portfolio_id}")
def get_portfolio(
    portfolio_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    portfolio = db.query(Portfolio).filter(
        Portfolio.id == portfolio_id, Portfolio.user_id == user.id
    ).first()
    if not portfolio:
        raise HTTPException(404, "Portfolio not found")

    data = portfolio.get_data()
    data["_meta"] = {
        "portfolio_id": portfolio.id,
        "fetched_at": portfolio.fetched_at.isoformat(),
        "updated_at": portfolio.updated_at.isoformat() if portfolio.updated_at else None,
    }
    return data
