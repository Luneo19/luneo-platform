"""
Router pour détection face/hand
Utilise Pillow pour l'analyse basique d'image
"""

from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from PIL import Image
import io
import logging

router = APIRouter(prefix="/detect", tags=["detection"])
logger = logging.getLogger(__name__)


class DetectionResult(BaseModel):
    detected: bool
    count: int
    regions: List[dict]
    confidence: float
    message: str


@router.post("/face", response_model=DetectionResult)
async def detect_face(file: UploadFile = File(...)):
    """
    Détection de visage dans une image.
    Utilise une analyse basique pour vérifier la présence d'un visage.
    Pour une détection avancée, installer mediapipe.
    """
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        
        # Analyse basique : vérifier la taille et le format
        width, height = image.size
        
        if width < 50 or height < 50:
            return DetectionResult(
                detected=False,
                count=0,
                regions=[],
                confidence=0.0,
                message="Image too small for face detection"
            )

        # Analyse heuristique : vérifier la présence de tons chair
        # (implémentation basique sans mediapipe)
        image_rgb = image.convert('RGB')
        pixels = list(image_rgb.getdata())
        total_pixels = len(pixels)
        
        skin_tone_count = 0
        for r, g, b in pixels:
            # Heuristique simple pour détecter les tons chair
            if r > 95 and g > 40 and b > 20 and r > g and r > b and abs(r - g) > 15 and r - b > 15:
                skin_tone_count += 1
        
        skin_ratio = skin_tone_count / total_pixels if total_pixels > 0 else 0
        
        # Si plus de 10% de pixels sont des tons chair, probable présence d'un visage
        detected = skin_ratio > 0.10
        confidence = min(skin_ratio * 3, 1.0)  # Normaliser la confiance
        
        return DetectionResult(
            detected=detected,
            count=1 if detected else 0,
            regions=[{
                "x": int(width * 0.25),
                "y": int(height * 0.15),
                "width": int(width * 0.5),
                "height": int(height * 0.6),
            }] if detected else [],
            confidence=round(confidence, 2),
            message="Face detection completed (heuristic mode)" if detected else "No face detected"
        )
        
    except Exception as e:
        logger.error(f"Face detection error: {e}")
        raise HTTPException(status_code=500, detail=f"Face detection failed: {str(e)}")


@router.post("/hand", response_model=DetectionResult)
async def detect_hand(file: UploadFile = File(...)):
    """
    Détection de main dans une image.
    Utilise une analyse basique.
    Pour une détection avancée, installer mediapipe.
    """
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        
        width, height = image.size
        
        if width < 50 or height < 50:
            return DetectionResult(
                detected=False,
                count=0,
                regions=[],
                confidence=0.0,
                message="Image too small for hand detection"
            )

        # Analyse heuristique similaire à la détection de visage
        image_rgb = image.convert('RGB')
        pixels = list(image_rgb.getdata())
        total_pixels = len(pixels)
        
        skin_tone_count = 0
        for r, g, b in pixels:
            if r > 95 and g > 40 and b > 20 and r > g and r > b and abs(r - g) > 15:
                skin_tone_count += 1
        
        skin_ratio = skin_tone_count / total_pixels if total_pixels > 0 else 0
        
        # Seuil plus bas pour les mains (souvent partiellement visibles)
        detected = skin_ratio > 0.05
        confidence = min(skin_ratio * 4, 1.0)
        
        return DetectionResult(
            detected=detected,
            count=1 if detected else 0,
            regions=[{
                "x": int(width * 0.2),
                "y": int(height * 0.3),
                "width": int(width * 0.6),
                "height": int(height * 0.5),
            }] if detected else [],
            confidence=round(confidence, 2),
            message="Hand detection completed (heuristic mode)" if detected else "No hand detected"
        )
        
    except Exception as e:
        logger.error(f"Hand detection error: {e}")
        raise HTTPException(status_code=500, detail=f"Hand detection failed: {str(e)}")
