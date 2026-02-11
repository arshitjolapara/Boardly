from sqlalchemy import Column, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from app.core.utils import utcnow
from app.db.base import Base

class TicketWatcher(Base):
    __tablename__ = "ticket_watchers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ticket_id = Column(UUID(as_uuid=True), ForeignKey("tickets.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    added_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    # Unique constraint: one user can watch a ticket only once
    __table_args__ = (
        UniqueConstraint('ticket_id', 'user_id', name='uq_ticket_user_watcher'),
    )

    # Relationships
    ticket = relationship("Ticket", back_populates="watchers")
    user = relationship("User", foreign_keys=[user_id])
    added_by_user = relationship("User", foreign_keys=[added_by])
