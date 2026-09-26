# Scripts

Cross-platform development scripts for **Ignithon 2.0 — Fraud Evidence-to-Incident-Report System**.

```
scripts/
├── windows/          # Windows batch scripts (.bat)
│   ├── dev.bat           ← Start both servers (parallel windows)
│   ├── dev-backend.bat   ← FastAPI only
│   ├── dev-frontend.bat  ← Vite only
│   ├── install.bat       ← Install all dependencies
│   ├── build.bat         ← Build frontend for production
│   ├── test.bat          ← Run backend tests
│   ├── lint.bat          ← Lint backend + frontend
│   └── clean.bat         ← Remove build artifacts
│
└── linux/            # Linux/macOS shell scripts (.sh)
    ├── dev.sh
    ├── dev-backend.sh
    ├── dev-frontend.sh
    ├── install.sh
    ├── build.sh
    ├── test.sh
    ├── lint.sh
    └── clean.sh
```

---

## Prerequisites

| Tool | Purpose | Install |
|------|---------|---------|
| **Python 3.12+** | Backend runtime | [python.org](https://www.python.org/downloads/) |
| **uv** | Python package manager | `pip install uv` or [docs.astral.sh/uv](https://docs.astral.sh/uv/getting-started/installation/) |
| **Node.js 20+** | Frontend runtime | [nodejs.org](https://nodejs.org/) |
| **npm 10+** | Frontend package manager | Bundled with Node.js |

---

## First-Time Setup

### Windows
```bat
scripts\windows\install.bat
```

### Linux / macOS
```bash
chmod +x scripts/linux/*.sh   # make executable (only needed once)
./scripts/linux/install.sh
```

This will:
1. Run `uv sync --all-groups` in `Backend/` — creates `.venv` and installs all Python deps
2. Run `npm install` in `frontend/` — installs all JS deps

---

## Running the App

### Development (both servers, live-reload)

| OS | Command |
|----|---------|
| Windows | `scripts\windows\dev.bat` |
| Linux/macOS | `./scripts/linux/dev.sh` |

- **Backend** → `http://127.0.0.1:8000` (FastAPI + Uvicorn, hot-reload)
- **Frontend** → `http://localhost:5173` (Vite, HMR)
- **API Docs** → `http://127.0.0.1:8000/docs` (Swagger UI)

> **Windows note:** `dev.bat` opens two separate terminal windows — one per server. Close either window to stop that server.

> **Linux note:** `dev.sh` runs both in the same terminal. Press `Ctrl+C` once to stop both servers cleanly.

---

## Individual Servers

### Backend only

```bat
# Windows
scripts\windows\dev-backend.bat

# Linux/macOS
./scripts/linux/dev-backend.sh
```

### Frontend only

```bat
# Windows
scripts\windows\dev-frontend.bat

# Linux/macOS
./scripts/linux/dev-frontend.sh
```

---

## Build (Production)

Compiles the React/Vite frontend into `frontend/dist/`:

```bat
# Windows
scripts\windows\build.bat

# Linux/macOS
./scripts/linux/build.sh
```

---

## Testing

Runs the backend pytest suite with verbose output:

```bat
# Windows
scripts\windows\test.bat

# Linux/macOS
./scripts/linux/test.sh
```

Test files live in `Backend/tests/`.

---

## Linting

Runs **ruff** (Python) + **oxlint** (JavaScript) and exits `1` if errors are found:

```bat
# Windows
scripts\windows\lint.bat

# Linux/macOS
./scripts/linux/lint.sh
```

---

## Clean

Removes generated artifacts — safe to run before a fresh install:

| Removed | What |
|---------|------|
| `frontend/dist/` | Production build output |
| `frontend/node_modules/.vite` | Vite dev cache |
| `Backend/.venv` | Python virtual environment |
| `Backend/uv.lock` | Lockfile |
| `Backend/fraud_evidence.db` | Local SQLite database |
| `Backend/**/__pycache__` | Python bytecode cache |

```bat
# Windows
scripts\windows\clean.bat

# Linux/macOS
./scripts/linux/clean.sh
```

> After `clean`, run `install` again to restore the environment.

---

## Environment Variables

Copy `.env.example` to `.env` inside `Backend/` before starting:

```bat
copy Backend\.env.example Backend\.env    # Windows
cp Backend/.env.example Backend/.env     # Linux/macOS
```

Edit `Backend/.env` and fill in your API keys:

```env
GEMINI_API_KEY=your-key-here
SECRET_KEY=change-this-in-production
```
