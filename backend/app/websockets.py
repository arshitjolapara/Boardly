from typing import Dict, List
from fastapi import WebSocket

class ConnectionManager:
    def __init__(self):
        # active_connections: {board_id: [WebSocket, ...]}
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, board_id: str):
        await websocket.accept()
        print(f"WebSocket connected to board: {board_id}")
        if board_id not in self.active_connections:
            self.active_connections[board_id] = []
        self.active_connections[board_id].append(websocket)

    def disconnect(self, websocket: WebSocket, board_id: str):
        print(f"WebSocket disconnected from board: {board_id}")
        if board_id in self.active_connections:
            if websocket in self.active_connections[board_id]:
                self.active_connections[board_id].remove(websocket)
            if not self.active_connections[board_id]:
                del self.active_connections[board_id]

    async def broadcast_to_board(self, board_id: str, message: dict):
        print(f"Broadcasting to board {board_id}: {message}")
        if board_id in self.active_connections:
            print(f"Found {len(self.active_connections[board_id])} active connections")
            for connection in self.active_connections[board_id]:
                try:
                    await connection.send_json(message)
                    print(f"Sent message to connection")
                except Exception as e:
                    print(f"Error sending message: {e}")
                    pass
        else:
            print(f"No active connections for board {board_id}")

manager = ConnectionManager()
