from sqlalchemy import Column, String, ForeignKey, Enum, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
import enum
from datetime import datetime
from app.core.utils import utcnow
from app.db.base import Base

class TicketPriority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"

class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    priority = Column(Enum(TicketPriority), default=TicketPriority.MEDIUM, nullable=False)
    
    board_id = Column(UUID(as_uuid=True), ForeignKey("boards.id"), nullable=False)
    column_id = Column(UUID(as_uuid=True), ForeignKey("columns.id"), nullable=False)
    assignee_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    created_at = Column(DateTime(timezone=True), default=utcnow)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    board = relationship("Board", back_populates="tickets")
    column = relationship("Column", back_populates="tickets")
    assignee = relationship("User", foreign_keys=[assignee_id], backref="assigned_tickets")
    reporter = relationship("User", foreign_keys=[created_by_id], backref="reported_tickets")
    comments = relationship("Comment", back_populates="ticket", cascade="all, delete-orphan")
