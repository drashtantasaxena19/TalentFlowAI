from datetime import datetime
import os
from typing import Literal

from fastapi import APIRouter, HTTPException, Response, Depends
from pydantic import BaseModel, EmailStr, Field

from src.models.user_model import create_user, get_user_by_email
from src.services.auth_service import (
    hash_password,
    verify_password,
    create_access_token,
)
from src.middleware.auth_middleware import get_current_user, COOKIE_NAME

auth_router = APIRouter(prefix="/api/auth", tags=["Auth"])

COOKIE_SECURE = os.getenv("COOKIE_SECURE", "false").lower() == "true"
COOKIE_SAMESITE: Literal["lax", "strict", "none"] = os.getenv(
    "COOKIE_SAMESITE", "lax"
).lower()  # type: ignore
COOKIE_MAX_AGE = int(os.getenv("COOKIE_MAX_AGE", str(60 * 60 * 24 * 7)))


class SignupRequest(BaseModel):
    name: str = Field(..., min_length=2)
    email: EmailStr
    password: str = Field(..., min_length=6)
    role: str
    companyName: str | None = ""


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    role: str


def set_auth_cookie(response: Response, token: str):
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=COOKIE_MAX_AGE,
        path="/",
    )


def clear_auth_cookie(response: Response):
    response.delete_cookie(
        key=COOKIE_NAME,
        path="/",
    )

def public_user(user: dict):
    return {
        "name": user.get("name", ""),
        "email": user.get("email", ""),
        "role": user.get("role", ""),
        "companyName": user.get("companyName", ""),
    }


@auth_router.post("/signup")
async def signup(payload: SignupRequest, response: Response):
    if payload.role not in ["candidate", "employer"]:
        raise HTTPException(status_code=400, detail="Invalid role")

    company_name = payload.companyName.strip() if payload.companyName else ""

    user_data = {
        "name": payload.name.strip(),
        "email": payload.email.lower(),
        "password": hash_password(payload.password),
        "role": payload.role,
        "companyName": company_name if payload.role == "employer" else "",
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow(),
        "isActive": True,
    }

    user = await create_user(user_data)

    if not user:
        raise HTTPException(status_code=400, detail="User already exists")

    token = create_access_token({
        "email": user_data["email"],
        "role": user_data["role"],
    })

    set_auth_cookie(response, token)

    return {
        "message": "Signup successful",
        "user": public_user(user_data),
    }


@auth_router.post("/login")
async def login(payload: LoginRequest, response: Response):
    user = await get_user_by_email(payload.email.lower())

    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not verify_password(payload.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if user.get("role") != payload.role:
        raise HTTPException(status_code=403, detail="Selected role does not match this account")

    if user.get("isActive") is False:
        raise HTTPException(status_code=403, detail="Account is disabled")

    token = create_access_token({
        "email": user["email"],
        "role": user["role"],
    })

    set_auth_cookie(response, token)

    return {
        "message": "Login successful",
        "user": public_user(user),
    }


@auth_router.get("/me")
async def me(current_user=Depends(get_current_user)):
    return {"user": current_user}


@auth_router.post("/logout")
async def logout(response: Response):
    clear_auth_cookie(response)
    return {"message": "Logout successful"}