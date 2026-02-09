from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.ticket import Ticket
from app.schemas.ticket import TicketCreate, TicketUpdate
from app.models.history import TicketActionType
from app.crud.history_log import log_ticket_history
from app.crud.crud_watcher import crud_watcher

class CRUDTicket:
    def get(self, db: Session, id: str) -> Optional[Ticket]:
        return db.query(Ticket).filter(Ticket.id == id).first()

    def get_multi_by_board(self, db: Session, board_id: str, skip: int = 0, limit: int = 100) -> List[Ticket]:
        return db.query(Ticket).filter(Ticket.board_id == board_id).offset(skip).limit(limit).all()

    def create_with_board(self, db: Session, *, obj_in: TicketCreate, board_id: str, creator_id: str) -> Ticket:
        db_obj = Ticket(
            title=obj_in.title,
            description=obj_in.description,
            priority=obj_in.priority,
            board_id=board_id,
            column_id=obj_in.status_column_id,
            assignee_id=obj_in.assignee_id,
            created_by_id=creator_id
        )
        db.add(db_obj)
        db.flush() # Flush to get ID for history

        log_ticket_history(
            db=db,
            ticket_id=db_obj.id,
            actor_id=creator_id,
            action_type=TicketActionType.TICKET_CREATED
        )

        # Auto-watch: creator becomes a watcher
        new_watcher = crud_watcher.auto_watch(db, ticket_id=db_obj.id, user_id=creator_id, added_by=creator_id)
        if new_watcher:
            log_ticket_history(
                db=db,
                ticket_id=db_obj.id,
                actor_id=creator_id,
                action_type=TicketActionType.WATCHER_ADDED,
                new_value=str(creator_id)
            )

        db.commit()
        db.refresh(db_obj)
        return db_obj
        
    def update(self, db: Session, *, db_obj: Ticket, obj_in: TicketUpdate, actor_id: str) -> Ticket:
        # Calculate changes before applying
        update_data = obj_in.model_dump(exclude_unset=True)
        
        # Map schema fields to model fields
        if "status_column_id" in update_data:
            update_data["column_id"] = update_data.pop("status_column_id")

        # Track changes for history
        changes = []
        ignored_fields = {"updated_at", "created_at", "id", "board_id"}
        
        for field, new_value in update_data.items():
            if field in ignored_fields:
                continue
                
            if hasattr(db_obj, field):
                old_value = getattr(db_obj, field)
                # Convert enums/uuids to strings for comparison if needed, or simple equality check
                if old_value != new_value:
                    # Determine specific action type if applicable
                    action_type = TicketActionType.TICKET_UPDATED
                    if field == "priority":
                        action_type = TicketActionType.PRIORITY_CHANGED
                    elif field == "assignee_id":
                        action_type = TicketActionType.ASSIGNEE_CHANGED
                    elif field == "column_id": # Assuming column_id change means status change
                        action_type = TicketActionType.STATUS_CHANGED
                    
                    changes.append({
                        "action_type": action_type,
                        "field_name": field,
                        "old_value": old_value,
                        "new_value": new_value
                    })
                    
                    setattr(db_obj, field, new_value)

        db.add(db_obj)
        
        # Log gathered changes
        for change in changes:
            log_ticket_history(
                db=db,
                ticket_id=db_obj.id,
                actor_id=actor_id,
                action_type=change["action_type"],
                field_name=change["field_name"],
                old_value=change["old_value"],
                new_value=change["new_value"]
            )
            # Auto-watch: if assignee changed, add them as watcher
            if change["field_name"] == "assignee_id" and change["new_value"]:
                new_watcher = crud_watcher.auto_watch(db, ticket_id=db_obj.id, user_id=change["new_value"], added_by=actor_id)
                if new_watcher:
                    log_ticket_history(
                        db=db,
                        ticket_id=db_obj.id,
                        actor_id=actor_id,
                        action_type=TicketActionType.WATCHER_ADDED,
                        new_value=str(change["new_value"])
                    )

        db.commit()
        db.refresh(db_obj)
        return db_obj

    def remove(self, db: Session, *, id: str, actor_id: str) -> Ticket:
        obj = db.query(Ticket).get(id)
        
        # Log deletion before it happens (cascade will delete history too, but we log it anyway as per spec)
        log_ticket_history(
            db=db,
            ticket_id=obj.id,
            actor_id=actor_id,
            action_type=TicketActionType.TICKET_DELETED
        )
        
        db.delete(obj)
        db.commit()
        return obj

ticket = CRUDTicket()
