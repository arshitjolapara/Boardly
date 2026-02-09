from typing import Optional, Any, Dict, Union
from sqlalchemy.orm import Session
from uuid import UUID
from app.models.user_preferences import UserPreferences
from app.schemas.user import UserPreferencesCreate, UserPreferencesUpdate

class CRUDPreferences:
    def get_by_user_id(self, db: Session, user_id: UUID) -> Optional[UserPreferences]:
        return db.query(UserPreferences).filter(UserPreferences.user_id == user_id).first()

    def create(self, db: Session, *, obj_in: UserPreferencesCreate, user_id: UUID) -> UserPreferences:
        db_obj = UserPreferences(
            user_id=user_id,
            **obj_in.model_dump()
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(
        self, db: Session, *, db_obj: UserPreferences, obj_in: Union[UserPreferencesUpdate, Dict[str, Any]]
    ) -> UserPreferences:
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.model_dump(exclude_unset=True)
            
        for field in update_data:
            if hasattr(db_obj, field):
                setattr(db_obj, field, update_data[field])
                
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

preferences = CRUDPreferences()
