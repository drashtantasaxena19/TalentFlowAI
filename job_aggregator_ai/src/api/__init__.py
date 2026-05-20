from fastapi import APIRouter

from src.api.routes import router as jobs_router
from src.api.resume import resume_router
from src.api.saved_jobs import router as saved_jobs_router
from src.api.job_prefetch_routes import router as prefetch_router
from src.api.candidate_routes import candidate_router
from src.api.profile_analysis import router as profile_analysis_router
from src.api.applications_routes import router as applications_router

api_router = APIRouter()

api_router.include_router(
    jobs_router
)

api_router.include_router(
    resume_router
)

api_router.include_router(
    saved_jobs_router
)

api_router.include_router(
    prefetch_router
)

api_router.include_router(
    candidate_router
)

api_router.include_router(
    profile_analysis_router
)

api_router.include_router(
    applications_router
)