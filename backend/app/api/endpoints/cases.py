import os
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.entities import User, Case, EvidenceItem, ExtractedField, Gap, Conflict, AuditLog
from app.schemas.case import (
    CaseCreate, CaseResponse, TimelineResponse, ReportResponse, GapSchema, ConflictSchema
)
from app.schemas.evidence import (
    EvidenceItemResponse, ExtractedFieldSchema, ExtractedFieldUpdate
)
from app.services.reconciliation import (
    compute_sha256, build_reconciled_case
)
from app.services.extraction import extract_from_evidence
from app.services.report import generate_incident_report
from app.core.config import settings

router = APIRouter(prefix="/cases", tags=["cases"])

os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

@router.post("", response_model=CaseResponse)
def create_case(case_in: CaseCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Parameterized query strictly scoped to current user
    new_case = Case(
        user_id=current_user.id,
        title=case_in.title,
        description=case_in.description
    )
    db.add(new_case)
    db.commit()
    db.refresh(new_case)
    return CaseResponse(
        id=new_case.id,
        user_id=new_case.user_id,
        title=new_case.title,
        description=new_case.description,
        created_at=new_case.created_at.isoformat(),
        evidence_count=0
    )

@router.get("", response_model=List[CaseResponse])
def list_cases(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Scoped query (IDOR safe)
    cases = db.query(Case).filter(Case.user_id == current_user.id).order_by(Case.created_at.desc()).all()
    results = []
    for c in cases:
        ev_count = db.query(EvidenceItem).filter(EvidenceItem.case_id == c.id).count()
        results.append(CaseResponse(
            id=c.id,
            user_id=c.user_id,
            title=c.title,
            description=c.description,
            created_at=c.created_at.isoformat(),
            evidence_count=ev_count
        ))
    return results

@router.get("/{case_id}", response_model=CaseResponse)
def get_case(case_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    case = db.query(Case).filter(Case.id == case_id, Case.user_id == current_user.id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found or access denied")
    ev_count = db.query(EvidenceItem).filter(EvidenceItem.case_id == case.id).count()
    return CaseResponse(
        id=case.id,
        user_id=case.user_id,
        title=case.title,
        description=case.description,
        created_at=case.created_at.isoformat(),
        evidence_count=ev_count
    )

@router.post("/{case_id}/evidence", response_model=EvidenceItemResponse)
async def upload_evidence(
    case_id: str,
    evidence_type: str = Form("other"),
    raw_text: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    case = db.query(Case).filter(Case.id == case_id, Case.user_id == current_user.id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    image_path = None
    file_bytes = None
    sha_hash = None

    if file and file.filename:
        file_bytes = await file.read()
        if len(file_bytes) > settings.MAX_UPLOAD_SIZE_BYTES:
            raise HTTPException(status_code=400, detail="File exceeds maximum size limit (10MB)")
        
        # Hardened filename with UUID (PRD Section 6b)
        ext = os.path.splitext(file.filename)[1].lower()
        if ext not in [".jpg", ".jpeg", ".png", ".webp", ".pdf", ".txt"]:
            ext = ".dat"
        safe_filename = f"{uuid.uuid4().hex}{ext}"
        image_path = os.path.join(settings.UPLOAD_DIR, safe_filename)
        
        with open(image_path, "wb") as f:
            f.write(file_bytes)
        sha_hash = compute_sha256(file_bytes)
    elif raw_text:
        sha_hash = compute_sha256(raw_text.encode("utf-8"))

    # Save evidence item
    ev_item = EvidenceItem(
        case_id=case.id,
        evidence_type=evidence_type,
        raw_image_path=image_path,
        raw_text=raw_text,
        sha256_hash=sha_hash
    )
    db.add(ev_item)
    db.commit()
    db.refresh(ev_item)

    # Trigger extraction immediately (PRD Section 5 step 3)
    extracted = await extract_from_evidence(
        evidence_id=ev_item.id,
        evidence_type=evidence_type,
        raw_text=raw_text,
        image_bytes=file_bytes,
        image_filename=file.filename if file else None
    )

    db_extracted = ExtractedField(
        evidence_item_id=ev_item.id,
        evidence_type=extracted.evidence_type,
        timestamp=extracted.timestamp,
        timestamp_confidence=extracted.timestamp_confidence,
        amount=extracted.amount,
        currency=extracted.currency,
        transaction_id=extracted.transaction_id,
        phone_numbers=extracted.phone_numbers,
        urls=extracted.urls,
        sender=extracted.sender,
        recipient=extracted.recipient,
        raw_text_summary=extracted.raw_text_summary,
        extraction_confidence=extracted.extraction_confidence
    )
    db.add(db_extracted)
    db.commit()

    return EvidenceItemResponse(
        id=ev_item.id,
        case_id=ev_item.case_id,
        evidence_type=ev_item.evidence_type,
        raw_image_path=ev_item.raw_image_path,
        raw_text=ev_item.raw_text,
        sha256_hash=ev_item.sha256_hash,
        created_at=ev_item.created_at.isoformat(),
        extraction=extracted
    )

@router.get("/{case_id}/evidence", response_model=List[EvidenceItemResponse])
def get_case_evidence(case_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    case = db.query(Case).filter(Case.id == case_id, Case.user_id == current_user.id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    items = db.query(EvidenceItem).filter(EvidenceItem.case_id == case.id).order_by(EvidenceItem.created_at.asc()).all()
    res = []
    for item in items:
        ext_dict = None
        if item.extracted_field:
            ef = item.extracted_field
            ext_dict = ExtractedFieldSchema(
                evidence_id=item.id,
                evidence_type=ef.evidence_type,
                timestamp=ef.timestamp,
                timestamp_confidence=ef.timestamp_confidence,
                amount=ef.amount,
                currency=ef.currency,
                transaction_id=ef.transaction_id,
                phone_numbers=ef.phone_numbers or [],
                urls=ef.urls or [],
                sender=ef.sender,
                recipient=ef.recipient,
                raw_text_summary=ef.raw_text_summary or "",
                extraction_confidence=ef.extraction_confidence,
                source_evidence_id=item.id
            )
        res.append(EvidenceItemResponse(
            id=item.id,
            case_id=item.case_id,
            evidence_type=item.evidence_type,
            raw_image_path=item.raw_image_path,
            raw_text=item.raw_text,
            sha256_hash=item.sha256_hash,
            created_at=item.created_at.isoformat(),
            extraction=ext_dict
        ))
    return res

@router.patch("/{case_id}/evidence/{evidence_id}/extraction", response_model=ExtractedFieldSchema)
def update_extracted_field(
    case_id: str,
    evidence_id: str,
    update_in: ExtractedFieldUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    case = db.query(Case).filter(Case.id == case_id, Case.user_id == current_user.id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    ext = db.query(ExtractedField).filter(ExtractedField.evidence_item_id == evidence_id).first()
    if not ext:
        raise HTTPException(status_code=404, detail="Extracted fields not found")

    update_dict = update_in.model_dump(exclude_unset=True)
    for k, v in update_dict.items():
        setattr(ext, k, v)

    db.commit()
    db.refresh(ext)

    return ExtractedFieldSchema(
        evidence_id=evidence_id,
        evidence_type=ext.evidence_type,
        timestamp=ext.timestamp,
        timestamp_confidence=ext.timestamp_confidence,
        amount=ext.amount,
        currency=ext.currency,
        transaction_id=ext.transaction_id,
        phone_numbers=ext.phone_numbers or [],
        urls=ext.urls or [],
        sender=ext.sender,
        recipient=ext.recipient,
        raw_text_summary=ext.raw_text_summary,
        extraction_confidence=ext.extraction_confidence,
        source_evidence_id=evidence_id
    )

@router.post("/{case_id}/timeline/build", response_model=TimelineResponse)
def build_timeline(
    case_id: str,
    gap_threshold: int = settings.DEFAULT_GAP_THRESHOLD_MINUTES,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    case = db.query(Case).filter(Case.id == case_id, Case.user_id == current_user.id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    # Fetch all extracted items
    items = db.query(EvidenceItem).filter(EvidenceItem.case_id == case.id).all()
    extracted_items = []
    for item in items:
        if item.extracted_field:
            ef = item.extracted_field
            extracted_items.append({
                "evidence_id": item.id,
                "evidence_type": ef.evidence_type,
                "timestamp": ef.timestamp,
                "timestamp_confidence": ef.timestamp_confidence,
                "amount": ef.amount,
                "currency": ef.currency,
                "transaction_id": ef.transaction_id,
                "phone_numbers": ef.phone_numbers or [],
                "urls": ef.urls or [],
                "sender": ef.sender,
                "recipient": ef.recipient,
                "raw_text_summary": ef.raw_text_summary,
                "extraction_confidence": ef.extraction_confidence,
                "sha256_hash": item.sha256_hash
            })

    # Run Reconciliation Engine
    reconciled = build_reconciled_case(extracted_items, gap_threshold_minutes=gap_threshold)

    # Persist detected gaps & conflicts in DB
    db.query(Gap).filter(Gap.case_id == case.id).delete()
    db.query(Conflict).filter(Conflict.case_id == case.id).delete()

    for g in reconciled["gaps"]:
        between = g.get("between", [None, None])
        db.add(Gap(
            case_id=case.id,
            type=g["type"],
            evidence_id_1=between[0] if len(between) > 0 else None,
            evidence_id_2=between[1] if len(between) > 1 else None,
            description=g["description"],
            duration_minutes=g.get("duration_minutes")
        ))

    for c in reconciled["conflicts"]:
        e_ids = c.get("evidence_ids", [None, None])
        vals = c.get("values", [None, None])
        db.add(Conflict(
            case_id=case.id,
            field=c["field"],
            evidence_id_1=e_ids[0] if len(e_ids) > 0 else None,
            evidence_id_2=e_ids[1] if len(e_ids) > 1 else None,
            value_1=vals[0] if len(vals) > 0 else None,
            value_2=vals[1] if len(vals) > 1 else None,
            description=c["description"]
        ))
    db.commit()

    return TimelineResponse(
        case_id=case.id,
        timeline=reconciled["timeline"],
        unplaced_items=reconciled["unplaced_items"],
        gaps=[GapSchema(**g) for g in reconciled["gaps"]],
        conflicts=[ConflictSchema(**c) for c in reconciled["conflicts"]],
        metrics=reconciled["metrics"]
    )

@router.get("/{case_id}/report", response_model=ReportResponse)
def get_report(
    case_id: str,
    unredacted: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    case = db.query(Case).filter(Case.id == case_id, Case.user_id == current_user.id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    # If investigator mode (unredacted) is requested, log to AuditLog (PRD Section 11.3)
    if unredacted:
        audit = AuditLog(
            case_id=case.id,
            user_id=current_user.id,
            action="UNREDACTED_VIEW_ACCESSED",
            details=f"User {current_user.email} toggled investigator mode view."
        )
        db.add(audit)
        db.commit()

    # Rebuild current reconciled data
    items = db.query(EvidenceItem).filter(EvidenceItem.case_id == case.id).all()
    extracted_items = []
    appendix_items = []
    for item in items:
        if item.extracted_field:
            ef = item.extracted_field
            ext_dict = {
                "evidence_id": item.id,
                "evidence_type": ef.evidence_type,
                "timestamp": ef.timestamp,
                "timestamp_confidence": ef.timestamp_confidence,
                "amount": ef.amount,
                "currency": ef.currency,
                "transaction_id": ef.transaction_id,
                "phone_numbers": ef.phone_numbers or [],
                "urls": ef.urls or [],
                "sender": ef.sender,
                "recipient": ef.recipient,
                "raw_text_summary": ef.raw_text_summary,
                "extraction_confidence": ef.extraction_confidence,
                "sha256_hash": item.sha256_hash
            }
            extracted_items.append(ext_dict)
            appendix_items.append({
                "id": item.id,
                "evidence_type": item.evidence_type,
                "sha256_hash": item.sha256_hash,
                "raw_text": item.raw_text,
                "raw_image_path": item.raw_image_path,
                "extraction": ext_dict
            })

    reconciled = build_reconciled_case(extracted_items)
    report = generate_incident_report(
        case_title=case.title,
        case_id=case.id,
        reconciled_data=reconciled,
        evidence_appendix_raw=appendix_items,
        is_investigator_mode=unredacted
    )

    return ReportResponse(**report)

@router.post("/seed", response_model=CaseResponse)
def seed_demo_case(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    1-Click Seed Generator:
    Creates a realistic Indian fraud incident case with crafted gaps and contradictions
    perfect for live hackathon presentations!
    """
    case = Case(
        user_id=current_user.id,
        title="UPI Electricity KYC Phishing Extortion Incident",
        description="Victim deceived by electricity disconnection SMS leading to APK installation, unauthorized UPI transfers, and contradictory amount claims."
    )
    db.add(case)
    db.commit()
    db.refresh(case)

    # 1. Phishing SMS (10:00 AM)
    ev1 = EvidenceItem(
        case_id=case.id,
        evidence_type="sms",
        raw_text="Dear consumer, your electricity power will be disconnected tonight at 9:30 PM because your previous month bill was not updated. Please immediately contact electricity officer at +919823411223 or update at https://power-bill-update.in/kyc",
        sha256_hash=compute_sha256(b"sms_electricity_bill_unpaid")
    )
    db.add(ev1)
    db.commit()
    db.add(ExtractedField(
        evidence_item_id=ev1.id,
        evidence_type="sms",
        timestamp="2026-09-26T10:00:00Z",
        timestamp_confidence="high",
        phone_numbers=["+919823411223"],
        urls=["https://power-bill-update.in/kyc"],
        sender="VK-POWERC",
        raw_text_summary="SMS warning of imminent power disconnection directing victim to contact phone number or visit phishing portal.",
        extraction_confidence="high"
    ))

    # 2. Phishing URL Portal Access (10:08 AM)
    ev2 = EvidenceItem(
        case_id=case.id,
        evidence_type="log",
        raw_text="Victim visited https://power-bill-update.in/verify-portal?session=abc987 and submitted bank details for account 501004928172.",
        sha256_hash=compute_sha256(b"log_phishing_visit")
    )
    db.add(ev2)
    db.commit()
    db.add(ExtractedField(
        evidence_item_id=ev2.id,
        evidence_type="log",
        timestamp="2026-09-26T10:08:00Z",
        timestamp_confidence="high",
        urls=["https://power-bill-update.in/verify-portal?session=abc987"],
        raw_text_summary="Web navigation log showing access to deceptive bill verification portal and submission of credentials.",
        extraction_confidence="high"
    ))

    # 3. WhatsApp Chat screenshot / transcript (10:45 AM -> creates 37 minute gap between 10:08 and 10:45)
    ev3 = EvidenceItem(
        case_id=case.id,
        evidence_type="chat",
        raw_text="WhatsApp Chat with 'State Electricity Support' (+919823411223): Scammer: 'Sir to stop disconnection please send ₹10 verification charge via UPI and approve request'. Victim: 'I have approved the payment request.' Scammer: 'Transaction failed, approve the ₹5,200 security deposit refund request.'",
        sha256_hash=compute_sha256(b"chat_whatsapp_extortion")
    )
    db.add(ev3)
    db.commit()
    db.add(ExtractedField(
        evidence_item_id=ev3.id,
        evidence_type="chat",
        timestamp="2026-09-26T10:45:00Z",
        timestamp_confidence="high",
        amount=5200.0,
        currency="INR",
        transaction_id="UPI4920193850",
        phone_numbers=["+919823411223"],
        sender="Electricity Desk",
        raw_text_summary="WhatsApp chat instructing victim to authorize transaction, scammer quoting amount as INR 5,200.",
        extraction_confidence="high"
    ))

    # 4. Bank Debit SMS (10:46 AM -> amounts mismatch: ₹5,000 in bank vs ₹5,200 in chat!)
    ev4 = EvidenceItem(
        case_id=case.id,
        evidence_type="sms",
        raw_text="HDFC Bank Alert: Rs 5,000.00 debited from A/c XX4192 on 26-Sep-26 10:46:12 via UPI to powerbilldesk@okhdfcbank Ref UPI4920193850. Not you? Call +9118002664332.",
        sha256_hash=compute_sha256(b"sms_bank_debit_alert")
    )
    db.add(ev4)
    db.commit()
    db.add(ExtractedField(
        evidence_item_id=ev4.id,
        evidence_type="sms",
        timestamp="2026-09-26T10:46:00Z",
        timestamp_confidence="high",
        amount=5000.0,
        currency="INR",
        transaction_id="UPI4920193850",
        sender="HDFC-BANK",
        raw_text_summary="Official bank debit SMS notifying unauthorized transfer of INR 5,000 via UPI.",
        extraction_confidence="high"
    ))

    # 5. Subsequent APK Installation Chat (11:25 AM -> 39 min gap)
    ev5 = EvidenceItem(
        case_id=case.id,
        evidence_type="chat",
        raw_text="Scammer: 'Sir your refund is stuck in server. Please install AnyDesk QuickSupport or our electricity.apk to clear the hold.'",
        sha256_hash=compute_sha256(b"chat_apk_remote_access")
    )
    db.add(ev5)
    db.commit()
    db.add(ExtractedField(
        evidence_item_id=ev5.id,
        evidence_type="chat",
        timestamp="2026-09-26T11:25:00Z",
        timestamp_confidence="medium",
        phone_numbers=["+919823411223"],
        sender="Electricity Desk",
        raw_text_summary="Chat message coercing victim to install AnyDesk remote access tool / APK.",
        extraction_confidence="high"
    ))

    db.commit()

    return CaseResponse(
        id=case.id,
        user_id=case.user_id,
        title=case.title,
        description=case.description,
        created_at=case.created_at.isoformat(),
        evidence_count=5
    )
