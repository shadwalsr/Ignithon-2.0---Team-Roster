from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from app.schemas.evidence import ExtractedFieldSchema, EvidenceItemResponse

class CaseCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: Optional[str] = None

class CaseResponse(BaseModel):
    id: str
    user_id: str
    title: str
    description: Optional[str] = None
    created_at: str
    evidence_count: int = 0

class GapSchema(BaseModel):
    gap_id: str
    type: str  # temporal | structural
    between: List[Optional[str]]
    description: str
    duration_minutes: Optional[float] = None

class ConflictSchema(BaseModel):
    conflict_id: str
    field: str
    evidence_ids: List[str]
    values: List[str]
    description: str

class TimelineResponse(BaseModel):
    case_id: str
    timeline: List[Dict[str, Any]]
    unplaced_items: List[Dict[str, Any]]
    gaps: List[GapSchema]
    conflicts: List[ConflictSchema]
    metrics: Dict[str, Any]

class AuditLogEntry(BaseModel):
    id: str
    case_id: str
    action: str
    timestamp: str
    details: Optional[str] = None

class ReportResponse(BaseModel):
    case_id: str
    case_title: str
    generated_at: str
    is_unredacted_view: bool = False
    audit_banner: Optional[str] = None
    metrics: Dict[str, Any]
    timeline: List[Dict[str, Any]]
    unplaced_items: List[Dict[str, Any]]
    gaps: List[GapSchema]
    conflicts: List[ConflictSchema]
    evidence_appendix: List[Dict[str, Any]]
    redaction_notice: str
