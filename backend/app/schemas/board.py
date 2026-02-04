from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime
from uuid import UUID

# Column Schemas
class ColumnBase(BaseModel):
    name: str
    order: int

class ColumnCreate(ColumnBase):
    pass

class ColumnUpdate(ColumnBase):
    pass

from .ticket import Ticket

class Column(ColumnBase):
    id: UUID
    board_id: UUID
    tickets: List[Ticket] = []

    class Config:
        from_attributes = True

# Board Schemas
class BoardBase(BaseModel):
    name: str
    description: Optional[str] = None

class BoardCreate(BoardBase):
    pass

class BoardUpdate(BoardBase):
    pass

class Board(BoardBase):
    id: UUID
    owner_id: UUID
    created_at: datetime
    updated_at: datetime
    columns: List[Column] = []

    class Config:
        from_attributes = True
