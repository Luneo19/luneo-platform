"""
Router pour rendu photoréaliste
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Literal
import uuid
import logging

from services.model_processor import ModelProcessor
from utils.s3 import upload_to_s3

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/render", tags=["render"])


class RenderPreviewRequest(BaseModel):
    modelUrl: str
    angle: Literal["front", "side", "top", "isometric"] = "front"
    lighting: Literal["studio", "outdoor", "dramatic"] = "studio"
    resolution: tuple = (1920, 1080)


@router.post("/preview")
async def render_preview(request: RenderPreviewRequest):
    """
    Génère un rendu photoréaliste d'un modèle 3D
    """
    try:
        mesh = await ModelProcessor.download_model(request.modelUrl)
        preview = await ModelProcessor.render_preview(
            mesh=mesh,
            camera_angle=request.angle,
            lighting=request.lighting,
            resolution=request.resolution
        )
        
        from io import BytesIO
        preview_bytes = BytesIO()
        preview.save(preview_bytes, format="PNG")
        preview_bytes.seek(0)
        
        preview_url = await upload_to_s3(
            data=preview_bytes.read(),
            key=f"renders/{uuid.uuid4()}.png",
            content_type="image/png"
        )
        
        return {"previewUrl": preview_url}
        
    except Exception as e:
        logger.error(f"Render error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

