from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Any
from uuid import UUID
from datetime import datetime
from app.core.utils import utcnow
from app.crud.crud_watcher import crud_watcher

from app.db.base import get_db
from app.models import Comment, Ticket, User, TicketPriority
from app.api.deps import get_current_user
from app.schemas.comment import CommentCreate, CommentUpdate, CommentResponse
from app.models.history import TicketActionType
from app.crud.history_log import log_ticket_history

router = APIRouter()

@router.get("/tickets/{ticket_id}/comments", response_model=List[CommentResponse])
def read_comments(
    ticket_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Retrieve comments for a specific ticket.
    Enforces board access.
    """
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found"
        )
    
    # Check if user is a member of the board
    # We can check via ticket.board.members if lazy loading is not an issue
    # Or query BoardUser directly. For now, let's assume get_current_user handles general auth
    # But we need strict board access.
    
    # Check generic board access
    # Assuming board membership is checked via relationship user.board_memberships
    has_access = any(m.board_id == ticket.board_id for m in current_user.board_memberships)
    if not has_access and not current_user.is_superuser:
         raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to view comments on this board"
        )

    comments = db.query(Comment).filter(Comment.ticket_id == ticket_id).order_by(Comment.created_at.asc()).all()
    return comments

@router.post("/tickets/{ticket_id}/comments", response_model=CommentResponse)
def create_comment(
    ticket_id: UUID,
    comment_in: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Create a new comment.
    """
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found"
        )
        
    has_access = any(m.board_id == ticket.board_id for m in current_user.board_memberships)
    if not has_access and not current_user.is_superuser:
         raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to add comments to this board"
        )
    
    comment = Comment(
        content=comment_in.content,
        ticket_id=ticket_id,
        author_id=current_user.id
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)

    # Log history
    log_ticket_history(
        db=db,
        ticket_id=ticket_id,
        actor_id=current_user.id,
        action_type=TicketActionType.COMMENT_ADDED,
        new_value=comment.content
    )
    
    # Auto-watch: commenter becomes a watcher
    new_watcher = crud_watcher.auto_watch(db, ticket_id=ticket_id, user_id=current_user.id, added_by=current_user.id)
    if new_watcher:
        log_ticket_history(
            db=db,
            ticket_id=ticket_id,
            actor_id=current_user.id,
            action_type=TicketActionType.WATCHER_ADDED,
            new_value=str(current_user.id)
        )
    
    db.commit()

    return comment

@router.put("/comments/{comment_id}", response_model=CommentResponse)
def update_comment(
    comment_id: UUID,
    comment_in: CommentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Update a comment. Only the author can update their comment.
    """
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found"
        )
    
    if comment.author_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to edit this comment"
        )
        
    old_content = comment.content
    comment.content = comment_in.content
    comment.is_edited = True
    comment.updated_at = utcnow()
    
    db.add(comment)
    
    # Log history
    log_ticket_history(
        db=db,
        ticket_id=comment.ticket_id,
        actor_id=current_user.id,
        action_type=TicketActionType.COMMENT_EDITED,
        old_value=old_content,
        new_value=comment_in.content
    )
    
    db.commit()
    db.refresh(comment)
    return comment

@router.delete("/comments/{comment_id}")
def delete_comment(
    comment_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Delete a comment. Only the author can delete their comment.
    """
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found"
        )
    
    if comment.author_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to delete this comment"
        )
        
    # Log history before deletion
    log_ticket_history(
        db=db,
        ticket_id=comment.ticket_id,
        actor_id=current_user.id,
        action_type=TicketActionType.COMMENT_DELETED,
        old_value=comment.content
    )
    
    db.delete(comment)
    db.commit()
    return {"message": "Comment deleted successfully"}
