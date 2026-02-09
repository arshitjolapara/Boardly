from typing import Optional
from pydantic import BaseModel
from datetime import datetime
from uuid import UUID
from .user import User

class WatcherBase(BaseModel):
    pass

class WatcherCreate(WatcherBase):
    user_id: UUID

class WatcherResponse(WatcherBase):
    id: UUID
    ticket_id: UUID
    user_id: UUID
    added_by: UUID
    created_at: datetime
    user: User

    model_config = {
        "from_attributes": True,
        "json_encoders": {
            datetime: lambda v: v.isoformat() if v else None
        }
    }
