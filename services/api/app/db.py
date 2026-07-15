import json
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from .config import get_settings

SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL, role TEXT NOT NULL, active INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, game TEXT NOT NULL, stage TEXT NOT NULL,
  deadline TEXT NOT NULL, progress INTEGER NOT NULL DEFAULT 0,
  lines_total INTEGER NOT NULL DEFAULT 0, lines_done INTEGER NOT NULL DEFAULT 0,
  retakes INTEGER NOT NULL DEFAULT 0, members INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS retakes (
  id TEXT PRIMARY KEY, project_id TEXT NOT NULL, target_type TEXT NOT NULL,
  target TEXT NOT NULL, assigned_to TEXT NOT NULL, requested_by TEXT NOT NULL,
  reason TEXT NOT NULL, priority TEXT NOT NULL, status TEXT NOT NULL,
  deadline TEXT NOT NULL, version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS files (
  id TEXT PRIMARY KEY, project_id TEXT NOT NULL, target_type TEXT NOT NULL,
  filename TEXT NOT NULL, storage_path TEXT NOT NULL, public_url TEXT,
  size_bytes INTEGER NOT NULL, uploaded_by TEXT NOT NULL, created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS audit_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT, actor_id TEXT NOT NULL, action TEXT NOT NULL,
  resource_type TEXT NOT NULL, resource_id TEXT NOT NULL, payload TEXT NOT NULL,
  created_at TEXT NOT NULL
);
"""

@contextmanager
def connection():
    settings = get_settings()
    path = Path(settings.database_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()

def init_db() -> None:
    with connection() as conn:
        conn.executescript(SCHEMA)
        if conn.execute("SELECT COUNT(*) AS c FROM projects").fetchone()["c"] == 0:
            conn.executemany("INSERT INTO projects VALUES (?,?,?,?,?,?,?,?,?,?)", [
                ("OD-001","Project Nightfall","Action RPG","Kayıt Kontrolü","2026-07-24",68,3840,2612,37,24),
                ("OD-002","Iron Province","Strategy","Çeviri","2026-08-12",31,6720,2084,8,18),
                ("OD-003","Echoes of Meridian","Adventure","Miksaj","2026-07-19",86,1520,1307,14,12),
            ])

def audit(conn: sqlite3.Connection, actor_id: str, action: str, resource_type: str, resource_id: str, payload: dict) -> None:
    conn.execute(
        "INSERT INTO audit_events(actor_id,action,resource_type,resource_id,payload,created_at) VALUES (?,?,?,?,?,?)",
        (actor_id, action, resource_type, resource_id, json.dumps(payload, ensure_ascii=False), datetime.now(timezone.utc).isoformat())
    )
