"""
GlucoTwin Authentication Router
Endpoints:
  POST /auth/register - Register a new healthcare provider / doctor
  POST /auth/login    - Authenticate and receive JWT (8-hour expiry)
  GET  /auth/me       - Retrieve current authenticated user profile
"""

from typing import Dict, Any, Union
from fastapi import APIRouter, HTTPException, status, Depends, Request
from fastapi.security import OAuth2PasswordRequestForm

from app.db import get_db
from app.auth import (
    verify_password,
    get_password_hash,
    create_access_token,
    get_current_user,
)
from app.models import UserRegister, UserLogin, UserResponse, TokenResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
def register(user_data: UserRegister):
    """
    Registers a new user (doctor/clinician).
    Validates email format, unique email constraint, and password security.
    """
    clean_email = user_data.email.strip().lower()
    clean_name = user_data.name.strip()

    if len(user_data.password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters long.",
        )

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM users WHERE email = ?", (clean_email,))
        if cursor.fetchone():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"An account with email '{clean_email}' already exists.",
            )

        hashed = get_password_hash(user_data.password)
        cursor.execute(
            """
            INSERT INTO users (name, email, password_hash, role)
            VALUES (?, ?, ?, ?)
            """,
            (clean_name, clean_email, hashed, user_data.role or "doctor"),
        )
        user_id = cursor.lastrowid

    # Create JWT token for immediate seamless login
    access_token = create_access_token(data={"sub": clean_email, "role": user_data.role or "doctor"})

    return {
        "message": "User registered successfully",
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in_hours": 8,
        "user": {
            "id": user_id,
            "name": clean_name,
            "email": clean_email,
            "role": user_data.role or "doctor",
        },
    }


@router.post("/login", response_model=TokenResponse)
async def login(request: Request):
    """
    Authenticates clinician credentials.
    Supports both JSON body {"email": "...", "password": "..."} and form data.
    Issues a secure JWT token with 8-hour expiry.
    """
    email: str = ""
    password: str = ""

    # Parse body depending on content-type
    content_type = request.headers.get("content-type", "")
    if "application/json" in content_type:
        try:
            body = await request.json()
            email = str(body.get("email", "")).strip().lower()
            password = str(body.get("password", ""))
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid JSON payload provided.",
            )
    else:
        form = await request.form()
        # Form may send username or email
        email = str(form.get("username", form.get("email", ""))).strip().lower()
        password = str(form.get("password", ""))

    if not email or not password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Both email and password are required.",
        )

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT id, name, email, password_hash, role, created_at FROM users WHERE email = ?",
            (email,),
        )
        user = cursor.fetchone()

    if not user or not verify_password(password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password. Please verify credentials.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Issue JWT token (8 hours expiry)
    access_token = create_access_token(data={"sub": user["email"], "role": user["role"]})

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in_hours=8,
        user=UserResponse(
            id=user["id"],
            name=user["name"],
            email=user["email"],
            role=user["role"],
            created_at=user["created_at"],
        ),
    )


@router.get("/me", response_model=UserResponse)
def get_me(current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Returns the currently authenticated doctor's profile.
    Requires Bearer JWT in Authorization header.
    """
    return UserResponse(
        id=current_user["id"],
        name=current_user["name"],
        email=current_user["email"],
        role=current_user["role"],
        created_at=current_user.get("created_at"),
    )
