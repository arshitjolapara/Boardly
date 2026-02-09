import enum
import uuid
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.utils import utcnow
from app.db.base import Base

class ThemePreference(str, enum.Enum):
    LIGHT = "light"
    DARK = "dark"
    SYSTEM = "system"

class UserPreferences(Base):
    __tablename__ = "user_preferences"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    
    theme_preference = Column(Enum(ThemePreference), default=ThemePreference.SYSTEM, nullable=False)
    email_notifications_enabled = Column(Boolean, default=False, nullable=False)
    in_app_notifications_enabled = Column(Boolean, default=True, nullable=False)
    
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

    # Relationship
    user = relationship("User", back_populates="preferences")
