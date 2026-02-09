from sqlalchemy import Column, ForeignKey, Enum, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import enum
from datetime import datetime
from app.core.utils import utcnow
from app.db.base import Base

class BoardRole(str, enum.Enum):
    ADMIN = "admin"
    MEMBER = "member"

class BoardUser(Base):
    __tablename__ = "board_users"

    board_id = Column(UUID(as_uuid=True), ForeignKey("boards.id"), primary_key=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), primary_key=True)
    role = Column(Enum(BoardRole), default=BoardRole.MEMBER, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    board = relationship("Board", back_populates="members")
    user = relationship("User", back_populates="board_memberships")
