from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import crud, models, schemas
from app.api import deps
from app.websockets import manager

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
    boards = crud.board.get_multi_for_user(db=db, user_id=str(current_user.id), skip=skip, limit=limit)
    return boards

@router.get("/{id}", response_model=schemas.Board)
def get_board_by_id(
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
    
    # Check if user is owner or member
    is_owner = board.owner_id == current_user.id
    is_member = db.query(models.BoardUser).filter(
        models.BoardUser.board_id == id,
        models.BoardUser.user_id == current_user.id
    ).first() is not None
    
    if not (is_owner or is_member):
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    return board

@router.post("/", response_model=schemas.Board)
def create_board(
    *,
    db: Session = Depends(deps.get_db),
    board_in: schemas.BoardCreate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Create new board with default columns.
    """
    board = crud.board.create_with_owner(db=db, obj_in=board_in, owner_id=current_user.id)
    
    # Create default columns
    default_columns = [
        {"name": "Backlog", "order": 0},
        {"name": "Ready for Dev", "order": 1},
        {"name": "In Development", "order": 2},
        {"name": "In QA", "order": 3},
        {"name": "Done", "order": 4}
    ]
    
    from app.models.board import Column
    for col_data in default_columns:
        column = Column(
            board_id=board.id,
            name=col_data["name"],
            order=col_data["order"]
        )
        db.add(column)
    
    db.commit()
    db.refresh(board)
    
    return board

@router.put("/{id}", response_model=schemas.Board)
async def update_board(
    *,
    db: Session = Depends(deps.get_db),
    id: str,
    board_in: schemas.BoardUpdate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Update a board.
    """
    board = crud.board.get(db=db, id=id)
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    if board.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    board = crud.board.update(db=db, db_obj=board, obj_in=board_in)
    # Broadcast to board
    await manager.broadcast_to_board(str(board.id), {"type": "BOARD_UPDATED"})
    return board

@router.delete("/{id}", response_model=schemas.Board)
async def delete_board(
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
        raise HTTPException(status_code=403, detail="Not enough permissions")
    board = crud.board.remove(db=db, id=id)
    # Broadcast to board before connection is lost
    await manager.broadcast_to_board(str(id), {"type": "BOARD_DELETED"})
    return board
