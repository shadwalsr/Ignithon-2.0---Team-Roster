from pydantic import BaseModel, Field
from typing import Optional, List, Literal

class ExtractedFieldSchema(BaseModel):
    evidence_id: str
    evidence_type: Literal["sms", "email", "chat", "transaction", "app_notification", "log", "other"] = "other"
    timestamp: Optional[str] = None
    timestamp_confidence: Literal["high", "medium", "low"] = "medium"
    amount: Optional[float] = None
    currency: str = "INR"
    transaction_id: Optional[str] = None
    phone_numbers: List[str] = Field(default_factory=list)
    urls: List[str] = Field(default_factory=list)
    sender: Optional[str] = None
    recipient: Optional[str] = None
    raw_text_summary: str = ""
    extraction_confidence: Literal["high", "medium", "low"] = "medium"
    source_evidence_id: Optional[str] = None

class EvidenceItemCreate(BaseModel):
    evidence_type: Optional[str] = "other"
    raw_text: Optional[str] = None

class EvidenceItemResponse(BaseModel):
    id: str
    case_id: str
    evidence_type: str
    raw_image_path: Optional[str] = None
    raw_text: Optional[str] = None
    sha256_hash: Optional[str] = None
    created_at: str
    extraction: Optional[ExtractedFieldSchema] = None

class ExtractedFieldUpdate(BaseModel):
    evidence_type: Optional[Literal["sms", "email", "chat", "transaction", "app_notification", "log", "other"]] = None
    timestamp: Optional[str] = None
    timestamp_confidence: Optional[Literal["high", "medium", "low"]] = None
    amount: Optional[float] = None
    currency: Optional[str] = None
    transaction_id: Optional[str] = None
    phone_numbers: Optional[List[str]] = None
    urls: Optional[List[str]] = None
    sender: Optional[str] = None
    recipient: Optional[str] = None
    raw_text_summary: Optional[str] = None
    extraction_confidence: Optional[Literal["high", "medium", "low"]] = None
