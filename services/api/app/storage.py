from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4
from fastapi import UploadFile
from huggingface_hub import HfApi, hf_hub_url
from .config import get_settings

async def save_upload(file: UploadFile, project_id: str, target_type: str) -> dict:
    settings = get_settings()
    suffix = Path(file.filename or "upload.bin").suffix
    object_id = uuid4().hex
    remote_path = f"projects/{project_id}/{target_type}/{datetime.now(timezone.utc):%Y/%m}/{object_id}{suffix}"
    local_root = Path(settings.local_storage_path)
    local_file = local_root / remote_path
    local_file.parent.mkdir(parents=True, exist_ok=True)
    size = 0
    with local_file.open("wb") as output:
        while chunk := await file.read(1024 * 1024):
            size += len(chunk)
            output.write(chunk)
    public_url = None
    if settings.hf_token and settings.hf_storage_repo:
        api = HfApi(token=settings.hf_token)
        api.create_repo(settings.hf_storage_repo, repo_type="dataset", private=not settings.hf_storage_public, exist_ok=True)
        api.upload_file(path_or_fileobj=str(local_file), path_in_repo=remote_path, repo_id=settings.hf_storage_repo, repo_type="dataset", commit_message=f"Upload {file.filename}")
        public_url = hf_hub_url(settings.hf_storage_repo, remote_path, repo_type="dataset")
    return {"id": object_id, "filename": file.filename, "storage_path": remote_path, "size": size, "public_url": public_url}
