from sqlalchemy import Column, String, ForeignKey, Integer, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from app.db.base import Base

class Board(Base):
    __tablename__ = "boards"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    owner = relationship("User", backref="boards")
    columns = relationship("Column", back_populates="board", cascade="all, delete-orphan", order_by="Column.order")
    tickets = relationship("Ticket", back_populates="board", cascade="all, delete-orphan")
    members = relationship("BoardUser", back_populates="board", cascade="all, delete-orphan")

class Column(Base):
    __tablename__ = "columns"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    board_id = Column(UUID(as_uuid=True), ForeignKey("boards.id"), nullable=False)
    name = Column(String, nullable=False)
    order = Column(Integer, nullable=False, default=0)

    board = relationship("Board", back_populates="columns")
    tickets = relationship("Ticket", back_populates="column")
