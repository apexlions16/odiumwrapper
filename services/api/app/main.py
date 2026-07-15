import shutil
from datetime import datetime, timezone
from pathlib import Path
from typing import Annotated, Literal
from uuid import uuid4
from fastapi import Depends, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field
from huggingface_hub import HfApi
from .auth import authenticate, create_token, current_user, require_roles, seed_users
from .config import get_settings
from .db import audit, connection, init_db
from .storage import save_upload

settings = get_settings()
app = FastAPI(title="Odium Studio Wrapper API", version="0.1.0")
app.add_middleware(CORSMiddleware, allow_origins=settings.cors_list, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)

class RetakeCreate(BaseModel):
    project_id: str
    target_type: Literal["voice_line","translation","mix_line","mix_package","final_delivery"]
    target: str
    assigned_to: str
    reason: str
    priority: Literal["Normal","Yüksek","Kritik"] = "Normal"
    deadline: str

@app.on_event("startup")
def startup() -> None:
    init_db(); seed_users()

@app.get("/")
def root():
    return {"name":"Odium Studio Wrapper API","version":"0.1.0","status":"ready"}

@app.get("/health")
def health():
    return {"status":"ok","storage":"huggingface" if settings.hf_storage_repo else "local"}

@app.post("/auth/login")
def login(payload: LoginRequest):
    user = authenticate(payload.email, payload.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return {"access_token": create_token(user), "token_type":"bearer", "user": {k:user[k] for k in ("id","name","email","role")}}

@app.get("/auth/me")
def me(user: Annotated[dict, Depends(current_user)]):
    return user

@app.get("/projects")
def list_projects(user: Annotated[dict, Depends(current_user)]):
    with connection() as conn:
        return [dict(row) for row in conn.execute("SELECT * FROM projects ORDER BY deadline")]

@app.get("/retakes")
def list_retakes(user: Annotated[dict, Depends(current_user)]):
    query, params = "SELECT * FROM retakes ORDER BY created_at DESC", ()
    if user["role"] in {"voice_actor","mixer","translator"}:
        query, params = "SELECT * FROM retakes WHERE assigned_to=? ORDER BY created_at DESC", (user["id"],)
    with connection() as conn:
        return [dict(row) for row in conn.execute(query, params)]

@app.post("/retakes", status_code=201)
def create_retake(payload: RetakeCreate, user: Annotated[dict, Depends(require_roles("system_admin","project_director","voice_director","script_editor","qa"))]):
    now = datetime.now(timezone.utc).isoformat(); retake_id = f"RT-{uuid4().hex[:8].upper()}"
    with connection() as conn:
        conn.execute("INSERT INTO retakes VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)", (retake_id,payload.project_id,payload.target_type,payload.target,payload.assigned_to,user["id"],payload.reason,payload.priority,"Bekleniyor",payload.deadline,1,now,now))
        audit(conn,user["id"],"retake.created","retake",retake_id,payload.model_dump())
    return {"id":retake_id,"status":"Bekleniyor"}

@app.post("/files/upload", status_code=201)
async def upload(project_id: Annotated[str, Form()], target_type: Annotated[str, Form()], file: Annotated[UploadFile, File()], user: Annotated[dict, Depends(require_roles("system_admin","project_director","voice_director","voice_actor","translator","script_editor","mixer","qa"))]):
    result = await save_upload(file, project_id, target_type)
    now = datetime.now(timezone.utc).isoformat()
    with connection() as conn:
        conn.execute("INSERT INTO files VALUES (?,?,?,?,?,?,?,?,?)", (result["id"],project_id,target_type,result["filename"],result["storage_path"],result["public_url"],result["size"],user["id"],now))
        audit(conn,user["id"],"file.uploaded","file",result["id"],{"project_id":project_id,"target_type":target_type,"filename":result["filename"]})
    return result

@app.get("/files")
def files(user: Annotated[dict, Depends(current_user)], project_id: str | None = None):
    with connection() as conn:
        if project_id:
            rows = conn.execute("SELECT * FROM files WHERE project_id=? ORDER BY created_at DESC", (project_id,))
        else:
            rows = conn.execute("SELECT * FROM files ORDER BY created_at DESC LIMIT 200")
        return [dict(row) for row in rows]

@app.post("/admin/backup")
def backup(user: Annotated[dict, Depends(require_roles("system_admin"))]):
    source = Path(settings.database_path)
    if not source.exists(): raise HTTPException(status_code=404, detail="Database not found")
    stamp = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
    backup_path = source.parent / f"odium-{stamp}.db"
    shutil.copy2(source, backup_path)
    public_url = None
    if settings.hf_token and settings.hf_storage_repo:
        remote = f"backups/database/{backup_path.name}"
        HfApi(token=settings.hf_token).upload_file(path_or_fileobj=str(backup_path),path_in_repo=remote,repo_id=settings.hf_storage_repo,repo_type="dataset",commit_message=f"Database backup {stamp}")
        public_url = f"https://huggingface.co/datasets/{settings.hf_storage_repo}/resolve/main/{remote}"
    return {"filename":backup_path.name,"public_url":public_url}
