from typing import Optional
from pydantic import BaseModel
from datetime import datetime
from uuid import UUID
from enum import Enum
from .user import User

class TicketPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"

class TicketBase(BaseModel):
    title: str
    description: Optional[str] = None
    priority: TicketPriority = TicketPriority.MEDIUM

class TicketCreate(TicketBase):
    board_id: UUID
    status_column_id: UUID
    assignee_id: Optional[UUID] = None

class TicketUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[TicketPriority] = None
    status_column_id: Optional[UUID] = None
    assignee_id: Optional[UUID] = None
    created_by_id: Optional[UUID] = None

class Ticket(TicketBase):
    id: UUID
    board_id: UUID
    column_id: UUID
    assignee_id: Optional[UUID] = None
    assignee: Optional[User] = None
    created_by_id: Optional[UUID] = None
    reporter: Optional[User] = None
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True,
        "json_encoders": {
            datetime: lambda v: v.isoformat() if v else None
        }
    }
