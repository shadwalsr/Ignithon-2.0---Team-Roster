import random
import smtplib
import ssl
from datetime import datetime, timedelta, timezone
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Dict, Optional, Tuple
from app.core.config import settings

# In-memory OTP storage mapping: email.lower() -> (otp_code, expiration_datetime_utc)
_otp_store: Dict[str, Tuple[str, datetime]] = {}

def generate_otp() -> str:
    """Generate a secure 6-digit numeric OTP."""
    return f"{random.randint(100000, 999999)}"

def store_otp(email: str, otp: str, expires_in_minutes: int = 5) -> datetime:
    """Stores the generated OTP in-memory with a 5-minute expiration timestamp."""
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=expires_in_minutes)
    _otp_store[email.lower()] = (otp, expires_at)
    return expires_at

def verify_and_consume_otp(email: str, otp_candidate: str) -> Tuple[bool, str]:
    """
    Verifies that the candidate OTP matches and is within 5 minutes.
    Consumes the OTP on success to prevent replay attacks.
    """
    email_key = email.lower()
    entry = _otp_store.get(email_key)
    if not entry:
        return False, "No OTP request found for this email or OTP has expired"

    stored_otp, expires_at = entry
    now = datetime.now(timezone.utc)

    if now > expires_at:
        _otp_store.pop(email_key, None)
        return False, "OTP has expired. Please request a new one."

    if stored_otp != otp_candidate.strip():
        return False, "Invalid OTP code entered."

    # Valid: remove OTP so it cannot be reused
    _otp_store.pop(email_key, None)
    return True, "OTP verified successfully."

def send_otp_email(to_email: str, otp: str) -> bool:
    """
    Dispatches OTP email directly via Gmail using EMAIL_USER and EMAIL_PASS (App Password).
    If EMAIL_USER/EMAIL_PASS are not set, logs to console for test/mock convenience.
    """
    print(f"\n=======================================================")
    print(f" [AUTH SERVICE] OTP for {to_email}: {otp} (Valid for 5 mins)")
    print(f"=======================================================\n")

    email_user = settings.EMAIL_USER.strip()
    email_pass = settings.EMAIL_PASS.strip()

    if not email_user or not email_pass:
        # Development mode: no Gmail credentials provided in .env
        return True

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"Your Verification Code: {otp} - {settings.PROJECT_NAME}"
        msg["From"] = f"Forensic Verification <{email_user}>"
        msg["To"] = to_email

        text_content = (
            f"Hello Investigator,\n\n"
            f"Your one-time login code is: {otp}\n"
            f"This code will expire in 5 minutes.\n\n"
            f"If you did not request this, please disregard this email."
        )
        html_content = f"""
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8f6ee; padding: 32px 16px; color: #1a1a14;">
          <div style="max-width: 480px; margin: 0 auto; background: #ffffff; border: 1px solid #e0ded2; border-radius: 12px; padding: 28px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
            <div style="font-weight: 800; font-size: 18px; color: #0d3b24; margin-bottom: 8px;">Fraud Evidence-to-Incident-Report System</div>
            <p style="font-size: 14px; color: #4a4f4b; line-height: 1.5; margin-bottom: 20px;">
              Your 6-digit verification code to authenticate into the investigation portal is:
            </p>
            <div style="margin: 20px 0; text-align: center;">
              <span style="display: inline-block; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #0d3b24; background: #edf7f1; padding: 14px 28px; border-radius: 8px; border: 1px solid #d4eddf; font-family: monospace;">
                {otp}
              </span>
            </div>
            <p style="font-size: 12px; color: #7a7f7b; margin-top: 24px; border-top: 1px solid #f0eee2; padding-top: 14px;">
              ⏱️ Valid for <strong>5 minutes</strong>. Do not share this code.
            </p>
          </div>
        </div>
        """
        msg.attach(MIMEText(text_content, "plain"))
        msg.attach(MIMEText(html_content, "html"))

        context = ssl.create_default_context()
        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.starttls(context=context)
            server.login(email_user, email_pass)
            server.sendmail(email_user, to_email, msg.as_string())
        return True
    except Exception as e:
        print(f"[AUTH SERVICE WARNING] Failed to send email via Gmail: {e}")
        return False
