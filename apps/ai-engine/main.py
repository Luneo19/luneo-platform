"""
★ MOTEUR IA - APPLICATION FASTAPI PRINCIPALE ★
Génération de textures avec texte, rendu 3D photoréaliste
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import os
from dotenv import load_dotenv

from routers import generate, render, detect

# Load environment variables
load_dotenv()

# Create FastAPI app
app = FastAPI(
    title="Luneo AI Engine",
    description="Moteur IA pour génération de textures et rendus 3D",
    version="1.0.0",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("ALLOWED_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(generate.router, prefix="/api", tags=["generation"])
app.include_router(render.router, prefix="/api", tags=["render"])
app.include_router(detect.router, prefix="/api", tags=["detection"])


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "ok",
        "service": "Luneo AI Engine",
        "version": "1.0.0"
    }


@app.get("/health")
async def health():
    """Detailed health check"""
    return {
        "status": "healthy",
        "service": "Luneo AI Engine",
        "version": "1.0.0",
        "endpoints": {
            "generate": "/api/generate/texture",
            "render": "/api/render/preview",
            "detect": "/api/detect/face"
        }
    }


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler"""
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "detail": str(exc)
        }
    )


if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=os.getenv("ENV") == "development"
    )

