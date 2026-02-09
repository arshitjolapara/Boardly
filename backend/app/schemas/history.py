from typing import Optional, Any
from pydantic import BaseModel
from datetime import datetime
from uuid import UUID
from app.models.history import TicketActionType
from .user import User

class TicketHistoryBase(BaseModel):
    pass

class TicketHistoryCreate(TicketHistoryBase):
    ticket_id: UUID
    actor_id: UUID
    action_type: TicketActionType
    field_name: Optional[str] = None
    old_value: Optional[str] = None
    new_value: Optional[str] = None

class TicketHistory(TicketHistoryBase):
    id: UUID
    ticket_id: UUID
    actor_id: UUID
    action_type: TicketActionType
    field_name: Optional[str] = None
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    created_at: datetime
    actor: User

    model_config = {
        "from_attributes": True,
        "json_encoders": {
            datetime: lambda v: v.isoformat() if v else None
        }
    }
