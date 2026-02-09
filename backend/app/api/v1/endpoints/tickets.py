from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import crud, models, schemas
from app.api import deps
from app.models import TicketHistory
from app.schemas.history import TicketHistory as TicketHistorySchema

router = APIRouter()

@router.post("/", response_model=schemas.Ticket)
def create_ticket(
    *,
    db: Session = Depends(deps.get_db),
    ticket_in: schemas.TicketCreate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Create new ticket. Owner or members can create tickets.
    """
    # Check if user is owner or member of board
    board = crud.board.get(db=db, id=ticket_in.board_id)
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    
    # Check if user is owner or member
    is_owner = board.owner_id == current_user.id
    is_member = db.query(models.BoardUser).filter(
        models.BoardUser.board_id == ticket_in.board_id,
        models.BoardUser.user_id == current_user.id
    ).first() is not None
    
    if not (is_owner or is_member):
        raise HTTPException(status_code=403, detail="Not enough permissions")

    ticket = crud.ticket.create_with_board(
        db=db, 
        obj_in=ticket_in, 
        board_id=ticket_in.board_id,
        creator_id=str(current_user.id)
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    return ticket

@router.put("/{id}", response_model=schemas.Ticket)
def update_ticket(
    *,
    db: Session = Depends(deps.get_db),
    id: str,
    ticket_in: schemas.TicketUpdate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Update a ticket (move column, change status details etc). Owner or members can update.
    """
    ticket = crud.ticket.get(db=db, id=id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    # Check permission - owner or member can edit tickets
    board = crud.board.get(db=db, id=str(ticket.board_id))
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    
    # Check if user is owner or member
    is_owner = board.owner_id == current_user.id
    is_member = db.query(models.BoardUser).filter(
        models.BoardUser.board_id == str(ticket.board_id),
        models.BoardUser.user_id == current_user.id
    ).first() is not None
    
    if not (is_owner or is_member):
        raise HTTPException(status_code=403, detail="Not enough permissions")

    ticket = crud.ticket.update(db=db, db_obj=ticket, obj_in=ticket_in, actor_id=str(current_user.id))
    return ticket

@router.delete("/{id}", response_model=schemas.Ticket)
def delete_ticket(
    *,
    db: Session = Depends(deps.get_db),
    id: str,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Delete a ticket. Owner or members can delete.
    """
    ticket = crud.ticket.get(db=db, id=id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    # Check permission - owner or member can delete tickets
    board = crud.board.get(db=db, id=str(ticket.board_id))
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    
    # Check if user is owner or member
    is_owner = board.owner_id == current_user.id
    is_member = db.query(models.BoardUser).filter(
        models.BoardUser.board_id == str(ticket.board_id),
        models.BoardUser.user_id == current_user.id
    ).first() is not None
    
    if not (is_owner or is_member):
        raise HTTPException(status_code=403, detail="Not enough permissions")

    # Eagerly load assignee relationship before deletion to avoid DetachedInstanceError
    _ = ticket.assignee  # This triggers the lazy load while still in session
    
    ticket = crud.ticket.remove(db=db, id=id, actor_id=str(current_user.id))
    return ticket

@router.get("/{ticket_id}/history", response_model=List[TicketHistorySchema])
def read_ticket_history(
    ticket_id: str,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get ticket history.
    """
    ticket = crud.ticket.get(db=db, id=ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
        
    # Check permission
    board = crud.board.get(db=db, id=str(ticket.board_id))
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
        
    is_owner = board.owner_id == current_user.id
    is_member = db.query(models.BoardUser).filter(
        models.BoardUser.board_id == str(ticket.board_id),
        models.BoardUser.user_id == current_user.id
    ).first() is not None
    
    if not (is_owner or is_member):
        raise HTTPException(status_code=403, detail="Not enough permissions")

    history = db.query(TicketHistory).filter(
        TicketHistory.ticket_id == ticket_id
    ).order_by(TicketHistory.created_at.asc()).all()
    
    return history
