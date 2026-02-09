from typing import Optional
from pydantic import BaseModel, EmailStr
from datetime import datetime
from uuid import UUID

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenPayload(BaseModel):
    sub: Optional[str] = None

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    display_name: Optional[str] = None
    timezone: Optional[str] = None
    is_active: Optional[bool] = True
    avatar_url: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    display_name: Optional[str] = None
    timezone: Optional[str] = None
    password: Optional[str] = None
    avatar_url: Optional[str] = None

# Preferences Schemas
from app.models.user_preferences import ThemePreference

class UserPreferencesBase(BaseModel):
    theme_preference: Optional[ThemePreference] = ThemePreference.SYSTEM
    email_notifications_enabled: Optional[bool] = False
    in_app_notifications_enabled: Optional[bool] = True

class UserPreferencesCreate(UserPreferencesBase):
    pass

class UserPreferencesUpdate(UserPreferencesBase):
    pass

class UserPreferences(UserPreferencesBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True
    }

class UserInDBBase(UserBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True,
        "json_encoders": {
            datetime: lambda v: v.isoformat() if v else None
        }
    }

class User(UserInDBBase):
    preferences: Optional[UserPreferences] = None

class UserInDB(UserInDBBase):
    hashed_password: str
