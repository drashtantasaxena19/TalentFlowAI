from fastapi import APIRouter, Depends
from typing import Dict, Any

from src.middleware.auth_middleware import get_current_user
from src.models.company_model import CompanyProfilePayload

from src.services.employer_service import (
    get_company_profile,
    save_company_profile,
    create_employer_job,
    get_employer_jobs,
    update_employer_job,
    delete_employer_job,
    get_employer_dashboard,
    get_employer_applicants,
    update_applicant_status,
    rank_candidates_for_job,
)

from src.ai.recruiter_ai_engine import (
    analyze_candidate_intelligence,
)

router = APIRouter(
    prefix="/employer",
    tags=["Employer"],
)


@router.get("/dashboard")
async def employer_dashboard(
    current_user: dict = Depends(get_current_user),
):
    return await get_employer_dashboard(current_user)


@router.get("/company-profile")
async def employer_company_profile(
    current_user: dict = Depends(get_current_user),
):
    return await get_company_profile(current_user)


@router.post("/company-profile")
async def employer_save_company_profile(
    payload: CompanyProfilePayload,
    current_user: dict = Depends(get_current_user),
):
    return await save_company_profile(
        payload,
        current_user,
    )


@router.get("/jobs")
async def employer_jobs(
    current_user: dict = Depends(get_current_user),
):
    return await get_employer_jobs(current_user)


@router.post("/jobs")
async def employer_create_job(
    payload: Dict[str, Any],
    current_user: dict = Depends(get_current_user),
):
    return await create_employer_job(
        payload,
        current_user,
    )


@router.put("/jobs/{job_id}")
async def employer_update_job(
    job_id: str,
    payload: Dict[str, Any],
    current_user: dict = Depends(get_current_user),
):
    return await update_employer_job(
        job_id,
        payload,
        current_user,
    )


@router.delete("/jobs/{job_id}")
async def employer_delete_job(
    job_id: str,
    current_user: dict = Depends(get_current_user),
):
    return await delete_employer_job(
        job_id,
        current_user,
    )


@router.get("/applicants")
async def employer_applicants(
    current_user: dict = Depends(get_current_user),
):
    return await get_employer_applicants(current_user)


@router.put("/applicants/{application_id}/status")
async def employer_update_applicant_status(
    application_id: str,
    payload: Dict[str, Any],
    current_user: dict = Depends(get_current_user),
):
    return await update_applicant_status(
        application_id,
        payload,
        current_user,
    )


@router.get("/rank-candidates/{job_id}")
async def employer_rank_candidates(
    job_id: str,
    current_user: dict = Depends(get_current_user),
):
    return await rank_candidates_for_job(
        job_id,
        current_user,
    )


@router.post("/ai-analyze")
async def employer_ai_analyze_candidate(
    payload: Dict[str, Any],
    current_user: dict = Depends(get_current_user),
):
    return await analyze_candidate_intelligence(
        payload,
        current_user,
    )