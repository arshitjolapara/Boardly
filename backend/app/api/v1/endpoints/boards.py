from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import crud, models, schemas
from app.api import deps

router = APIRouter()

@router.get("/", response_model=List[schemas.Board])
def read_boards(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Retrieve boards.
    """
    boards = crud.board.get_multi_by_owner(db=db, owner_id=current_user.id, skip=skip, limit=limit)
    return boards

@router.get("/{id}", response_model=schemas.Board)
def read_board(
    *,
    db: Session = Depends(deps.get_db),
    id: str,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get board by ID.
    """
    board = crud.board.get(db=db, id=id)
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    if board.owner_id != current_user.id:
        raise HTTPException(status_code=400, detail="Not enough permissions")
    return board

@router.post("/", response_model=schemas.Board)
def create_board(
    *,
    db: Session = Depends(deps.get_db),
    board_in: schemas.BoardCreate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Create new board.
    """
    board = crud.board.create_with_owner(db=db, obj_in=board_in, owner_id=current_user.id)
    return board

@router.delete("/{id}", response_model=schemas.Board)
def delete_board(
    *,
    db: Session = Depends(deps.get_db),
    id: str,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Delete a board.
    """
    board = crud.board.get(db=db, id=id)
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    if board.owner_id != current_user.id:
        raise HTTPException(status_code=400, detail="Not enough permissions")
    board = crud.board.remove(db=db, id=id)
    return board
