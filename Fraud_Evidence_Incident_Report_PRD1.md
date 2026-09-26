# Product Requirements Document
## Fraud Evidence-to-Incident-Report System

**Version:** 1.0
**Status:** Hackathon Build Spec
**Owner:** Shadwal

---

## 1. Executive Summary

A system that converts scattered, unstructured fraud evidence — screenshots, chat messages, transaction records, logs — into a single structured, chronological, privacy-redacted incident report. The core value is not summarization; it is **reconstruction with honesty**: showing exactly what happened, in what order, what is missing, what conflicts, and doing all of it without ever exposing raw sensitive data.

Confirmed reference flow (from provided process-flow chart):

```
Unorganized Evidence (collect raw data)
        ↓
Information Extraction (identify key data points)
        ↓
Chronological Timeline (order events by time)
        ↓
Missing Information (identify gaps)
        ↓
Contradiction Detection (spot inconsistencies)
        ↓
Redaction (obfuscate sensitive info)
        ↓
Incident Report (finalize findings)
```

This PRD treats that 7-stage pipeline as the system's backbone. Every module below maps to exactly one stage.

---

## 2. Problem Statement (restated)

Fraud evidence accumulates across incompatible formats: a bank SMS screenshot, a WhatsApp conversation, a phishing URL, a UPI transaction ID, an email header. No single person — victim, support agent, or investigator — has a coherent picture of the incident. Order is unclear, gaps go unnoticed, contradictions go unflagged, and sensitive data (phone numbers, account numbers) gets carelessly shared when the "evidence" is passed around.

**What must be solved:**
1. Ingest heterogeneous evidence (image + text).
2. Extract structured fields from each item.
3. Order everything into a timeline.
4. Detect and flag temporal/informational gaps.
5. Detect and flag contradictions between evidence items.
6. Redact sensitive data before any report is generated or shared.
7. Produce a final structured incident report.

---

## 3. Goals and Non-Goals

### 3.1 Goals
- Working end-to-end pipeline: upload evidence → structured report, demoable live.
- Extraction accuracy good enough on 5–8 realistic seed samples (UPI SMS, phishing email, WhatsApp screenshot, bank app screenshot).
- Visually obvious gap and contradiction flags on the timeline (the demo's "wow moment").
- Deterministic, auditable redaction — never LLM-guessed.
- A downloadable, presentable final report (PDF/HTML).

### 3.2 Non-Goals (explicitly out of scope for this build)
- Real fraud detection / risk scoring of transactions (this is a documentation tool, not an anti-fraud ML system).
- Multi-user case management with roles/permissions beyond basic account ownership (single-tier user accounts only, see Section 6a).
- Cross-case entity graph (linking entities across multiple different incidents).
- Live integration with real bank/telecom APIs.
- Training or fine-tuning any model.
- Narrative/semantic contradiction detection (e.g. "message implies X, log implies not-X") — scoped only to structured-field conflicts (amount, time, sender, phone, txn ID mismatches). This is a deliberate scope cut: semantic contradiction detection is an open NLP problem and unreliable to demo live.

---

## 4. Users / Personas

| Persona | Need |
|---|---|
| **Victim** | Wants a single clear document to give to bank/police/cyber-cell without re-explaining everything from memory. |
| **Support agent / cyber-cell intake officer** | Needs to quickly see the order of events and spot what's missing before opening a formal case. |
| **Judge (hackathon)** | Needs to see, within 90 seconds, that the system does real extraction + real reasoning (gap/conflict detection), not just a template report. |

---

## 5. End-to-End User Flow

1. User opens the app, starts a new **Incident Case**.
2. User uploads evidence items one at a time or in a batch:
   - Screenshot (image) — phishing message, bank SMS, app notification, chat.
   - Pasted text — email body, chat log, transaction description.
3. For each item, system runs **Extraction** (Section 7) and shows the extracted fields back to the user for a quick confirm/edit (builds trust, also hedges against extraction errors during demo).
4. Once all evidence is added, user clicks **Build Timeline**.
5. System runs:
   - **Timeline assembly** (Section 8)
   - **Gap detection** (Section 9)
   - **Conflict detection** (Section 10)
6. User sees the interactive timeline with gap markers (dotted connectors) and conflict callouts (side-by-side comparison).
7. User clicks **Generate Report**.
8. System applies **Redaction** (Section 11) and renders the **Incident Report** (Section 12) as HTML, exportable to PDF.
9. Optional: user toggles **Investigator Mode** to reveal unredacted values, logged with a visible on-screen notice ("Unredacted view accessed at HH:MM").

---

## 6. System Architecture

```
                         ┌─────────────────────┐
                         │        User          │
                         └──────────┬───────────┘
                                    │
                         ┌──────────▼───────────┐
                         │   Frontend (React)    │
                         │  - Upload UI           │
                         │  - Timeline view       │
                         │  - Report view          │
                         └──────────┬───────────┘
                                    │ REST/JSON
                         ┌──────────▼───────────┐
                         │  Auth Middleware        │
                         │  (JWT verify, on every  │
                         │   request past login/   │
                         │   register)             │
                         └──────────┬───────────┘
                                    │
                         ┌──────────▼───────────┐
                         │    API Layer (FastAPI) │
                         │  - parameterized ORM    │
                         │    queries only, no raw  │
                         │    string-built SQL      │
                         └──────────┬───────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        │                           │                           │
┌───────▼────────┐        ┌─────────▼─────────┐       ┌─────────▼─────────┐
│ Extraction       │        │ Reconciliation      │       │ Redaction layer    │
│ Service          │        │ Engine               │       │ (deterministic)    │
│ (vision+text LLM │        │ - timeline sort      │       │ - regex/rule-based │
│  → structured    │        │ - gap detection       │       │ - PII masking      │
│  JSON per item)  │        │ - conflict detection   │       │ - applied before   │
└───────┬────────┘        └─────────┬─────────┘       │   render/export     │
        │                           │                  └─────────┬─────────┘
        │                           │                            │
        └─────────────┬─────────────┴────────────────────────────┘
                       │
              ┌────────▼─────────┐
              │  Database          │
              │  (Postgres/SQLite) │
              │  - cases            │
              │  - evidence_items    │
              │  - extracted_fields   │
              │  - gaps / conflicts    │
              └────────┬─────────┘
                       │
              ┌────────▼─────────┐
              │  Report Generator   │
              │  HTML → PDF export    │
              └────────────────────┘
```

**Architectural principles:**
- Modular monolith. No microservices — unjustified complexity for a hackathon, adds demo-day failure surface.
- Redaction is a pure, deterministic, independently testable function — never routed through an LLM. This is the answer to the inevitable judge question "how do you guarantee no leak?"
- Extraction uses a single vision-capable LLM call per evidence item with a strict JSON schema (see 7.2), not a separate OCR step — fewer moving parts, fewer failure points live.

---

## 6a. Authentication & Access Control

### 6a.1 Scope
Every user must authenticate before creating, viewing, or exporting a case. This is a single-tier account system (no roles/permissions beyond "owns this case") — enough to make the tool safe to demo and deploy without becoming a scope-creep multi-tenant platform.

### 6a.2 Flow
- **Register:** email + password → password hashed with bcrypt/argon2 (never stored plain, never logged) → account created.
- **Login:** email + password verified against hash → short-lived JWT access token issued (e.g. 30–60 min expiry) + refresh token.
- **Every protected route** (`/cases/*`) requires a valid JWT in the `Authorization: Bearer <token>` header, verified by middleware before the request reaches any handler.
- **Ownership check:** every case/evidence/report lookup is scoped by `WHERE user_id = current_user.id` — a user can never fetch or act on another user's case, even by guessing an ID.
- **Rate limiting** on `/login` and `/register` (e.g. 5 attempts/minute per IP) to blunt brute-force attempts — cheap to add, credible in Q&A.

### 6a.3 Data model addition
```
User
 ├─ id, email (unique), password_hash, created_at
```
`Case.user_id` becomes a required foreign key to `User.id` (see updated Section 13).

### 6a.4 What this deliberately does NOT include
- OAuth/social login, multi-factor auth, granular roles (admin/investigator/viewer), team/shared-case access — all explicitly post-hackathon (Section 16, ⚫ tier). A single working auth gate is the goal, not a full IAM system.

## 6b. Data-Layer Security (SQL Injection & Input Hardening)

SQL injection is prevented structurally, not by sanitizing individual inputs after the fact:

- **No raw/string-concatenated SQL anywhere in the codebase.** All database access goes through an ORM (SQLAlchemy, or the ORM native to whatever backend framework is used) using parameterized queries exclusively. User input is always bound as a query parameter, never interpolated into a query string.
- **No dynamic query building from user input** (no f-string/`.format()`/`+`-concatenated SQL, even for "safe-looking" fields like sort order — use an explicit allowlist of sortable columns if that feature exists).
- **Input validation at the API boundary** using the framework's schema layer (e.g. Pydantic models in FastAPI) — every incoming field is type- and shape-checked before it reaches business logic, rejecting malformed payloads outright rather than trying to clean them.
- **Least-privilege DB credentials:** the application's DB user has only the permissions it needs (read/write on its own tables) — no elevated/admin DB role used at runtime.
- **File upload hardening:** evidence image uploads are validated by content-type and size limit, stored under generated UUID filenames (never the user-supplied filename) to prevent path traversal.
- **Verification before submission:** run a basic injection test pass (e.g. attempt `' OR '1'='1`, `'; DROP TABLE cases; --` style payloads in every text input field — case title, evidence text paste, login fields) and confirm the ORM's parameterization neutralizes all of them. This is a five-minute check that becomes a strong, concrete answer in Q&A ("we tested it, here's what we tried").

This is the direct answer to "how do you prevent SQL injection": parameterized queries by construction, not string sanitization as an afterthought — the two approaches are not equally safe, and only the former is a real guarantee.

## 6c. Broader Security Hardening

SQL injection and auth cover two attack surfaces; a system handling fraud evidence (inherently sensitive) needs the rest of the standard checklist too. None of this is exotic — it's the difference between "we added a login" and "we can actually defend this in front of a security-literate judge."

| Risk | Mitigation |
|---|---|
| **XSS (stored/reflected)** — evidence text or extracted fields rendered unescaped in the report/timeline UI | React escapes by default; never use `dangerouslySetInnerHTML` on user-supplied or LLM-extracted text. Sanitize any HTML that does get rendered (e.g. via `DOMPurify`) if rich text is ever needed. |
| **CSRF** on state-changing routes | JWT-in-header auth (not cookie-based sessions) sidesteps classic CSRF; if cookies are used for refresh tokens, mark them `HttpOnly`, `Secure`, `SameSite=Strict`. |
| **Insecure Direct Object Reference (IDOR)** — guessing another user's evidence/report ID | Already covered by `user_id`-scoped queries (6a.3) — call this out explicitly as IDOR prevention, it's a named OWASP category and naming it in Q&A reads as more credible. |
| **Sensitive data in transit** | HTTPS enforced everywhere (TLS termination at the host/CDN); never serve the app or API over plain HTTP even in the demo deploy. |
| **Sensitive data at rest** | Raw evidence images and extracted PII fields stored in the DB, not in redacted form (redaction is render-time only, per 6.1) — so DB-level encryption at rest matters. Use the hosting provider's default encryption-at-rest (Postgres on Render/Railway/RDS all offer this by default) rather than building custom crypto. |
| **Secrets management** | API keys (LLM provider, DB credentials, JWT signing secret) in environment variables only, never committed to the repo. `.env` in `.gitignore`, `.env.example` with placeholder values in the repo (already planned in Section 18/README requirements). |
| **File upload abuse** (oversized files, disguised executables as "images") | Enforce max file size (e.g. 5–10MB), validate actual file content/magic bytes match the declared image type, not just the extension — covered in 6b but worth restating here as a security control, not just a data-hygiene one. |
| **LLM prompt injection via evidence content** | Evidence text (e.g. a phishing message) is attacker-authored content that gets fed to an LLM for extraction. Treat it as untrusted: the extraction prompt should instruct the model to treat evidence content strictly as data to extract fields *from*, never as instructions to follow, and the output schema should be strictly validated/parsed (reject anything that doesn't match the JSON schema) so an injected "ignore previous instructions" string in a screenshot can't hijack extraction behavior. This is a genuinely relevant and non-obvious risk for this specific product and worth mentioning proactively in your pitch. |
| **Dependency vulnerabilities** | Run `npm audit` / `pip-audit` before submission; pin dependency versions in `requirements.txt`/`package.json` rather than using unpinned `latest`. |
| **JWT security details** | Short access-token expiry (30–60 min), signing secret of sufficient entropy stored as an env var, algorithm explicitly pinned (e.g. `HS256`) rather than accepting `alg: none` — a classic JWT library misconfiguration. |

### 6c.1 Pre-submission security checklist (concrete, do this)
1. Grep for raw SQL string construction — zero hits (6b).
2. Grep for `dangerouslySetInnerHTML` — zero hits, or sanitized if unavoidable.
3. Confirm every `/cases/*` route rejects requests with no/invalid JWT (test with `curl` and no auth header).
4. Confirm a logged-in user cannot fetch another user's case by ID (test with two accounts).
5. Confirm `.env` is gitignored and not in commit history.
6. Run `npm audit`/`pip-audit`, resolve or note any high-severity findings.
7. Confirm HTTPS is enforced on the deployed demo URL.

This checklist itself is a good thing to show judges — a visible "we hardened this" artifact (even a screenshot of the checklist) signals engineering maturity beyond what most hackathon teams demonstrate.

## 7. Module: Information Extraction

### 7.1 Inputs
- Image evidence (screenshot: SMS, email, app UI, chat).
- Text evidence (pasted message, email body, log line, transaction description).

### 7.2 Extraction schema (strict JSON output per evidence item)

```json
{
  "evidence_id": "string (uuid)",
  "evidence_type": "sms | email | chat | transaction | app_notification | log | other",
  "timestamp": "ISO8601 string or null if unextractable",
  "timestamp_confidence": "high | medium | low",
  "amount": "number or null",
  "currency": "string, default INR",
  "transaction_id": "string or null",
  "phone_numbers": ["array of strings, raw as extracted"],
  "urls": ["array of strings"],
  "sender": "string or null",
  "recipient": "string or null",
  "raw_text_summary": "string, 1-2 lines, the extracted textual content",
  "extraction_confidence": "high | medium | low",
  "source_evidence_id": "matches evidence_id, for traceability"
}
```

### 7.3 Extraction logic
- Vision-capable LLM call with the schema above enforced as the only valid output format.
- On extraction, each field gets a confidence tag. Low-confidence fields are visually marked (not hidden) — this is more credible in front of judges than pretending 100% accuracy.
- User can manually correct any extracted field before timeline assembly (edit-on-confirm step in the flow).

### 7.4 Failure handling
- If a field can't be extracted (e.g. no visible timestamp), it is explicitly `null`, and this null is what feeds the **Missing Information** module later — a null is not a bug, it's a signal.

---

## 8. Module: Chronological Timeline

- All evidence items with a non-null timestamp are sorted ascending.
- Items with null timestamps are shown in an "Unplaced Evidence" tray below the timeline rather than silently dropped or guessed into place.
- Each timeline card shows: time, evidence type icon, one-line summary, confidence badge, and (if applicable) gap/conflict markers.
- Example (matches reference material provided):
  - 10:30 AM — Suspicious message received
  - 10:35 AM — Suspicious URL identified
  - 10:45 AM — ₹5,000 transaction recorded
  - 11:00 AM — Another payment requested

---

## 9. Module: Missing Information (Gap Detection)

**Definition of a gap:** a time interval between two consecutive timeline items that exceeds a configurable threshold (default: 20 minutes) with no evidence covering it, OR an expected field type that never appears in the case at all (e.g. no transaction evidence exists despite a message referencing a payment).

### 9.1 Temporal gaps
- Compare consecutive timestamps; if the gap exceeds the threshold, insert a visible "⚠ Unaccounted for: 37 minutes" marker between the two cards.

### 9.2 Structural / referential gaps
- If evidence text references an entity that has no corresponding evidence item (e.g. message says "I made the payment" but no transaction-type evidence exists in the case), flag as **"Missing evidence: referenced transaction not found"**.
- Implementation: simple keyword/entity cross-reference between `raw_text_summary` fields and the set of `evidence_type`s present — not a full NLP inference system, deliberately kept simple and explainable.

### 9.3 Output
```json
{
  "gap_id": "uuid",
  "type": "temporal | structural",
  "between": ["evidence_id_1", "evidence_id_2"],
  "description": "string, human-readable",
  "duration_minutes": "number, for temporal gaps only"
}
```

---

## 10. Module: Contradiction Detection

**Scope (deliberately limited, see Section 3.2):** structured-field conflicts only.

### 10.1 Fields checked for conflicts
- `amount` — same transaction referenced with different amounts across evidence items.
- `timestamp` — same event described with meaningfully different times (>5 min) across items.
- `sender` / `phone_numbers` — same interaction attributed to different senders/numbers.
- `transaction_id` — mismatched IDs for what appears to be the same transaction (matched via amount + approximate time proximity).

### 10.2 Matching logic
- Two evidence items are considered to be "about the same event" if they share at least one of: overlapping `transaction_id`, or (`amount` match AND timestamps within N minutes).
- Once matched as the same event, any differing field value across the matched items is a conflict.

### 10.3 Output
```json
{
  "conflict_id": "uuid",
  "field": "amount | timestamp | sender | transaction_id",
  "evidence_ids": ["id_1", "id_2"],
  "values": ["₹5,000", "₹5,200"],
  "description": "string, human-readable"
}
```

### 10.4 UI treatment
- Rendered inline on the timeline as a side-by-side comparison card, not a silently "best-guessed" merged value. The system never picks a winner — it surfaces the disagreement and lets the human resolve it.

---

## 11. Module: Redaction (Privacy Layer)

**Principle:** redaction is deterministic and rule-based, never LLM-inferred. This must be independently testable and auditable.

### 11.1 What gets redacted
| Field type | Redaction rule | Example |
|---|---|---|
| Phone number | Show country code + last 2 digits only | `+91XXXXXXXX44` |
| Bank/account number | Show last 4 digits only | `XXXXXXXX1234` |
| Email address | Mask local part, keep domain | `s****@gmail.com` |
| Transaction ID | Kept visible (needed for case reference) unless user opts to redact | — |
| URL | Domain shown, path/query params masked | `phishing-site.com/XXXXX` |
| Names (sender/recipient) | Configurable — masked by default in "shareable" report, visible in investigator mode | `S**** K****` |

### 11.2 Implementation
- Pure regex + rule functions, unit-testable in isolation, run as a final pass over all rendered report content — never on the raw stored evidence (raw data stays intact in DB for investigator mode; only the render layer applies masking).
- Redaction function signature: `redact(field_type: str, value: str) -> str` — pure function, no side effects, no model calls.

### 11.3 Investigator Mode
- A toggle that reveals unredacted values.
- Every activation is logged with a visible on-screen banner: "Unredacted view accessed — [timestamp]" — this is your answer to "how do you prevent misuse of the unmask feature."

---

## 12. Module: Incident Report Generation

### 12.1 Report sections
1. **Case Summary** — case ID, date range, number of evidence items, number of gaps, number of conflicts.
2. **Chronological Timeline** — every evidence item in order, with redacted fields, gap markers, conflict flags inline.
3. **Missing Information** — bulleted list of all detected gaps.
4. **Conflicting Information** — bulleted list of all detected conflicts, both values shown side-by-side.
5. **Evidence Appendix** — thumbnail/reference to each original evidence item with its extracted (redacted) fields.
6. **Redaction Notice** — a short standard paragraph stating what was redacted and why, for transparency.

### 12.2 Export
- Rendered first as HTML (for in-app preview).
- Exported to PDF via headless-browser print or a PDF library (e.g. WeasyPrint) — same HTML, no duplicate templating logic.

---

## 13. Data Model

```
User
 ├─ id, email (unique), password_hash, created_at

Case
 ├─ id, user_id (FK → User.id), title, created_at

EvidenceItem
 ├─ id, case_id (FK), evidence_type, raw_image_path (nullable),
 │  raw_text (nullable), created_at

ExtractedField
 ├─ id, evidence_item_id (FK), timestamp, timestamp_confidence,
 │  amount, currency, transaction_id, phone_numbers (json array),
 │  urls (json array), sender, recipient, raw_text_summary,
 │  extraction_confidence

Gap
 ├─ id, case_id (FK), type, evidence_id_1 (FK), evidence_id_2 (FK),
 │  description, duration_minutes

Conflict
 ├─ id, case_id (FK), field, evidence_id_1 (FK), evidence_id_2 (FK),
 │  value_1, value_2, description
```

---

## 14. API Surface (indicative)

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/auth/register` | Create user account (email + hashed password) |
| POST | `/auth/login` | Authenticate, issue JWT access + refresh token |
| POST | `/auth/refresh` | Exchange refresh token for new access token |
| POST | `/cases` | Create a new case (requires auth, owner = current user) |
| POST | `/cases/{id}/evidence` | Upload an evidence item (image or text) |
| GET | `/cases/{id}/evidence/{eid}/extraction` | Trigger/fetch extraction result for one item |
| PATCH | `/cases/{id}/evidence/{eid}/extraction` | User correction of extracted fields |
| POST | `/cases/{id}/timeline/build` | Run reconciliation: sort, gap detection, conflict detection |
| GET | `/cases/{id}/timeline` | Fetch assembled timeline with gaps/conflicts |
| POST | `/cases/{id}/report` | Generate redacted report (HTML + PDF) |
| POST | `/cases/{id}/report/unredact` | Toggle investigator mode (logged) |

---

## 15. Tech Stack

| Layer | Choice | Reasoning |
|---|---|---|
| Frontend | React + Tailwind | Fast to build, team likely already knows it |
| Backend | FastAPI (Python) | Fast to wire up, good for LLM API calls, async support |
| Extraction | Claude API (vision-capable) with enforced JSON schema | Single call handles OCR + structured extraction, avoids a brittle separate OCR stage |
| Database | SQLite for demo, Postgres if time permits | Doesn't matter for hackathon judging — keep it boring and working |
| Redaction | Custom regex/rule functions | Deterministic, auditable, no model dependency |
| Auth | JWT (e.g. `python-jose`/`PyJWT`) + `passlib` (bcrypt/argon2 hashing) | Standard, well-documented, fast to wire into FastAPI |
| Data layer | SQLAlchemy ORM (parameterized queries only) | Structurally prevents SQL injection, no raw query strings |
| Report export | HTML template → PDF via WeasyPrint / headless Chrome print | One template, two outputs |
| Hosting | Vercel (frontend) + Render/Railway (backend), or single-VM deploy | Fast, reliable, avoid over-engineering deployment |

---

## 16. Feature Prioritization

🔴 **MUST HAVE**
- Authentication (register/login, JWT-gated routes, per-user case ownership)
- Parameterized-query data layer (no raw SQL, ORM-only) — SQL injection prevention by construction
- Evidence upload (image + text)
- Extraction pipeline with confidence scores
- Chronological timeline rendering
- Gap detection (temporal)
- Redaction layer (phone, account, email, URL)
- Report generation (HTML + PDF export)

🟡 **SHOULD HAVE**
- Structural gap detection (referenced-but-missing evidence)
- Conflict detection (amount/time/sender/txn ID mismatches)
- Manual correction of extracted fields before timeline build

🟢 **WOW FEATURE**
- Interactive timeline with visual gap markers and inline conflict comparison cards (demo centerpiece)
- Investigator Mode with access-logging banner

⚫ **POST-HACKATHON (do not build now)**
- Multi-user auth/roles/case-sharing
- Cross-case entity graph
- Real bank/telecom API integrations
- Narrative/semantic contradiction detection
- Any model fine-tuning

---

## 17. Non-Functional Requirements

- **Reliability over cleverness:** every module must degrade gracefully — a failed extraction shows "unextracted, please fill manually," not a crash.
- **Redaction correctness is non-negotiable:** unit tests must cover phone, account number, and email masking with edge cases (numbers embedded in sentences, multiple numbers in one item, international formats).
- **Latency:** extraction per evidence item should complete within a few seconds; batch of 8 items should fully process within demo-acceptable time (~30-45 sec total, run in parallel where possible).
- **No external dependency on the critical demo path** beyond the extraction LLM call itself — everything else (redaction, gap/conflict logic, report render) must work fully offline once extraction JSON is available, with cached seed data as fallback.
- **Auth and data-access security are non-negotiable, same tier as redaction correctness:** all routes past login must reject unauthenticated requests; all case/evidence lookups must be scoped to the requesting user; all database access must go through parameterized ORM calls with zero raw SQL string construction.

---

## 18. Risks and Mitigations

| Risk | Mitigation |
|---|---|
| Live extraction fails/is slow during demo | Pre-run extraction on seed evidence set, cache results, use as fallback path if live upload underperforms |
| OCR/extraction misreads a field | Show confidence scores + allow manual correction before timeline build; never silently trust low-confidence values |
| Conflict/gap detection produces false positives | Keep matching logic simple and explainable (amount+time proximity, not fuzzy NLP); tune threshold values against seed data before demo |
| Redaction misses an edge-case format (e.g. unusual phone format) | Write and run a dedicated redaction test suite against 15-20 sample strings before submission |
| Scope creep into full multi-role IAM (admin/investigator tiers, OAuth, MFA) | Explicitly out of scope (Section 6a.4) — ship single-tier email/password auth, don't build an identity platform |
| A stray raw SQL query slips in under time pressure and reopens injection risk | Code review checklist item before submission: grep the codebase for raw SQL string construction (`f"SELECT`, `.format(`, string `+` near query calls) and confirm zero hits |

---

## 19. Demo Script (aligned to hackathon judging)

**0:00–0:20** — Problem hook: "Fraud victims end up with 6 screenshots and no idea what happened when."
**0:20–0:45** — Why current approach fails: manual reconstruction, no gap/conflict awareness, PII pasted carelessly into complaints.
**0:45–1:30** — Live demo: upload 3-4 seed evidence items, extraction fields appear, timeline builds.
**1:30–2:00** — Wow moment: gap marker and conflict card appear live on the timeline — "the system caught what we didn't."
**2:00–2:30** — Redacted report generated and exported; toggle Investigator Mode to show the audit-logged unmask.
**2:30–3:00** — Impact + close: "this turns a mess of screenshots into a report a bank or cyber-cell can act on in minutes, without ever leaking the victim's own data."

---

## 20. Judge Q&A Prep

| Question | Answer |
|---|---|
| Why not use OCR then NLP separately? | A single vision LLM call handles both robustly across inconsistent screenshot formats; fewer failure points for a live demo. |
| How do you guarantee redaction never leaks data? | Redaction is a deterministic, unit-tested rule-based function applied at render time — not model-inferred, so its behavior is provable, not probabilistic. |
| What if the AI extracts something wrong? | Every field carries a confidence score; low-confidence fields are visibly flagged and user-correctable before the timeline is finalized. |
| How does contradiction detection actually work? | Structured-field comparison only (amount/time/sender/txn ID) between evidence items matched as the same event — deliberately not semantic/narrative inference, to keep it reliable and explainable. |
| How would this scale to real deployment? | Modular monolith today; extraction service and reconciliation engine can be split into separate services later if load requires it — not needed at hackathon scale. |
| What's the actual "AI" doing here, concretely? | Structured extraction from unstructured evidence (image/text → JSON). Everything downstream — timeline, gaps, conflicts, redaction — is deterministic logic on top of that extraction, which is intentional: judgment calls stay auditable. |
| How do you prevent SQL injection? | All database access goes through an ORM with parameterized queries — there is no raw, string-concatenated SQL anywhere in the codebase, so there's no injection surface to sanitize against in the first place. We also ran standard injection payloads against every text input as a verification pass before submission. |
| How is user data/case access protected? | JWT-based auth gates every case route, and every query is scoped to `user_id = current_user.id` — a user cannot access another user's case even with a guessed or enumerated case ID. Passwords are hashed with bcrypt/argon2, never stored or logged in plaintext. |

---

## 21. Stretch Ideas to Strengthen Win Chances

Pushback first: do not touch any of these until MUST + SHOULD (Section 16) are fully working end-to-end and demo-tested. A half-built stretch feature that breaks live is worse than not having it. These are ranked by effort-to-impact ratio, cheapest first.

1. **Evidence integrity hash (low effort, high credibility)** — compute a SHA-256 hash of each uploaded evidence file at ingestion time and display it in the report appendix ("Evidence integrity: `a3f9...`"). This is a real forensic-chain-of-custody concept, costs almost nothing to implement, and directly strengthens your privacy/security narrative — a judge who knows anything about digital forensics will notice it.
2. **Severity/urgency badge on the case summary (low effort)** — a simple rule-based badge (not ML) based on presence of financial loss + repeat payment requests, e.g. "Active financial fraud — repeat contact detected." Cheap, visually strong on the report's first page, reuses data you already extracted.
3. **Explainability on every flag (low effort, high judge-trust value)** — every gap/conflict marker already has a `description` field (Sections 9.3, 10.3); surface it as a one-line "why this was flagged" tooltip. Judges reward systems that show their reasoning instead of black-box outputs — this is nearly free since the data already exists.
4. **Shareable redacted report link (medium effort)** — a read-only, expiring share link (e.g. 24-hour token) for the redacted report only, so a victim could send it to a bank without creating an account for the recipient. Good demo beat ("here's what the bank actually receives") but adds a new auth-adjacent surface, so budget real time for it and don't attempt it if you're behind schedule.
5. **Multi-format export (low effort once PDF export exists)** — add a structured JSON export alongside PDF/HTML, framed as "machine-readable for downstream case-management systems." Costs little once the HTML template exists, and signals real-world integration thinking without you having to build any actual integration.
6. **Before/after redaction toggle animation on the report itself (low effort, high demo polish)** — a single UI toggle that visually swaps redacted↔unredacted text with a subtle animation, rather than a separate "mode." Cheap to build (it's the same data, two render states), and it's a strong 5-second visual beat for the demo that directly shows the privacy claim rather than just stating it.

**What I would explicitly avoid, even though it's tempting:** any real integration with a bank/telecom/police API (item you don't control, guaranteed demo risk), any ML-based severity scoring (adds unexplainable complexity for a feature that's more credible as simple deterministic rules), and multi-language support unless a teammate is free with nothing else to do — it's real effort for a feature that doesn't touch your core differentiator (gap/conflict detection).

## 22. Open Decisions (to confirm before/while building)

1. Gap threshold default (20 min suggested) — confirm or adjust based on realistic fraud-incident pacing.
2. Whether transaction IDs are redacted by default in the shareable report, or always kept visible (recommended: visible, since they're needed for case reference and aren't personally identifying on their own).
3. Team's current stack familiarity and available hours remaining — needed to convert Section 16 into a time-boxed build schedule.
