from fastapi import Request, HTTPException, status, Depends

from src.services.auth_service import verify_access_token
from src.models.user_model import get_user_by_email


COOKIE_NAME = "talentflow_token"


async def get_current_user(request: Request):
    # print("ALL COOKIES:", request.cookies)

    token = request.cookies.get(COOKIE_NAME)
    # print("TOKEN FOUND:", token is not None)

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )

    payload = verify_access_token(token)
    # print("TOKEN PAYLOAD:", payload)

    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )

    user = await get_user_by_email(payload["email"])
    # print("USER FOUND:", user is not None)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )

    return {
        "name": user.get("name", ""),
        "email": user.get("email", ""),
        "role": user.get("role", ""),
        "companyName": user.get("companyName", ""),
    }


def require_roles(allowed_roles: list[str]):
    async def role_checker(current_user=Depends(get_current_user)):
        if current_user["role"] not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )

        return current_user

    return role_checker