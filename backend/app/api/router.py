from fastapi import APIRouter

from app.api.auth import router as auth_router
from app.api.progress import router as progress_router
from app.api.swings import router as swings_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(swings_router)
api_router.include_router(progress_router)
