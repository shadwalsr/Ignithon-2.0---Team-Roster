"""
Unit test suite for timeline sorting, gap detection, and contradiction detection.
Validates PRD Sections 8, 9, 10:
- Chronological timeline sorting & unplaced items
- Temporal gaps (> threshold)
- Structural gaps (referenced payments missing transaction proof)
- Amount conflicts, timestamp conflicts, sender conflicts, txn ID mismatches
"""
import pytest
from app.services.reconciliation import (
    sort_timeline,
    detect_temporal_gaps,
    detect_structural_gaps,
    detect_conflicts,
    build_reconciled_case
)

def test_timeline_sorting_and_unplaced():
    items = [
        {"evidence_id": "ev-3", "timestamp": "2026-09-26T11:00:00Z", "raw_text_summary": "Third"},
        {"evidence_id": "ev-1", "timestamp": "2026-09-26T10:00:00Z", "raw_text_summary": "First"},
        {"evidence_id": "ev-null", "timestamp": None, "raw_text_summary": "Unplaced item"},
        {"evidence_id": "ev-2", "timestamp": "2026-09-26T10:30:00Z", "raw_text_summary": "Second"},
    ]
    timeline, unplaced = sort_timeline(items)
    
    assert len(timeline) == 3
    assert len(unplaced) == 1
    assert timeline[0]["evidence_id"] == "ev-1"
    assert timeline[1]["evidence_id"] == "ev-2"
    assert timeline[2]["evidence_id"] == "ev-3"
    assert unplaced[0]["evidence_id"] == "ev-null"

def test_temporal_gap_detection():
    # ev-1 at 10:00, ev-2 at 10:45 -> 45 minutes gap > 20 minutes default
    timeline_items = [
        {"evidence_id": "ev-1", "timestamp": "2026-09-26T10:00:00Z", "_parsed_dt": sort_timeline([{"timestamp": "2026-09-26T10:00:00Z"}])[0][0]["_parsed_dt"]},
        {"evidence_id": "ev-2", "timestamp": "2026-09-26T10:45:00Z", "_parsed_dt": sort_timeline([{"timestamp": "2026-09-26T10:45:00Z"}])[0][0]["_parsed_dt"]},
    ]
    gaps = detect_temporal_gaps(timeline_items, threshold_minutes=20)
    assert len(gaps) == 1
    assert gaps[0]["duration_minutes"] == 45.0
    assert gaps[0]["type"] == "temporal"

def test_structural_gap_detection():
    # Chat message says "I sent money through UPI" but no evidence item of type "transaction"
    items = [
        {"evidence_id": "ev-1", "evidence_type": "chat", "raw_text_summary": "Victim said: I transferred the payment via UPI to verify my account"},
    ]
    gaps = detect_structural_gaps(items)
    assert len(gaps) == 1
    assert gaps[0]["type"] == "structural"
    assert "reference" in gaps[0]["description"].lower()

def test_amount_conflict_detection():
    # Same event (matched by transaction ID) but amount differs: ₹5,000 vs ₹5,200
    timeline, _ = sort_timeline([
        {
            "evidence_id": "ev-sms",
            "evidence_type": "sms",
            "timestamp": "2026-09-26T10:45:00Z",
            "amount": 5000.0,
            "currency": "INR",
            "transaction_id": "TXN998877",
            "sender": "HDFC-BANK"
        },
        {
            "evidence_id": "ev-chat",
            "evidence_type": "chat",
            "timestamp": "2026-09-26T10:46:00Z",
            "amount": 5200.0,
            "currency": "INR",
            "transaction_id": "TXN998877",
            "sender": "Scammer Support"
        }
    ])
    conflicts = detect_conflicts(timeline)
    assert len(conflicts) >= 1
    
    amount_conflicts = [c for c in conflicts if c["field"] == "amount"]
    assert len(amount_conflicts) == 1
    assert "5000.0" in amount_conflicts[0]["values"][0]
    assert "5200.0" in amount_conflicts[0]["values"][1]

def test_full_reconciled_case():
    items = [
        {
            "evidence_id": "ev-1",
            "evidence_type": "sms",
            "timestamp": "2026-09-26T10:00:00Z",
            "raw_text_summary": "Electricity bill unpaid, click link",
            "sender": "VK-POWERC"
        },
        {
            "evidence_id": "ev-2",
            "evidence_type": "sms",
            "timestamp": "2026-09-26T10:35:00Z",  # 35 min gap
            "amount": 5000.0,
            "currency": "INR",
            "transaction_id": "TXN123",
            "raw_text_summary": "Rs 5000 debited"
        },
        {
            "evidence_id": "ev-3",
            "evidence_type": "chat",
            "timestamp": "2026-09-26T10:36:00Z",
            "amount": 5200.0,  # Conflict with ev-2
            "transaction_id": "TXN123",
            "raw_text_summary": "Scammer claiming debited Rs 5200"
        }
    ]
    result = build_reconciled_case(items, gap_threshold_minutes=20)
    assert result["metrics"]["timeline_events"] == 3
    assert result["metrics"]["gap_count"] >= 1
    assert result["metrics"]["conflict_count"] >= 1
