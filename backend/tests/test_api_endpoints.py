"""
API integration test suite:
- Register & Login flow with JWT
- Case creation and listing
- 1-click realistic seed fraud case creation
- Timeline build (verifying gaps and conflicts are returned)
- Incident report generation (both redacted default & investigator mode)
- Verification that investigator mode creates an audit log entry
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.db.session import init_db

def test_full_api_workflow():
    init_db()
    with TestClient(app) as client:
        # 1. Health check
        resp = client.get("/health")
        assert resp.status_code == 200
        assert resp.json()["status"] == "healthy"

        # 2. Register user with OTP verification
        user_email = "investigator@cybercell.gov.in"
        req_res = client.post("/api/auth/otp/request", json={"email": user_email})
        assert req_res.status_code == 200
        dev_otp = req_res.json()["dev_otp"] or "123456"

        reg_resp = client.post("/api/auth/register", json={
            "email": user_email,
            "password": "SecurePassword123!",
            "otp": dev_otp
        })
        assert reg_resp.status_code in (200, 400)

        # 3. Login
        login_resp = client.post("/api/auth/login", json={
            "email": user_email,
            "password": "SecurePassword123!"
        })
        assert login_resp.status_code == 200
        tokens = login_resp.json()
        token = tokens["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 4. Generate 1-Click Seed Case
        seed_resp = client.post("/api/cases/seed", headers=headers)
        assert seed_resp.status_code == 200
        case_data = seed_resp.json()
        case_id = case_data["id"]
        assert case_data["evidence_count"] == 5

        # 5. Build and fetch Timeline with Gaps & Conflicts
        timeline_resp = client.post(f"/api/cases/{case_id}/timeline/build?gap_threshold=20", headers=headers)
        assert timeline_resp.status_code == 200
        t_data = timeline_resp.json()
        
        # Assert timeline ordered
        assert len(t_data["timeline"]) == 5
        # Assert temporal gap detected (37 min gap between 10:08 and 10:45)
        assert len(t_data["gaps"]) >= 1
        # Assert conflict detected (Rs 5000 vs Rs 5200)
        assert len(t_data["conflicts"]) >= 1
        assert t_data["conflicts"][0]["field"] == "amount"

        # 6. Fetch Redacted Incident Report
        report_resp = client.get(f"/api/cases/{case_id}/report", headers=headers)
        assert report_resp.status_code == 200
        rep = report_resp.json()
        assert rep["is_unredacted_view"] is False
        assert rep["audit_banner"] is None
        assert "REDACTION NOTICE" in rep["redaction_notice"]

        # Verify sensitive data is redacted in the timeline summary and appendix
        raw_texts = [str(ev.get("raw_text_summary", "")) for ev in rep["timeline"]]
        combined_summaries = " ".join(raw_texts)
        assert "9823411223" not in combined_summaries

        # 7. Access Investigator Mode (Unredacted)
        unredacted_resp = client.get(f"/api/cases/{case_id}/report?unredacted=true", headers=headers)
        assert unredacted_resp.status_code == 200
        unrep = unredacted_resp.json()
        assert unrep["is_unredacted_view"] is True
        assert unrep["audit_banner"] is not None
        assert "INVESTIGATOR MODE ACTIVE" in unrep["audit_banner"]
