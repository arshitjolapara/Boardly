import enum
import uuid
from datetime import datetime
from app.core.utils import utcnow
from sqlalchemy import Column, String, ForeignKey, Enum, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base import Base

class TicketActionType(str, enum.Enum):
    TICKET_CREATED = "TICKET_CREATED"
    TICKET_UPDATED = "TICKET_UPDATED"
    STATUS_CHANGED = "STATUS_CHANGED"
    ASSIGNEE_CHANGED = "ASSIGNEE_CHANGED"
    PRIORITY_CHANGED = "PRIORITY_CHANGED"
    TICKET_DELETED = "TICKET_DELETED"
    COMMENT_ADDED = "COMMENT_ADDED"
    COMMENT_EDITED = "COMMENT_EDITED"
    COMMENT_DELETED = "COMMENT_DELETED"
    WATCHER_ADDED = "WATCHER_ADDED"
    WATCHER_REMOVED = "WATCHER_REMOVED"

class TicketHistory(Base):
    __tablename__ = "ticket_history"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ticket_id = Column(UUID(as_uuid=True), ForeignKey("tickets.id", ondelete="CASCADE"), nullable=False, index=True)
    actor_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    action_type = Column(Enum(TicketActionType), nullable=False)
    field_name = Column(String, nullable=True)
    old_value = Column(Text, nullable=True)
    new_value = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    # Relationships
    ticket = relationship("Ticket", backref="history_logs")
    actor = relationship("User")
