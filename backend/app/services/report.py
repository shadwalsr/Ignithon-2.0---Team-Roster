"""
Incident Report Generator:
Compiles structured chronological incident reports with deterministic redaction,
forensic chain-of-custody hashes, and investigator mode support.
Maps strictly to PRD Section 12 & Section 11.3.
"""
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from app.services.redaction import redact, redact_text_content

REDACTION_LEGAL_NOTICE = (
    "REDACTION NOTICE: In accordance with statutory privacy principles and evidentiary guidelines, "
    "personally identifiable information (including mobile numbers, bank account/card digits, "
    "and email usernames) has been deterministically masked. Raw evidentiary records and cryptographic "
    "hashes are preserved in the forensic case repository for authorized judicial inspection."
)

def generate_incident_report(
    case_title: str,
    case_id: str,
    reconciled_data: Dict[str, Any],
    evidence_appendix_raw: List[Dict[str, Any]],
    is_investigator_mode: bool = False,
    accessed_at: Optional[str] = None
) -> Dict[str, Any]:
    """
    Renders structured incident report data.
    If is_investigator_mode is False, applies deterministic redaction across all items.
    """
    now_str = accessed_at or datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    
    # Process timeline items
    timeline_processed = []
    for item in reconciled_data.get("timeline", []):
        t_item = dict(item)
        if not is_investigator_mode:
            t_item["phone_numbers"] = redact("phone_numbers", t_item.get("phone_numbers", []))
            t_item["urls"] = redact("urls", t_item.get("urls", []))
            t_item["sender"] = redact("sender", t_item.get("sender"))
            t_item["recipient"] = redact("recipient", t_item.get("recipient"))
            t_item["raw_text_summary"] = redact("raw_text_summary", t_item.get("raw_text_summary", ""))
        timeline_processed.append(t_item)

    # Process unplaced items
    unplaced_processed = []
    for item in reconciled_data.get("unplaced_items", []):
        u_item = dict(item)
        if not is_investigator_mode:
            u_item["phone_numbers"] = redact("phone_numbers", u_item.get("phone_numbers", []))
            u_item["urls"] = redact("urls", u_item.get("urls", []))
            u_item["sender"] = redact("sender", u_item.get("sender"))
            u_item["recipient"] = redact("recipient", u_item.get("recipient"))
            u_item["raw_text_summary"] = redact("raw_text_summary", u_item.get("raw_text_summary", ""))
        unplaced_processed.append(u_item)

    # Process evidence appendix
    appendix_processed = []
    for app in evidence_appendix_raw:
        a_item = dict(app)
        if not is_investigator_mode:
            if a_item.get("extraction"):
                ext = dict(a_item["extraction"])
                ext["phone_numbers"] = redact("phone_numbers", ext.get("phone_numbers", []))
                ext["urls"] = redact("urls", ext.get("urls", []))
                ext["sender"] = redact("sender", ext.get("sender"))
                ext["raw_text_summary"] = redact("raw_text_summary", ext.get("raw_text_summary", ""))
                a_item["extraction"] = ext
            if a_item.get("raw_text"):
                a_item["raw_text"] = redact_text_content(a_item["raw_text"])
        appendix_processed.append(a_item)

    audit_banner = None
    if is_investigator_mode:
        audit_banner = f"INVESTIGATOR MODE ACTIVE: Unredacted forensic view accessed at {now_str}. This access has been permanently logged in the audit ledger."

    return {
        "case_id": case_id,
        "case_title": case_title,
        "generated_at": now_str,
        "is_unredacted_view": is_investigator_mode,
        "audit_banner": audit_banner,
        "metrics": reconciled_data.get("metrics", {}),
        "timeline": timeline_processed,
        "unplaced_items": unplaced_processed,
        "gaps": reconciled_data.get("gaps", []),
        "conflicts": reconciled_data.get("conflicts", []),
        "evidence_appendix": appendix_processed,
        "redaction_notice": REDACTION_LEGAL_NOTICE
    }
