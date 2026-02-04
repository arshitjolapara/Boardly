from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import crud, models, schemas
from app.api import deps

router = APIRouter()

@router.post("/", response_model=schemas.Ticket)
def create_ticket(
    *,
    db: Session = Depends(deps.get_db),
    ticket_in: schemas.TicketCreate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Create new ticket.
    """
    # Verify board access
    board = crud.board.get(db=db, id=str(ticket_in.board_id)) # cast UUID to str for get
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    if board.owner_id != current_user.id:
         raise HTTPException(status_code=400, detail="Not enough permissions")

    ticket = crud.ticket.create_with_board(db=db, obj_in=ticket_in, board_id=ticket_in.board_id)
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
    Update a ticket (move column, change status details etc).
    """
    ticket = crud.ticket.get(db=db, id=id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    # Check permission (for mvp, owner of board can edit all tickets)
    board = crud.board.get(db=db, id=str(ticket.board_id))
    if not board or board.owner_id != current_user.id:
        raise HTTPException(status_code=400, detail="Not enough permissions")

    ticket = crud.ticket.update(db=db, db_obj=ticket, obj_in=ticket_in)
    return ticket
