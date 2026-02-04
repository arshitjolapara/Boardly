from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.board import Board, Column
from app.schemas.board import BoardCreate, BoardUpdate

class CRUDBoard:
    def get(self, db: Session, id: str) -> Optional[Board]:
        return db.query(Board).filter(Board.id == id).first()

    def get_multi_by_owner(self, db: Session, owner_id: str, skip: int = 0, limit: int = 100) -> List[Board]:
        return db.query(Board).filter(Board.owner_id == owner_id).offset(skip).limit(limit).all()

    def create_with_owner(self, db: Session, *, obj_in: BoardCreate, owner_id: str) -> Board:
        db_obj = Board(
            name=obj_in.name,
            description=obj_in.description,
            owner_id=owner_id
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)

        # Create default columns
        default_columns = ["Backlog", "Todo", "In Progress", "Done"]
        for index, col_name in enumerate(default_columns):
            column = Column(board_id=db_obj.id, name=col_name, order=index)
            db.add(column)
        
        # Add owner as Board Admin
        from app.models.board_user import BoardUser, BoardRole
        board_user = BoardUser(board_id=db_obj.id, user_id=owner_id, role=BoardRole.ADMIN)
        db.add(board_user)

        db.commit()
        db.refresh(db_obj)
        return db_obj

    def remove(self, db: Session, *, id: str) -> Board:
        obj = db.query(Board).get(id)
        db.delete(obj)
        db.commit()
        return obj

board = CRUDBoard()
