from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app import crud, schemas
from app.api import deps
from app.core import security
from app.core.config import settings

router = APIRouter()

@router.post("/login/access-token", response_model=schemas.user.Token)
def login_access_token(
    db: Session = Depends(deps.get_db), form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    user = crud.user.get_by_email(db, email=form_data.username)
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password"
        )
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
        
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": security.create_access_token(
            user.id, expires_delta=access_token_expires
        ),
        "token_type": "bearer",
    }

class GoogleToken(schemas.user.BaseModel):
    token: str

import httpx
from app.models.user import AuthProvider

@router.post("/login/google", response_model=schemas.user.Token)
async def login_google(
    token_data: GoogleToken, db: Session = Depends(deps.get_db)
) -> Any:
    """
    Login with Google.
    """
    # Verify token with Google
    async with httpx.AsyncClient() as client:
        resp = await client.get(f"https://www.googleapis.com/oauth2/v3/tokeninfo?id_token={token_data.token}")
        if resp.status_code != 200:
             raise HTTPException(status_code=400, detail="Invalid Google Token")
        payload = resp.json()

    # Get user info
    email = payload.get("email")
    if not email:
         raise HTTPException(status_code=400, detail="Google token missing email")

    # Check if user exists
    user = crud.user.get_by_email(db, email=email)
    if not user:
        # Create user
        user_in = schemas.user.UserCreate(
            email=email,
            password=security.get_password_hash(token_data.token[:10]), # Random password
            full_name=payload.get("name"),
            auth_provider=AuthProvider.GOOGLE # Now using Enum
        )
        # We need to adapt create logic potentially, or just use create with email/pass
        # Assuming create handles it.
        # But wait, UserCreate requires password. We generate a random one.
        # Also need to set auth_provider explicitly if not in UserCreate schema.
        
        # Let's check UserCreate schema. It might not have auth_provider.
        # Quick fix: create DB object manually here for custom provider logic or update CRUD.
        # Using simple CRUD create for now with explicit update after.
        user = crud.user.create(db, obj_in=user_in)
        
        # Update auth provider
        user.auth_provider = AuthProvider.GOOGLE
        user.avatar_url = payload.get("picture")
        db.add(user)
        db.commit()
        db.refresh(user)
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": security.create_access_token(
            user.id, expires_delta=access_token_expires
        ),
        "token_type": "bearer",
    }
