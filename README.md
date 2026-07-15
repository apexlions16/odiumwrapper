# Odium Studio Wrapper

Odium Studio Wrapper is a Windows-first dubbing production system for voice actors, directors, translators, mixers, QA and system administrators.

## v0.1.0 features

- Electron desktop application with role-aware navigation and dashboards
- Login/session flow and demo mode
- Project, line, deadline and progress views
- Retake workflow for voice recordings, translations and mixer deliveries
- File upload API with optional public Hugging Face Dataset storage
- FastAPI + SQLite backend prepared for a Hugging Face Docker Space
- GitHub Actions Windows release pipeline
- In-app update checks through GitHub Releases (`electron-updater`)

## Quick start

```bash
npm install
npm run dev
```

Start the API in a second terminal:

```bash
cd services/api
python -m venv .venv
# Windows: .venv\Scripts\activate
# Linux/macOS: source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 7860
```

Demo accounts use password `odium123`:

- `admin@demo.odium.studio` — system admin
- `director@demo.odium.studio` — project director
- `actor@demo.odium.studio` — voice actor
- `mixer@demo.odium.studio` — mixer
- `translator@demo.odium.studio` — translator
- `qa@demo.odium.studio` — quality control

## Hugging Face deployment

Create a Docker Space and copy `services/api` as the Space root. Configure:

- `JWT_SECRET`: a long random secret
- `HF_TOKEN`: write token for the storage dataset
- `HF_STORAGE_REPO`: e.g. `apexlions16/odium-storage`
- `HF_STORAGE_PUBLIC=true`
- `CORS_ORIGINS=*` for initial testing, then restrict it

The API stores operational data in SQLite and mirrors uploaded project files and database backups to a public Hugging Face Dataset repository when configured.

## Updates

Users install the application once. The desktop app checks GitHub Releases for a newer version, downloads the NSIS update in-app and installs it on restart. Future releases are created by pushing a `v*` tag. The release contains the setup EXE, `latest.yml` and blockmap needed by the updater.

> Server-side changes appear without redistributing the desktop installer. Desktop/native changes still require a new release, but installed users receive it through the app instead of being sent a new EXE manually.
