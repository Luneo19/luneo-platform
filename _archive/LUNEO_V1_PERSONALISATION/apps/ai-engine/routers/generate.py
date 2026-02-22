"""
★ ROUTER - GENERATION TEXTURE/GRAVURE ★
API FastAPI qui reçoit le prompt et génère le rendu 3D
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Literal
import uuid
import logging

from services.texture_generator import TextureGenerator
from services.text_renderer import TextRenderer
from services.prompt_parser import PromptParser
from services.model_processor import ModelProcessor
from utils.s3 import upload_to_s3
from utils.cache import cache_get, cache_set

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/generate", tags=["generation"])


class GenerateTextureRequest(BaseModel):
    text: str
    font: str = "Arial"
    color: str = "#000000"
    size: int = 24
    effect: Literal["normal", "embossed", "engraved", "3d"] = "engraved"
    zoneUV: dict  # {"u": [0.2, 0.8], "v": [0.3, 0.7]}
    modelUrl: str
    productId: Optional[str] = None
    zoneId: Optional[str] = None


class GenerateTextureResponse(BaseModel):
    textureUrl: str
    modelUrl: str
    previewUrl: str
    cacheKey: str
    jobId: str


@router.post("/texture", response_model=GenerateTextureResponse)
async def generate_texture(request: GenerateTextureRequest):
    """
    ★ ENDPOINT PRINCIPAL DE GENERATION
    
    Process:
    1. Télécharge modèle 3D depuis URL
    2. Génère texture avec texte gravé
    3. Apply texture sur zone UV spécifiée
    4. Rend preview photoréaliste
    5. Upload assets sur S3
    6. Retourne URLs
    
    Temps moyen: 2-3 secondes
    """
    
    try:
        # Cache check
        cache_key = f"texture:{hash(str(request.dict()))}"
        cached = await cache_get(cache_key)
        if cached:
            logger.info(f"Cache hit for {cache_key}")
            return GenerateTextureResponse(**cached)
        
        job_id = str(uuid.uuid4())
        logger.info(f"[IA] Starting generation job {job_id} for text: '{request.text[:50]}...'")
        
        # 0. Parse et valide le prompt
        parser = PromptParser(max_length=500, min_length=1)
        parsed = await parser.parse(request.text)
        
        if not parsed.is_valid:
            raise HTTPException(
                status_code=400,
                detail=f"Prompt invalide: {', '.join(parsed.validation_errors)}"
            )
        
        # 1. Download modèle 3D
        logger.info(f"[IA] Downloading model: {request.modelUrl}")
        mesh = await ModelProcessor.download_model(request.modelUrl)
        
        # 2. Génère texture avec texte (utilise TextRenderer pour meilleure qualité)
        logger.info(f"[IA] Generating texture with: '{parsed.cleaned_text}'")
        text_renderer = TextRenderer(
            text=parsed.cleaned_text,
            font_name=request.font,
            color=request.color,
            size=request.size,
            effect=request.effect,
            antialiasing=True
        )
        
        texture_image = await text_renderer.render(width=2048, height=2048)
        
        # 3. Apply sur zone UV
        logger.info(f"[IA] Applying to UV zone: {request.zoneUV}")
        modified_mesh = await ModelProcessor.apply_texture_to_zone(
            mesh=mesh,
            texture=texture_image,
            uv_zone=request.zoneUV,
            blend_mode="overlay"
        )
        
        # 4. Génère preview photoréaliste
        logger.info("[IA] Rendering photorealistic preview...")
        preview_image = await ModelProcessor.render_preview(
            mesh=modified_mesh,
            camera_angle="front",
            lighting="studio",
            resolution=(1920, 1080)
        )
        
        # 5. Upload S3
        # Upload modèle .glb
        model_bytes = modified_mesh.export(file_type="glb")
        model_url = await upload_to_s3(
            data=model_bytes,
            key=f"models/{job_id}.glb",
            content_type="model/gltf-binary"
        )
        
        # Upload texture
        from io import BytesIO
        texture_bytes = BytesIO()
        texture_image.save(texture_bytes, format="PNG")
        texture_bytes.seek(0)
        texture_url = await upload_to_s3(
            data=texture_bytes.read(),
            key=f"textures/{job_id}.png",
            content_type="image/png"
        )
        
        # Upload preview
        preview_bytes = BytesIO()
        preview_image.save(preview_bytes, format="PNG")
        preview_bytes.seek(0)
        preview_url = await upload_to_s3(
            data=preview_bytes.read(),
            key=f"previews/{job_id}.png",
            content_type="image/png"
        )
        
        response = {
            "textureUrl": texture_url,
            "modelUrl": model_url,
            "previewUrl": preview_url,
            "cacheKey": cache_key,
            "jobId": job_id
        }
        
        # Cache result
        await cache_set(cache_key, response, ttl=3600)
        
        logger.info(f"[IA] ✅ Generation completed: {job_id}")
        return GenerateTextureResponse(**response)
        
    except Exception as e:
        logger.error(f"[IA] ❌ Error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

