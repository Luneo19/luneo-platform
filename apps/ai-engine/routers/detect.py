"""
Router pour détection face/hand
"""

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/detect", tags=["detection"])


@router.post("/face")
async def detect_face():
    """Détection visage (à implémenter)"""
    return {"message": "Face detection endpoint - to be implemented"}


@router.post("/hand")
async def detect_hand():
    """Détection main (à implémenter)"""
    return {"message": "Hand detection endpoint - to be implemented"}

