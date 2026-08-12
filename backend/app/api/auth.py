from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from jose import jwt
import bcrypt
import requests

from app.config import SECRET_KEY, ALGORITHM
from app.database import get_db
from app.models.user import User

router = APIRouter()

def hash_password(password: str) -> str:
    return bcrypt.hashpw(
        password.encode("utf-8"),
        bcrypt.gensalt()
    ).decode("utf-8")


def verify_password(
    plain_password: str,
    hashed_password: str
) -> bool:
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8")
        )
    except Exception:
        return False

# =========================
# Request Schemas
# =========================

class GoogleAuthRequest(BaseModel):
    access_token: str


class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


# =========================
# JWT Helper
# =========================

def create_token(user_id: int, email: str, name: str) -> str:
    payload = {
        "sub": str(user_id),
        "email": email,
        "name": name,
        "exp": datetime.utcnow() + timedelta(days=7)
    }

    return jwt.encode(
        payload,
        SECRET_KEY,
        algorithm=ALGORITHM
    )


# =========================
# Register
# =========================

@router.post("/register")
def register(
    request: RegisterRequest,
    response: Response,
    db: Session = Depends(get_db)
):
    existing_user = (
        db.query(User)
        .filter(User.email == request.email)
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    user = User(
        name=request.name,
        email=request.email,
        hashed_password=hash_password(
            request.password
        )
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_token(
        user.id,
        user.email,
        user.name
    )

    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        samesite="lax",
        secure=False,
        max_age=7 * 24 * 3600
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name
        }
    }


# =========================
# Login
# =========================

@router.post("/login")
def login(
    request: LoginRequest,
    response: Response,
    db: Session = Depends(get_db)
):
    user = (
        db.query(User)
        .filter(User.email == request.email)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    # Prevent password login for Google accounts
    if user.hashed_password == "GOOGLE_USER":
        raise HTTPException(
            status_code=400,
            detail="Please sign in with Google"
        )

    if not verify_password(
        request.password,
        user.hashed_password
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    token = create_token(
        user.id,
        user.email,
        user.name
    )

    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        samesite="lax",
        secure=False,
        max_age=7 * 24 * 3600
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name
        }
    }


# =========================
# Google Login
# =========================

@router.post("/google")
def google_auth(
    request: GoogleAuthRequest,
    res: Response,
    db: Session = Depends(get_db)
):
    google_res = requests.get(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        headers={
            "Authorization": f"Bearer {request.access_token}"
        }
    )

    if google_res.status_code != 200:
        raise HTTPException(
            status_code=401,
            detail="Invalid Google token"
        )

    google_user = google_res.json()

    email = google_user.get("email")
    name = google_user.get("name")

    if not email:
        raise HTTPException(
            status_code=400,
            detail="Could not get email from Google"
        )

    user = (
        db.query(User)
        .filter(User.email == email)
        .first()
    )

    if not user:
        user = User(
            email=email,
            name=name or email.split("@")[0],
            hashed_password="GOOGLE_USER"
        )

        db.add(user)
        db.commit()
        db.refresh(user)

    token = create_token(
        user.id,
        user.email,
        user.name
    )

    res.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        samesite="lax",
        secure=False,
        max_age=7 * 24 * 3600
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name
        }
    }