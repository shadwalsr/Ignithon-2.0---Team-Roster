"""
Unit test suite for deterministic redaction engine.
Validates PRD Section 11 & Section 17 requirements:
- Phone numbers (+91XXXXXXXX44)
- Bank account / card numbers (XXXXXXXX1234)
- Email masking (s****@gmail.com)
- URL domain preservation & path masking
- Name masking
- Free text redaction
"""
import pytest
from app.services.redaction import (
    mask_phone_number,
    mask_account_number,
    mask_email,
    mask_url,
    mask_name,
    redact_text_content,
    redact
)

def test_mask_phone_number():
    # Indian mobile with +91
    assert mask_phone_number("+919876543210") == "+91XXXXXXXX10"
    # Indian mobile with space
    assert mask_phone_number("+91 98765 43210") == "+91XXXXXXXX10"
    # 10-digit number without country code
    assert mask_phone_number("9876543210") == "XXXXXXXX10"
    # Dash separated
    assert mask_phone_number("9876-543-210") == "XXXXXXXX10"

def test_mask_account_number():
    # 12-digit bank account
    assert mask_account_number("123456789012") == "XXXXXXXX9012"
    # 16-digit card number with spaces
    assert mask_account_number("4111 2222 3333 4444") == "XXXXXXXXXXXX4444"
    # Short string
    assert mask_account_number("1234") == "XXXX"

def test_mask_email():
    assert mask_email("shadwal@gmail.com") == "s******@gmail.com"
    assert mask_email("a@example.com") == "*@example.com"
    assert mask_email("ab@domain.org") == "a*@domain.org"

def test_mask_url():
    # URL with sensitive query parameter
    assert mask_url("https://phishing-portal.com/login?token=secret123") == "https://phishing-portal.com/XXXXX"
    # Base URL without path
    assert mask_url("https://bank-secure-update.in") == "https://bank-secure-update.in"
    # URL with path
    assert mask_url("http://fake-upi-verify.com/pay/confirm") == "http://fake-upi-verify.com/XXXXX"

def test_mask_name():
    assert mask_name("Ramesh Kumar") == "R**** K****"
    assert mask_name("Alok") == "A***"
    assert mask_name("Dr John Doe") == "D* J*** D**"

def test_redact_text_content():
    sample = (
        "User received SMS from +919876543210 asking to update KYC. "
        "Sent money to A/c 50100234567891 at https://fakebank.in/verify. "
        "Confirmation emailed to victim.user@bankmail.com"
    )
    redacted = redact_text_content(sample)
    
    # Assert sensitive data is masked
    assert "9876543210" not in redacted
    assert "+91XXXXXXXX10" in redacted
    assert "50100234567891" not in redacted
    assert "XXXXXXXXXX7891" in redacted
    assert "victim.user@bankmail.com" not in redacted
    assert "v**********@bankmail.com" in redacted
    assert "https://fakebank.in/XXXXX" in redacted

def test_redact_dispatcher():
    assert redact("phone_number", "+919999888877") == "+91XXXXXXXX77"
    assert redact("phone_numbers", ["+919999888877", "9876543210"]) == ["+91XXXXXXXX77", "XXXXXXXX10"]
    assert redact("account_number", "998877665544") == "XXXXXXXX5544"
    assert redact("transaction_id", "UPI/4289012345", redact_tx_ids=False) == "UPI/4289012345"
    assert redact("sender", "Vikram Patel", redact_names=True) == "V**** P****"
