from fastapi import APIRouter, Depends, HTTPException

from src.middleware.auth_middleware import get_current_user
from src.services.job_prefetch_service import (
    queue_job_prefetch,
    get_prefetch_result,
    clear_prefetch_result,
)

router = APIRouter(prefix="/api/jobs", tags=["Job Prefetch"])


@router.post("/prefetch")
async def prefetch_jobs(
    current_user: dict = Depends(get_current_user),
):
    email = current_user.get("email")
    role = current_user.get("role")

    if not email:
        raise HTTPException(status_code=401, detail="Invalid authenticated user")

    if role != "candidate":
        raise HTTPException(
            status_code=403,
            detail="Only candidates can prefetch recommended jobs"
        )

    return await queue_job_prefetch(email)


@router.get("/prefetch-result")
async def prefetch_result(
    current_user: dict = Depends(get_current_user),
):
    email = current_user.get("email")
    role = current_user.get("role")

    if not email:
        raise HTTPException(status_code=401, detail="Invalid authenticated user")

    if role != "candidate":
        raise HTTPException(
            status_code=403,
            detail="Only candidates can view prefetched jobs"
        )

    return await get_prefetch_result(email)


@router.delete("/prefetch-clear")
async def prefetch_clear(
    current_user: dict = Depends(get_current_user),
):
    email = current_user.get("email")
    role = current_user.get("role")

    if not email:
        raise HTTPException(status_code=401, detail="Invalid authenticated user")

    if role != "candidate":
        raise HTTPException(
            status_code=403,
            detail="Only candidates can clear job prefetch"
        )

    return await clear_prefetch_result(email)