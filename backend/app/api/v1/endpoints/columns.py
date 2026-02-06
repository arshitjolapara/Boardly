from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import crud, models, schemas
from app.api import deps
from uuid import UUID

router = APIRouter()

@router.post("/boards/{id}/columns", response_model=schemas.Board)
def create_column(
    *,
    db: Session = Depends(deps.get_db),
    id: str,
    column_in: schemas.ColumnCreate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Create a new column for a board.
    """
    board = crud.board.get(db=db, id=id)
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    
    if board.owner_id != current_user.id:
         raise HTTPException(status_code=400, detail="Not enough permissions")

    from app.models.board import Column
    
    # Check for duplicate column name in the same board
    existing_column = db.query(Column).filter(
        Column.board_id == board.id,
        Column.name == column_in.name
    ).first()
    
    if existing_column:
        raise HTTPException(status_code=400, detail="Column with this name already exists in this board")
    
    new_column = Column(
        board_id=board.id,
        name=column_in.name,
        order=column_in.order
    )
    db.add(new_column)
    db.commit()
    db.refresh(board)
    return board

@router.put("/columns/{column_id}", response_model=schemas.Column)
def update_column(
    *,
    db: Session = Depends(deps.get_db),
    column_id: str,
    column_in: schemas.ColumnUpdate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Update a column (Rename, Reorder).
    """
    from app.models.board import Column
    
    column = db.query(Column).filter(Column.id == column_id).first()
    if not column:
        raise HTTPException(status_code=404, detail="Column not found")
        
    # Check permissions
    board = crud.board.get(db=db, id=str(column.board_id))
    if not board or board.owner_id != current_user.id:
        raise HTTPException(status_code=400, detail="Not enough permissions")
    
    # Check for duplicate column name (excluding current column)
    existing_column = db.query(Column).filter(
        Column.board_id == column.board_id,
        Column.name == column_in.name,
        Column.id != column_id
    ).first()
    
    if existing_column:
        raise HTTPException(status_code=400, detail="Column with this name already exists in this board")
        
    column.name = column_in.name
    column.order = column_in.order
    db.add(column)
    db.commit()
    db.refresh(column)
    return column

@router.delete("/columns/{column_id}", response_model=schemas.Board)
def delete_column(
    *,
    db: Session = Depends(deps.get_db),
    column_id: str,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Delete a column.
    """
    from app.models.board import Column
    
    column = db.query(Column).filter(Column.id == column_id).first()
    if not column:
        raise HTTPException(status_code=404, detail="Column not found")

    board = crud.board.get(db=db, id=str(column.board_id))
    if not board or board.owner_id != current_user.id:
        raise HTTPException(status_code=400, detail="Not enough permissions")

    db.delete(column)
    db.commit()
    db.refresh(board)
    return board
