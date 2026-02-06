from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.ticket import Ticket
from app.schemas.ticket import TicketCreate, TicketUpdate

class CRUDTicket:
    def get(self, db: Session, id: str) -> Optional[Ticket]:
        return db.query(Ticket).filter(Ticket.id == id).first()

    def get_multi_by_board(self, db: Session, board_id: str, skip: int = 0, limit: int = 100) -> List[Ticket]:
        return db.query(Ticket).filter(Ticket.board_id == board_id).offset(skip).limit(limit).all()

    def create_with_board(self, db: Session, *, obj_in: TicketCreate, board_id: str) -> Ticket:
        db_obj = Ticket(
            title=obj_in.title,
            description=obj_in.description,
            priority=obj_in.priority,
            board_id=board_id,
            column_id=obj_in.status_column_id,
            assignee_id=obj_in.assignee_id
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
        
    def update(self, db: Session, *, db_obj: Ticket, obj_in: TicketUpdate) -> Ticket:
        print(f"DEBUG: update called for ticket {db_obj.id}")
        print(f"DEBUG: obj_in: {obj_in}")
        update_data = obj_in.model_dump(exclude_unset=True)
        print(f"DEBUG: update_data before map: {update_data}")
        
        # Map schema fields to model fields
        if "status_column_id" in update_data:
            update_data["column_id"] = update_data.pop("status_column_id")

        print(f"DEBUG: update_data after map: {update_data}")

        for field in update_data:
            setattr(db_obj, field, update_data[field])
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def remove(self, db: Session, *, id: str) -> Ticket:
        obj = db.query(Ticket).get(id)
        db.delete(obj)
        db.commit()
        return obj

ticket = CRUDTicket()
