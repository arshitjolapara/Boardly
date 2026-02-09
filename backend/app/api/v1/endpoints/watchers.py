from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.db.base import get_db
from app.models import Ticket, User, Board
from app.models.ticket_watcher import TicketWatcher
from app.api.deps import get_current_user
from app.schemas.watcher import WatcherCreate, WatcherResponse
from app.crud.crud_watcher import crud_watcher
from app.models.history import TicketActionType
from app.crud.history_log import log_ticket_history

router = APIRouter()

@router.get("/tickets/{ticket_id}/watchers", response_model=List[WatcherResponse])
def get_watchers(
    ticket_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all watchers for a ticket.
    Requires board membership.
    """
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found"
        )
    
    # Check board membership
    has_access = any(m.board_id == ticket.board_id for m in current_user.board_memberships)
    if not has_access and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to view watchers"
        )
    
    return crud_watcher.get_watchers(db, ticket_id)

@router.post("/tickets/{ticket_id}/watchers", response_model=WatcherResponse)
def add_watcher(
    ticket_id: UUID,
    watcher_in: WatcherCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Add a watcher to a ticket.
    Anyone can add themselves or another board member.
    """
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found"
        )
    
    # Check current user has board access
    has_access = any(m.board_id == ticket.board_id for m in current_user.board_memberships)
    if not has_access and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to modify watchers"
        )
    
    # Check target user exists and has board access
    target_user = db.query(User).filter(User.id == watcher_in.user_id).first()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    target_has_access = any(m.board_id == ticket.board_id for m in target_user.board_memberships)
    if not target_has_access and not target_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot add non-board-member as watcher"
        )
    
    # Add watcher
    watcher = crud_watcher.add_watcher(
        db=db,
        ticket_id=ticket_id,
        user_id=watcher_in.user_id,
        added_by=current_user.id
    )
    
    if not watcher:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is already watching this ticket"
        )
    
    # Log history
    log_ticket_history(
        db=db,
        ticket_id=ticket_id,
        actor_id=current_user.id,
        action_type=TicketActionType.WATCHER_ADDED,
        new_value=str(watcher_in.user_id)
    )
    db.commit()
    
    return watcher

@router.delete("/tickets/{ticket_id}/watchers/{user_id}")
def remove_watcher(
    ticket_id: UUID,
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Remove a watcher from a ticket.
    Users can remove themselves. Board owner can remove anyone.
    """
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found"
        )
    
    # Check board membership
    has_access = any(m.board_id == ticket.board_id for m in current_user.board_memberships)
    if not has_access and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to modify watchers"
        )
    
    # Permission check: self-removal or board owner
    board = db.query(Board).filter(Board.id == ticket.board_id).first()
    is_owner = board.owner_id == current_user.id
    is_self_removal = user_id == current_user.id
    
    if not is_self_removal and not is_owner and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only board owner can remove other watchers"
        )
    
    # Remove watcher
    removed = crud_watcher.remove_watcher(db=db, ticket_id=ticket_id, user_id=user_id)
    
    if not removed:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Watcher not found"
        )
    
    # Log history
    log_ticket_history(
        db=db,
        ticket_id=ticket_id,
        actor_id=current_user.id,
        action_type=TicketActionType.WATCHER_REMOVED,
        old_value=str(user_id)
    )
    db.commit()
    
    return {"message": "Watcher removed successfully"}
