from fastapi import APIRouter
from app.api.v1.endpoints import auth, users, boards, tickets

api_router = APIRouter()
api_router.include_router(auth.router, tags=["login"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(boards.router, prefix="/boards", tags=["boards"])
api_router.include_router(tickets.router, prefix="/tickets", tags=["tickets"])
