import base64
import hashlib
import hmac
import os
from datetime import datetime, timedelta, timezone
from typing import Annotated
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from .config import get_settings
from .db import connection


def hash_password(password: str) -> str:
    salt = os.urandom(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 310_000)
    return "pbkdf2_sha256$310000$" + base64.urlsafe_b64encode(salt).decode() + "$" + base64.urlsafe_b64encode(digest).decode()


def verify_password(password: str, encoded: str) -> bool:
    try:
        algorithm, iterations, salt_b64, digest_b64 = encoded.split("$", 3)
        if algorithm != "pbkdf2_sha256":
            return False
        salt = base64.urlsafe_b64decode(salt_b64.encode())
        expected = base64.urlsafe_b64decode(digest_b64.encode())
        actual = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, int(iterations))
        return hmac.compare_digest(actual, expected)
    except (ValueError, TypeError):
        return False

bearer = HTTPBearer(auto_error=False)
DEMO_PASSWORD = "odium123"
DEMO_USERS = [
    ("u-admin","Odium Admin","admin@demo.odium.studio","system_admin"),
    ("u-director","Proje Yönetmeni","director@demo.odium.studio","project_director"),
    ("u-actor","Deniz Aksoy","actor@demo.odium.studio","voice_actor"),
    ("u-mixer","Mert Kaya","mixer@demo.odium.studio","mixer"),
    ("u-translator","Ece Yalın","translator@demo.odium.studio","translator"),
    ("u-qa","Kalite Ekibi","qa@demo.odium.studio","qa"),
]

def seed_users() -> None:
    if get_settings().disable_demo_users:
        return
    hashed = hash_password(DEMO_PASSWORD)
    with connection() as conn:
        for user_id, name, email, role in DEMO_USERS:
            conn.execute(
                "INSERT OR IGNORE INTO users(id,name,email,password_hash,role,active) VALUES (?,?,?,?,?,1)",
                (user_id, name, email, hashed, role)
            )

def authenticate(email: str, password: str):
    with connection() as conn:
        row = conn.execute("SELECT * FROM users WHERE lower(email)=lower(?) AND active=1", (email,)).fetchone()
    if not row or not verify_password(password, row["password_hash"]):
        return None
    return dict(row)

def create_token(user: dict) -> str:
    settings = get_settings()
    expires = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_minutes)
    return jwt.encode({"sub": user["id"], "role": user["role"], "exp": expires}, settings.jwt_secret, algorithm="HS256")

def current_user(credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer)]):
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")
    try:
        payload = jwt.decode(credentials.credentials, get_settings().jwt_secret, algorithms=["HS256"])
        user_id = payload.get("sub")
    except JWTError as exc:
        raise HTTPException(status_code=401, detail="Invalid session") from exc
    with connection() as conn:
        row = conn.execute("SELECT id,name,email,role,active FROM users WHERE id=?", (user_id,)).fetchone()
    if not row or not row["active"]:
        raise HTTPException(status_code=401, detail="Inactive account")
    return dict(row)

def require_roles(*roles: str):
    def dependency(user: Annotated[dict, Depends(current_user)]):
        if user["role"] not in roles:
            raise HTTPException(status_code=403, detail="This role cannot perform the action")
        return user
    return dependency
