import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Text, Float, DateTime, ForeignKey, JSON
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

def get_utc_now():
    return datetime.now(timezone.utc)

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), default=get_utc_now)

    cases = relationship("Case", back_populates="user", cascade="all, delete-orphan")

class Case(Base):
    __tablename__ = "cases"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=get_utc_now)

    user = relationship("User", back_populates="cases")
    evidence_items = relationship("EvidenceItem", back_populates="case", cascade="all, delete-orphan")
    gaps = relationship("Gap", back_populates="case", cascade="all, delete-orphan")
    conflicts = relationship("Conflict", back_populates="case", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="case", cascade="all, delete-orphan")

class EvidenceItem(Base):
    __tablename__ = "evidence_items"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    case_id = Column(String(36), ForeignKey("cases.id"), nullable=False, index=True)
    evidence_type = Column(String(50), nullable=False, default="other")
    raw_image_path = Column(String(500), nullable=True)
    raw_text = Column(Text, nullable=True)
    sha256_hash = Column(String(64), nullable=True)
    created_at = Column(DateTime(timezone=True), default=get_utc_now)

    case = relationship("Case", back_populates="evidence_items")
    extracted_field = relationship("ExtractedField", back_populates="evidence_item", uselist=False, cascade="all, delete-orphan")

class ExtractedField(Base):
    __tablename__ = "extracted_fields"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    evidence_item_id = Column(String(36), ForeignKey("evidence_items.id"), nullable=False, unique=True, index=True)
    evidence_type = Column(String(50), default="other")
    timestamp = Column(String(50), nullable=True)  # ISO8601 string
    timestamp_confidence = Column(String(20), default="medium")
    amount = Column(Float, nullable=True)
    currency = Column(String(10), default="INR")
    transaction_id = Column(String(100), nullable=True)
    phone_numbers = Column(JSON, default=list)
    urls = Column(JSON, default=list)
    sender = Column(String(255), nullable=True)
    recipient = Column(String(255), nullable=True)
    raw_text_summary = Column(Text, default="")
    extraction_confidence = Column(String(20), default="medium")

    evidence_item = relationship("EvidenceItem", back_populates="extracted_field")

class Gap(Base):
    __tablename__ = "gaps"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    case_id = Column(String(36), ForeignKey("cases.id"), nullable=False, index=True)
    type = Column(String(50), nullable=False)  # temporal | structural
    evidence_id_1 = Column(String(36), nullable=True)
    evidence_id_2 = Column(String(36), nullable=True)
    description = Column(Text, nullable=False)
    duration_minutes = Column(Float, nullable=True)

    case = relationship("Case", back_populates="gaps")

class Conflict(Base):
    __tablename__ = "conflicts"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    case_id = Column(String(36), ForeignKey("cases.id"), nullable=False, index=True)
    field = Column(String(50), nullable=False)  # amount | timestamp | sender | transaction_id
    evidence_id_1 = Column(String(36), nullable=True)
    evidence_id_2 = Column(String(36), nullable=True)
    value_1 = Column(String(255), nullable=True)
    value_2 = Column(String(255), nullable=True)
    description = Column(Text, nullable=False)

    case = relationship("Case", back_populates="conflicts")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    case_id = Column(String(36), ForeignKey("cases.id"), nullable=False, index=True)
    user_id = Column(String(36), nullable=False)
    action = Column(String(100), nullable=False)  # e.g., "UNREDACTED_VIEW_ACCESSED"
    timestamp = Column(DateTime(timezone=True), default=get_utc_now)
    details = Column(Text, nullable=True)

    case = relationship("Case", back_populates="audit_logs")
