from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class CompanyProfilePayload(BaseModel):
    companyName: str = Field(default="")
    industry: str = Field(default="")
    website: str = Field(default="")
    location: str = Field(default="")
    size: str = Field(default="")
    foundedYear: Optional[int] = None
    description: str = Field(default="")
    logoUrl: str = Field(default="")
    linkedin: str = Field(default="")
    contactEmail: str = Field(default="")
    contactPhone: str = Field(default="")


def company_profile_doc(payload: CompanyProfilePayload, employer: dict):
    now = datetime.utcnow()

    return {
        "employerId": str(employer.get("_id") or employer.get("id") or ""),
        "employerEmail": employer.get("email", ""),
        "companyName": payload.companyName.strip(),
        "industry": payload.industry.strip(),
        "website": payload.website.strip(),
        "location": payload.location.strip(),
        "size": payload.size.strip(),
        "foundedYear": payload.foundedYear,
        "description": payload.description.strip(),
        "logoUrl": payload.logoUrl.strip(),
        "linkedin": payload.linkedin.strip(),
        "contactEmail": payload.contactEmail.strip(),
        "contactPhone": payload.contactPhone.strip(),
        "updatedAt": now,
    }