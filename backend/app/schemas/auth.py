from pydantic import BaseModel, EmailStr, Field
from typing import Optional

class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, description="Password at least 6 characters")
    otp: str = Field(min_length=6, max_length=6, description="6-digit verification code sent to this email")

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    email: str

class UserOut(BaseModel):
    id: str
    email: str
    created_at: str

class OTPRequest(BaseModel):
    email: EmailStr

class OTPVerify(BaseModel):
    email: EmailStr
    otp: str = Field(min_length=6, max_length=6, description="6-digit verification code")

class OTPResponse(BaseModel):
    message: str
    expires_in_minutes: int = 5
    dev_otp: Optional[str] = None  # Provided in dev/mock environments when SMTP is not configured

class GoogleLoginRequest(BaseModel):
    credential: Optional[str] = None  # Google ID token credential from Google Identity Services
    email: Optional[EmailStr] = None  # Fallback for mock/direct Gmail login in development
