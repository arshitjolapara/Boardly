from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import crud, models, schemas
from app.api import deps

router = APIRouter()

@router.get("/{id}/members", response_model=List[schemas.User])
def read_members(
    *,
    db: Session = Depends(deps.get_db),
    id: str,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get all members of a board.
    """
    board = crud.board.get(db=db, id=id)
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    
    # Check if user has access to board
    # (Owner or member can see members)
    # Since we don't have a direct "is_member" check efficiently exposed yet, 
    # we can check if board is in user's visible boards or check relationship directly.
    # For now, simplest: check owner or existing membership manually
    
    has_access = False
    if board.owner_id == current_user.id:
        has_access = True
    else:
        # Check membership
        from app.models.board_user import BoardUser
        member = db.query(BoardUser).filter_by(board_id=board.id, user_id=current_user.id).first()
        if member:
            has_access = True
            
    if not has_access:
         raise HTTPException(status_code=400, detail="Not enough permissions")

    # Return list of Users.
    # Board.members is a list of BoardUser objects. We need to extract User objects.
    # Or we can query users directly joined.
    return [member.user for member in board.members]


@router.post("/{id}/members", response_model=schemas.Board)
def add_member(
    *,
    db: Session = Depends(deps.get_db),
    id: str,
    member_in: schemas.BoardMemberAdd,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Add a member to the board by email. Only owner can add members.
    """
    board = crud.board.get(db=db, id=id)
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    if board.owner_id != current_user.id:
        raise HTTPException(status_code=400, detail="Not enough permissions")

    # Find user by email
    user_to_add = crud.user.get_by_email(db=db, email=member_in.email)
    if not user_to_add:
        raise HTTPException(status_code=404, detail="User with this email not found")
    
    if user_to_add.id == board.owner_id:
        raise HTTPException(status_code=400, detail="Owner is already a member")

    board = crud.board.add_member(db=db, board=board, user_id=user_to_add.id)
    return board


@router.delete("/{id}/members/{user_id}", response_model=schemas.Board)
def remove_member(
    *,
    db: Session = Depends(deps.get_db),
    id: str,
    user_id: str,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Remove a member from the board. Only owner can remove members.
    Members can remove themselves (leave board) -> Todo logic? For now assume owner management.
    """
    board = crud.board.get(db=db, id=id)
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
            
    # Allow self-removal (leave board) or Owner removal
    is_owner = board.owner_id == current_user.id
    is_self = str(current_user.id) == user_id
    
    if not is_owner and not is_self:
         raise HTTPException(status_code=400, detail="Not enough permissions")
         
    if str(board.owner_id) == user_id:
        raise HTTPException(status_code=400, detail="Cannot remove owner")

    board = crud.board.remove_member(db=db, board=board, user_id=user_id)
    return board
