# Fraud Evidence-to-Incident-Report System

> **Transforms scattered, unstructured fraud evidence into a structured, chronological, privacy-redacted incident report.**  
> *Reconstruction with honesty: showing what happened, what is missing, and what conflicts — without ever exposing raw sensitive data.*

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18+-61DAFB.svg?logo=react&logoColor=black)](https://reactjs.org)
[![Vite](https://img.shields.io/badge/Vite-5+-646CFF.svg?logo=vite&logoColor=white)](https://vitejs.dev)
[![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-2.0+-D71F00.svg?logo=sqlalchemy&logoColor=white)](https://www.sqlalchemy.org)
[![Security Hardened](https://img.shields.io/badge/Security-OWASP%20Hardened-green.svg)](#security--hardening)

---

## 1. 7-Stage Backbone Architecture

```
Unorganized Evidence (collect raw data: screenshots, chat, SMS, bank records)
        ↓
Information Extraction (forensic field extraction with confidence scores)
        ↓
Chronological Timeline (order events by time ascending, unplaced tray for nulls)
        ↓
Missing Information (detect temporal and structural gaps)
        ↓
Contradiction Detection (spot factual inconsistencies across correlated events)
        ↓
Redaction (pure deterministic regex/rule masking of PII)
        ↓
Incident Report (finalize findings into exportable forensic dossier)
```

---

## 2. Key Capabilities

- **Heterogeneous Evidence Ingestion**: Screenshots (bank SMS, phishing emails, WhatsApp chats, app notifications) and raw pasted text.
- **SHA-256 Chain-of-Custody**: Automatic cryptographic checksum computed on ingestion for forensic integrity.
- **Deterministic Redaction Engine**: Never LLM-guessed. Pure regex/rule-based masking for phone numbers (`+91XXXXXXXX10`), bank accounts (`XXXXXXXX4192`), emails (`s******@domain.com`), and URLs (`https://phishing.in/XXXXX`).
- **Automated Gap Detection**:
  - *Temporal Gaps*: Unaccounted intervals (e.g. 37 minutes between events) flagged with visual markers.
  - *Structural Gaps*: Missing proof for referenced financial transfers or remote access tools (AnyDesk/APK).
- **Contradiction Detection**: Side-by-side comparison of conflicting event details (e.g. ₹5,000 bank debit vs ₹5,200 chat demand) without artificially picking a winner.
- **Investigator Mode**: Toggle unredacted forensic view with persistent audit ledger logging (`INVESTIGATOR MODE ACTIVE: Unredacted view accessed at HH:MM:SS`).
- **1-Click Seed Demo**: Instant realistic Indian electricity disconnection KYC phishing & UPI extortion scenario built-in for judges.
- **PDF & JSON Export**: Clean print stylesheet for PDF reports and structured JSON for downstream cyber-cell systems.

---

## 3. Tech Stack

- **Backend**: Python 3.11, FastAPI, SQLAlchemy ORM (100% parameterized queries, zero raw SQL), Pydantic v2, PyJWT, bcrypt.
- **Frontend**: React 18, Vite, Vanilla CSS design system (cyber-forensic dark mode & glassmorphism), Lucide React.
- **Storage**: SQLite (demo) / PostgreSQL compatible, local sandboxed file uploads.

---

## 4. Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 1. Backend Setup
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Run Unit & Integration Tests (13/13 passing)
python -m pytest -v tests

# Start FastAPI Server (runs on http://127.0.0.1:8000)
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

### 2. Frontend Setup
```bash
cd frontend
npm install

# Start Vite Dev Server (runs on http://127.0.0.1:5173)
npm run dev
```

Open `http://127.0.0.1:5173` in your browser and click **"Load 1-Click Demo Case"** to inspect the live timeline, gaps, contradictions, and report.

---

## 5. Security & Hardening

1. **SQL Injection Prevention**: Structurally immune. All database queries utilize SQLAlchemy ORM with bound parameters. Zero string formatting/concatenation.
2. **IDOR Access Control**: Every case, evidence, timeline, and report query is strictly scoped to `WHERE user_id = current_user.id`.
3. **Deterministic Privacy Layer**: Redaction logic is isolated, unit-tested, and executed at render time — raw forensic data is safeguarded in the DB.
4. **Audit Trail**: Any unmasking via Investigator Mode is permanently logged with timestamps.
5. **Prompt Injection Defense**: Ingested evidence text is treated strictly as passive untrusted data, never as LLM execution instructions.

---

## 6. Pre-Submission Checklist

- [x] Zero raw SQL strings (`grep` verified)
- [x] Deterministic redaction unit tests passing
- [x] Reconciliation and contradiction tests passing
- [x] Per-user JWT authentication and case ownership isolation
- [x] Secrets in `.env` and gitignored
- [x] PDF print export and JSON export operational
