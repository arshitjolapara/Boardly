from typing import Any, List
from fastapi import APIRouter, Body, Depends, HTTPException
from sqlalchemy.orm import Session
from app import crud, models, schemas
from app.api import deps

router = APIRouter()

@router.post("/", response_model=schemas.user.User)
def create_user(
    *,
    db: Session = Depends(deps.get_db),
    user_in: schemas.user.UserCreate,
) -> Any:
    """
    Create new user.
    """
    user = crud.user.get_by_email(db, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this username already exists in the system.",
        )
    user = crud.user.create(db, obj_in=user_in)
    return user

@router.get("/me", response_model=schemas.user.User)
def read_user_me(
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get current user.
    """
    # Ensure preferences exist
    if not current_user.preferences:
        crud.preferences.create(
            db, 
            obj_in=schemas.user.UserPreferencesCreate(), 
            user_id=current_user.id
        )
        db.refresh(current_user)
    return current_user

@router.put("/me", response_model=schemas.user.User)
def update_user_me(
    *,
    db: Session = Depends(deps.get_db),
    user_in: schemas.user.UserUpdate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Update own profile.
    """
    user = crud.user.update(db, db_obj=current_user, obj_in=user_in)
    return user

@router.get("/me/preferences", response_model=schemas.user.UserPreferences)
def read_user_preferences_me(
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get current user's preferences.
    """
    prefs = crud.preferences.get_by_user_id(db, user_id=current_user.id)
    if not prefs:
        prefs = crud.preferences.create(
            db, 
            obj_in=schemas.user.UserPreferencesCreate(), 
            user_id=current_user.id
        )
    return prefs

@router.put("/me/preferences", response_model=schemas.user.UserPreferences)
def update_user_preferences_me(
    *,
    db: Session = Depends(deps.get_db),
    prefs_in: schemas.user.UserPreferencesUpdate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Update own preferences.
    """
    prefs = crud.preferences.get_by_user_id(db, user_id=current_user.id)
    if not prefs:
        prefs = crud.preferences.create(
            db, 
            obj_in=schemas.user.UserPreferencesCreate(), 
            user_id=current_user.id
        )
    prefs = crud.preferences.update(db, db_obj=prefs, obj_in=prefs_in)
    return prefs
