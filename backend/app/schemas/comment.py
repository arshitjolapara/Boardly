
from typing import Optional
from pydantic import BaseModel
from datetime import datetime
from uuid import UUID
from .user import User

class CommentBase(BaseModel):
    content: str

class CommentCreate(CommentBase):
    pass

class CommentUpdate(CommentBase):
    pass

class CommentResponse(CommentBase):
    id: UUID
    ticket_id: UUID
    author_id: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None
    is_edited: bool
    author: User

    model_config = {
        "from_attributes": True,
        "json_encoders": {
            datetime: lambda v: v.isoformat() if v else None
        }
    }

# Alias for consistent naming
class Comment(CommentResponse):
    pass
