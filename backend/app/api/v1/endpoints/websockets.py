from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, Depends
from app.websockets import manager
from app.api import deps
from jose import jwt, JWTError
from app.core.config import settings
from app import schemas, models
from sqlalchemy.orm import Session

router = APIRouter()

@router.websocket("/{board_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    board_id: str,
    token: str = Query(...),
    db: Session = Depends(deps.get_db)
):
    # Manual token validation for WebSocket (since Depends(deps.get_current_user) doesn't work easily with WS)
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        token_data = schemas.user.TokenPayload(**payload)
        user = db.query(models.User).filter(models.User.id == token_data.sub).first()
        if not user or not user.is_active:
            await websocket.close(code=1008)  # Policy Violation
            return
    except (JWTError, Exception):
        await websocket.close(code=1008)
        return

    # Check if user has access to this board
    # (Optional: for simplicity in this MVP, we mostly check if board exists)
    # But better to check membership
    is_member = db.query(models.BoardUser).filter(
        models.BoardUser.board_id == board_id,
        models.BoardUser.user_id == user.id
    ).first() is not None
    
    # Also check if user is owner
    board = db.query(models.Board).filter(models.Board.id == board_id).first()
    if not board:
        await websocket.close(code=1007) # Invalid payload data (board not found)
        return
        
    is_owner = str(board.owner_id) == str(user.id)
    
    if not (is_owner or is_member):
        await websocket.close(code=1008)
        return

    await manager.connect(websocket, board_id)
    try:
        while True:
            # We mostly use WS for server -> client updates, 
            # but we keep the connection alive
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, board_id)
