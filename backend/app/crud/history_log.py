from sqlalchemy.orm import Session
from uuid import UUID
from typing import Optional, Any
from app.models import TicketHistory, TicketActionType

def log_ticket_history(
    db: Session,
    ticket_id: UUID,
    actor_id: UUID,
    action_type: TicketActionType,
    field_name: Optional[str] = None,
    old_value: Optional[Any] = None,
    new_value: Optional[Any] = None
) -> TicketHistory:
    """
    Log a ticket history event. 
    Does NOT commit the session to allow transaction bundling.
    Values are stringified.
    """
    
    # Handle converting values to string if they are not None
    old_val_str = str(old_value) if old_value is not None else None
    new_val_str = str(new_value) if new_value is not None else None
    
    history = TicketHistory(
        ticket_id=ticket_id,
        actor_id=actor_id,
        action_type=action_type,
        field_name=field_name,
        old_value=old_val_str,
        new_value=new_val_str
    )
    db.add(history)
    return history
