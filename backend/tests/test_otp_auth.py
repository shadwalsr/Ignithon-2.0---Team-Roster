"""
Unit tests for OTP authentication mechanism:
- Generates 6-digit OTP
- Stores in-memory with 5-minute expiration
- Verifies matching OTP within 5 minutes
- Consumes OTP to prevent replay attack
- Rejects expired OTP
- Rejects invalid candidate OTP
- Tests /api/auth/otp/request and /api/auth/otp/verify endpoints
- Tests /api/auth/google endpoint
"""
import pytest
from datetime import datetime, timedelta, timezone
from fastapi.testclient import TestClient
from app.main import app
from app.db.session import init_db
from app.services.otp import (
    generate_otp, store_otp, verify_and_consume_otp, _otp_store
)

def test_otp_generation_and_storage():
    otp = generate_otp()
    assert len(otp) == 6
    assert otp.isdigit()

    email = "investigator.test@cybercell.gov.in"
    expires_at = store_otp(email, otp, expires_in_minutes=5)
    
    # Assert expiration is approximately 5 minutes ahead
    now = datetime.now(timezone.utc)
    diff = (expires_at - now).total_seconds()
    assert 290 <= diff <= 305

    # Successful verification
    ok, msg = verify_and_consume_otp(email, otp)
    assert ok is True

    # Cannot replay consumed OTP
    re_ok, re_msg = verify_and_consume_otp(email, otp)
    assert re_ok is False

def test_otp_expiration():
    email = "expired.test@cybercell.gov.in"
    otp = "123456"
    # Store with negative expiration (already expired)
    _otp_store[email] = (otp, datetime.now(timezone.utc) - timedelta(seconds=10))

    ok, msg = verify_and_consume_otp(email, otp)
    assert ok is False
    assert "expired" in msg.lower()

def test_otp_endpoints_flow():
    init_db()
    with TestClient(app) as client:
        test_email = "officer.sharma@cybercell.gov.in"

        # 1. Request OTP
        req_res = client.post("/api/auth/otp/request", json={"email": test_email})
        assert req_res.status_code == 200
        data = req_res.json()
        assert "5 minutes" in data["message"]
        dev_otp = data.get("dev_otp")
        assert dev_otp is not None
        assert len(dev_otp) == 6

        # 2. Try invalid OTP
        bad_res = client.post("/api/auth/otp/verify", json={"email": test_email, "otp": "000000"})
        assert bad_res.status_code == 400

        # 3. Verify valid OTP
        good_res = client.post("/api/auth/otp/verify", json={"email": test_email, "otp": dev_otp})
        assert good_res.status_code == 200
        tokens = good_res.json()
        assert "access_token" in tokens
        assert tokens["email"] == test_email

        # 4. Use token to get user profile
        me_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {tokens['access_token']}"})
        assert me_res.status_code == 200
        assert me_res.json()["email"] == test_email

def test_google_login_endpoint():
    init_db()
    with TestClient(app) as client:
        gmail = "investigator.singh@gmail.com"
        res = client.post("/api/auth/google", json={"email": gmail})
        assert res.status_code == 200
        tokens = res.json()
        assert tokens["email"] == gmail
        assert "access_token" in tokens
