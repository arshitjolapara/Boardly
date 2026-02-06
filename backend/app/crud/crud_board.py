from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.board import Board, Column
from app.schemas.board import BoardCreate, BoardUpdate

class CRUDBoard:
    def get(self, db: Session, id: str) -> Optional[Board]:
        return db.query(Board).filter(Board.id == id).first()

    def get_multi_by_owner(self, db: Session, owner_id: str, skip: int = 0, limit: int = 100) -> List[Board]:
        return db.query(Board).filter(Board.owner_id == owner_id).offset(skip).limit(limit).all()

    def get_multi_for_user(self, db: Session, user_id: str, skip: int = 0, limit: int = 100) -> List[Board]:
        from app.models.board_user import BoardUser
        from sqlalchemy import or_
        
        return db.query(Board).outerjoin(BoardUser).filter(
            or_(
                Board.owner_id == user_id,
                BoardUser.user_id == user_id
            )
        ).distinct().offset(skip).limit(limit).all()

    def create_with_owner(self, db: Session, *, obj_in: BoardCreate, owner_id: str) -> Board:
        db_obj = Board(
            name=obj_in.name,
            description=obj_in.description,
            owner_id=owner_id
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)

        # Note: Default columns are now created in the API endpoint
        
        # Add owner as Board Admin
        from app.models.board_user import BoardUser, BoardRole
        board_user = BoardUser(board_id=db_obj.id, user_id=owner_id, role=BoardRole.ADMIN)
        db.add(board_user)

        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(
        self,
        db: Session,
        *,
        db_obj: Board,
        obj_in: BoardUpdate
    ) -> Board:
        update_data = obj_in.model_dump(exclude_unset=True)
        for field in update_data:
            setattr(db_obj, field, update_data[field])
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def remove(self, db: Session, *, id: str) -> Board:
        obj = db.query(Board).get(id)
        db.delete(obj)
        db.commit()
        return obj

    def add_member(self, db: Session, *, board: Board, user_id: str) -> Board:
        from app.models.board_user import BoardUser, BoardRole
        
        # Check if already member
        existing = db.query(BoardUser).filter_by(board_id=board.id, user_id=user_id).first()
        if not existing:
            member = BoardUser(board_id=board.id, user_id=user_id, role=BoardRole.MEMBER)
            db.add(member)
            db.commit()
            db.refresh(board)
        return board

    def remove_member(self, db: Session, *, board: Board, user_id: str) -> Board:
        from app.models.board_user import BoardUser
        
        member = db.query(BoardUser).filter_by(board_id=board.id, user_id=user_id).first()
        if member:
            db.delete(member)
            db.commit()
            db.refresh(board)
        return board

board = CRUDBoard()
