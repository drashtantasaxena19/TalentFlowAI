from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.api.routes import router
from src.api.auth_routes import auth_router
from src.api.candidate_routes import candidate_router
from src.api.resume import resume_router
from src.api.saved_jobs import router as saved_jobs_router
from src.api.subscription_routes import router as subscription_router
from src.api.payment_routes import router as payment_router
from src.api.job_prefetch_routes import router as job_prefetch_router
from src.api.employer_routes import router as employer_router
from src.api.admin_routes import admin_router
from src.api.application_routes import router as application_router

app = FastAPI(title="TalentFlow AI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)
app.include_router(auth_router)
app.include_router(candidate_router)
app.include_router(resume_router)
app.include_router(saved_jobs_router)
app.include_router(job_prefetch_router)
app.include_router(employer_router, prefix="/api")
app.include_router(subscription_router, prefix="/api")
app.include_router(payment_router, prefix="/api")
app.include_router(admin_router, prefix="/api")
app.include_router(application_router, prefix="/api")


@app.get("/")
def home():
    return {"message": "TalentFlow AI Backend Running"}