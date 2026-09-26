"""
Reconciliation Engine:
- Chronological timeline sorting & unplaced item management
- Temporal gap detection (> threshold, default 20 mins)
- Structural / referential gap detection (referenced transactions or events missing)
- Structured-field contradiction detection (amount, time, sender, txn ID)
Maps strictly to PRD Sections 8, 9, 10.
"""
from datetime import datetime, timezone
import hashlib
from typing import List, Dict, Any, Optional, Tuple
import uuid

def parse_iso_timestamp(ts: Optional[str]) -> Optional[datetime]:
    if not ts:
        return None
    try:
        # Handle ISO strings with Z or offset
        clean_ts = ts.replace("Z", "+00:00")
        dt = datetime.fromisoformat(clean_ts)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except Exception:
        return None

def compute_sha256(content: bytes) -> str:
    """Compute SHA-256 hash for evidence chain-of-custody integrity."""
    return hashlib.sha256(content).hexdigest()

def sort_timeline(extracted_items: List[Dict[str, Any]]) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    """
    Sort items with valid timestamp ascending.
    Items without valid timestamps are separated into unplaced_items.
    """
    timeline_items = []
    unplaced_items = []

    for item in extracted_items:
        dt = parse_iso_timestamp(item.get("timestamp"))
        if dt:
            item_copy = dict(item)
            item_copy["_parsed_dt"] = dt
            timeline_items.append(item_copy)
        else:
            unplaced_items.append(item)

    timeline_items.sort(key=lambda x: x["_parsed_dt"])
    return timeline_items, unplaced_items

def detect_temporal_gaps(
    timeline_items: List[Dict[str, Any]],
    threshold_minutes: int = 20
) -> List[Dict[str, Any]]:
    """
    Detect unexplained intervals between consecutive timeline events
    that exceed threshold_minutes.
    """
    gaps = []
    for i in range(len(timeline_items) - 1):
        item_a = timeline_items[i]
        item_b = timeline_items[i + 1]
        dt_a: datetime = item_a["_parsed_dt"]
        dt_b: datetime = item_b["_parsed_dt"]

        diff_seconds = (dt_b - dt_a).total_seconds()
        diff_minutes = round(diff_seconds / 60.0, 1)

        if diff_minutes >= threshold_minutes:
            gap = {
                "gap_id": str(uuid.uuid4()),
                "type": "temporal",
                "between": [item_a.get("evidence_id"), item_b.get("evidence_id")],
                "description": f"Unaccounted interval of {int(diff_minutes)} minutes between events.",
                "duration_minutes": diff_minutes
            }
            gaps.append(gap)
    return gaps

def detect_structural_gaps(all_items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Detect structural gaps: evidence references actions or artifacts
    (e.g., payment, transfer, downloaded APK, screen sharing)
    that lack corresponding evidence items.
    """
    gaps = []
    types_present = {item.get("evidence_type", "").lower() for item in all_items}
    
    # Check for payment/transaction mentions without transaction evidence
    has_transaction_evidence = "transaction" in types_present
    payment_keywords = ["payment", "paid", "transferred", "debited", "sent money", "upi pin", "gpay", "phonepe", "paytm"]
    
    for item in all_items:
        summary = (item.get("raw_text_summary") or "").lower()
        if not has_transaction_evidence and any(kw in summary for kw in payment_keywords):
            # Check if this item itself is not a transaction
            if item.get("evidence_type", "").lower() != "transaction":
                gaps.append({
                    "gap_id": str(uuid.uuid4()),
                    "type": "structural",
                    "between": [item.get("evidence_id"), None],
                    "description": "Evidence references a financial payment or transfer, but no corresponding transaction receipt/statement evidence item was provided.",
                    "duration_minutes": None
                })
                break  # Flag once per case for clarity
                
    # Check for remote access / APK / screen share mention without log or app evidence
    remote_keywords = ["anydesk", "teamviewer", "rustdesk", "quicksupport", "apk", "install app"]
    for item in all_items:
        summary = (item.get("raw_text_summary") or "").lower()
        if any(kw in summary for kw in remote_keywords):
            if "app_notification" not in types_present and "log" not in types_present:
                gaps.append({
                    "gap_id": str(uuid.uuid4()),
                    "type": "structural",
                    "between": [item.get("evidence_id"), None],
                    "description": "Communication references remote access tool or APK installation, but no installation logs or app notification evidence is available.",
                    "duration_minutes": None
                })
                break

    return gaps

def detect_conflicts(
    timeline_items: List[Dict[str, Any]],
    event_proximity_minutes: int = 15
) -> List[Dict[str, Any]]:
    """
    Detect structured field conflicts (amount, timestamp, sender, transaction_id)
    across pairs of evidence items that refer to the same event.
    """
    conflicts = []
    n = len(timeline_items)
    
    for i in range(n):
        for j in range(i + 1, n):
            a = timeline_items[i]
            b = timeline_items[j]

            # Determine if items a and b describe the same event
            tx_a = a.get("transaction_id")
            tx_b = b.get("transaction_id")
            amt_a = a.get("amount")
            amt_b = b.get("amount")
            
            dt_a = a.get("_parsed_dt")
            dt_b = b.get("_parsed_dt")
            time_diff_min = abs((dt_b - dt_a).total_seconds()) / 60.0 if (dt_a and dt_b) else None

            is_matched_event = False

            # Match criteria 1: Same transaction ID
            if tx_a and tx_b and tx_a.strip().lower() == tx_b.strip().lower():
                is_matched_event = True
            
            # Match criteria 2: Both specify an amount and occurred within close proximity
            elif amt_a is not None and amt_b is not None and time_diff_min is not None and time_diff_min <= event_proximity_minutes:
                is_matched_event = True

            # Match criteria 3: Same sender/phone interacting within narrow window
            phone_a = set(a.get("phone_numbers") or [])
            phone_b = set(b.get("phone_numbers") or [])
            if phone_a and phone_b and phone_a.intersection(phone_b) and time_diff_min is not None and time_diff_min <= 5:
                is_matched_event = True

            if not is_matched_event:
                continue

            # Now check for contradictions across fields:
            # 1. Amount mismatch
            if amt_a is not None and amt_b is not None and abs(float(amt_a) - float(amt_b)) > 0.01:
                conflicts.append({
                    "conflict_id": str(uuid.uuid4()),
                    "field": "amount",
                    "evidence_ids": [a.get("evidence_id"), b.get("evidence_id")],
                    "values": [f"{a.get('currency', 'INR')} {amt_a}", f"{b.get('currency', 'INR')} {amt_b}"],
                    "description": f"Contradictory transaction amounts reported for the same event: {a.get('currency', 'INR')} {amt_a} vs {b.get('currency', 'INR')} {amt_b}."
                })

            # 2. Transaction ID mismatch if amounts match and times are tight
            if tx_a and tx_b and tx_a.strip().lower() != tx_b.strip().lower() and amt_a == amt_b:
                conflicts.append({
                    "conflict_id": str(uuid.uuid4()),
                    "field": "transaction_id",
                    "evidence_ids": [a.get("evidence_id"), b.get("evidence_id")],
                    "values": [str(tx_a), str(tx_b)],
                    "description": f"Conflicting transaction reference IDs recorded for equivalent event amounts: {tx_a} vs {tx_b}."
                })

            # 3. Sender mismatch
            sender_a = a.get("sender")
            sender_b = b.get("sender")
            if sender_a and sender_b and sender_a.strip().lower() != sender_b.strip().lower() and (tx_a == tx_b and tx_a is not None):
                conflicts.append({
                    "conflict_id": str(uuid.uuid4()),
                    "field": "sender",
                    "evidence_ids": [a.get("evidence_id"), b.get("evidence_id")],
                    "values": [str(sender_a), str(sender_b)],
                    "description": f"Conflicting originating sender identity for identical transaction: {sender_a} vs {sender_b}."
                })

            # 4. Significant timestamp divergence (> 5 mins) for what shares the same transaction ID
            if tx_a and tx_b and tx_a.strip().lower() == tx_b.strip().lower() and time_diff_min is not None and time_diff_min > 5:
                conflicts.append({
                    "conflict_id": str(uuid.uuid4()),
                    "field": "timestamp",
                    "evidence_ids": [a.get("evidence_id"), b.get("evidence_id")],
                    "values": [str(a.get("timestamp")), str(b.get("timestamp"))],
                    "description": f"Significant timestamp discrepancy ({int(time_diff_min)} minutes apart) for matching transaction ID {tx_a}."
                })

    return conflicts

def build_reconciled_case(
    evidence_items: List[Dict[str, Any]],
    gap_threshold_minutes: int = 20
) -> Dict[str, Any]:
    """
    Main orchestration of Stage 3 (Timeline), Stage 4 (Gaps), and Stage 5 (Conflicts).
    """
    timeline, unplaced = sort_timeline(evidence_items)
    temporal_gaps = detect_temporal_gaps(timeline, threshold_minutes=gap_threshold_minutes)
    structural_gaps = detect_structural_gaps(evidence_items)
    all_gaps = temporal_gaps + structural_gaps
    conflicts = detect_conflicts(timeline)

    # Clean out internal helper keys from timeline items before returning
    clean_timeline = []
    for item in timeline:
        c = dict(item)
        c.pop("_parsed_dt", None)
        clean_timeline.append(c)

    return {
        "timeline": clean_timeline,
        "unplaced_items": unplaced,
        "gaps": all_gaps,
        "conflicts": conflicts,
        "metrics": {
            "total_evidence": len(evidence_items),
            "timeline_events": len(clean_timeline),
            "unplaced_events": len(unplaced),
            "gap_count": len(all_gaps),
            "conflict_count": len(conflicts)
        }
    }
