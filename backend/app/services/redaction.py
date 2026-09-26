"""
Deterministic, rule-based redaction engine.
Auditable, testable, zero LLM guesswork.
Maps strictly to PRD Section 11.
"""
import re
from typing import Optional, Dict, Any, List

# --- Regex patterns for Indian & International formats ---
PHONE_REGEX = re.compile(
    r'(?:(?:\+|00)91[\s.-]?)?[6789]\d{9}\b'
    r'|(?:\+\d{1,3}[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b'
)

# Common Indian bank account / card patterns (9 to 18 digits with boundary or preceded by a/c, acct, card)
ACCOUNT_REGEX = re.compile(
    r'(?i)(?:a/c|acct|account|card|acc\.?\s*(?:no\.?|number)?)[:\s#-]*([0-9]{9,18})\b'
    r'|\b(?:\d{4}[-\s]?){3}\d{4}\b'  # 16-digit card numbers
)

EMAIL_REGEX = re.compile(
    r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
)

# URL matching with scheme or standard domain
URL_REGEX = re.compile(
    r'(https?://[^\s/$.?#].[^\s]*)'
    r'|(www\.[^\s/$.?#].[^\s]*)'
)

def mask_phone_number(phone: str) -> str:
    """
    Mask phone number: keep country code and last 2 digits.
    Example: +91 9876543210 -> +91XXXXXXXX10
    """
    if not phone:
        return ""
    
    clean = re.sub(r'[\s\-\(\)]', '', phone)
    
    # Check if country code is present (e.g. +91 or 91)
    if clean.startswith('+91'):
        prefix = '+91'
        digits = clean[3:]
    elif clean.startswith('91') and len(clean) > 10:
        prefix = '+91'
        digits = clean[2:]
    elif clean.startswith('+'):
        # Generic international code
        m = re.match(r'(\+\d{1,3})(\d+)', clean)
        if m:
            prefix, digits = m.group(1), m.group(2)
        else:
            prefix, digits = '', clean
    else:
        prefix = ''
        digits = clean
        
    if len(digits) <= 2:
        return "X" * len(digits)
    
    masked = ("X" * (len(digits) - 2)) + digits[-2:]
    return f"{prefix}{masked}" if prefix else masked

def mask_account_number(acc: str) -> str:
    """
    Mask account/card number: keep last 4 digits only.
    Example: 123456789012 -> XXXXXXXX9012
    """
    if not acc:
        return ""
    
    digits = re.sub(r'\D', '', acc)
    if len(digits) <= 4:
        return "X" * len(digits)
    return ("X" * (len(digits) - 4)) + digits[-4:]

def mask_email(email: str) -> str:
    """
    Mask email address: mask local part, keep first character and domain.
    Example: shadwal@gmail.com -> s****@gmail.com
    """
    if not email or '@' not in email:
        return email
    
    local, domain = email.split('@', 1)
    if len(local) <= 1:
        masked_local = "*"
    elif len(local) == 2:
        masked_local = f"{local[0]}*"
    else:
        masked_local = f"{local[0]}{'*' * (len(local) - 1)}"
    return f"{masked_local}@{domain}"

def mask_url(url: str) -> str:
    """
    Mask URL: keep domain/host, mask query params and sensitive path.
    Example: https://phishing-site.com/verify?token=123 -> https://phishing-site.com/XXXXX
    """
    if not url:
        return ""
    
    # Regex parse protocol + domain vs path/query
    match = re.match(r'^(https?://)?([^/?#]+)(.*)?$', url)
    if not match:
        return url
    
    proto = match.group(1) or ""
    domain = match.group(2)
    path = match.group(3)
    
    if path and len(path.strip('/')) > 0:
        return f"{proto}{domain}/XXXXX"
    return f"{proto}{domain}"

def mask_name(name: str) -> str:
    """
    Mask individual names: keep first letter of each part, mask remaining.
    Example: Ramesh Kumar -> R**** K****
    """
    if not name:
        return ""
    parts = name.strip().split()
    masked_parts = []
    for part in parts:
        if len(part) <= 1:
            masked_parts.append(part)
        else:
            masked_parts.append(part[0] + ("*" * min(len(part) - 1, 4)))
    return " ".join(masked_parts)

def redact_text_content(text: str) -> str:
    """
    Scan free-form narrative/summary text and mask all inline PII:
    phones, accounts, emails, sensitive URLs.
    """
    if not text:
        return ""

    # 1. Mask emails
    def email_sub(match):
        return mask_email(match.group(0))
    result = EMAIL_REGEX.sub(email_sub, text)

    # 2. Mask URLs
    def url_sub(match):
        return mask_url(match.group(0))
    result = URL_REGEX.sub(url_sub, result)

    # 3. Mask explicit account numbers with prefix
    def acc_sub(match):
        full = match.group(0)
        digits = match.group(1)
        if digits:
            return full.replace(digits, mask_account_number(digits))
        return mask_account_number(full)
    result = ACCOUNT_REGEX.sub(acc_sub, result)

    # 4. Mask phone numbers
    def phone_sub(match):
        return mask_phone_number(match.group(0))
    result = PHONE_REGEX.sub(phone_sub, result)

    return result

def redact(field_type: str, value: Any, redact_names: bool = True, redact_tx_ids: bool = False) -> Any:
    """
    Deterministic single-field redaction dispatcher conforming to PRD signature:
    redact(field_type: str, value: Any) -> Any
    """
    if value is None:
        return None
    
    ft = field_type.lower()
    if ft == "phone_number" or ft == "phone":
        return mask_phone_number(str(value))
    elif ft == "phone_numbers":
        if isinstance(value, list):
            return [mask_phone_number(str(v)) for v in value]
        return mask_phone_number(str(value))
    elif ft in ("account", "account_number", "bank_account", "card"):
        return mask_account_number(str(value))
    elif ft == "email":
        return mask_email(str(value))
    elif ft == "url":
        return mask_url(str(value))
    elif ft == "urls":
        if isinstance(value, list):
            return [mask_url(str(v)) for v in value]
        return mask_url(str(value))
    elif ft in ("sender", "recipient", "name"):
        if redact_names:
            return mask_name(str(value))
        return value
    elif ft in ("transaction_id", "txn_id"):
        if redact_tx_ids:
            return mask_account_number(str(value))
        return value
    elif ft in ("raw_text_summary", "text", "summary"):
        return redact_text_content(str(value))
    
    return value
