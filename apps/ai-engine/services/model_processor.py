"""
★ SERVICE - MANIPULATION MODELES 3D COMPLET ★
Process complet pour modèles 3D :
- Download depuis URL
- Application de textures sur zones UV
- Rendu photoréaliste avec PyRender
- Export .glb / .usdz
- Optimisation et compression
"""

import trimesh
import numpy as np
from PIL import Image
import httpx
from io import BytesIO
import logging
import os
from typing import Dict, Tuple, Optional, Literal
import json

logger = logging.getLogger(__name__)

try:
    import pyrender
    PYRENDER_AVAILABLE = True
except ImportError:
    PYRENDER_AVAILABLE = False
    logger.warning("PyRender not available, rendering will be limited")


class ModelProcessor:
    """
    Process complet pour modèles 3D :
    - Download depuis URL
    - Application de textures sur zones UV
    - Rendu photoréaliste
    - Export .glb / .usdz
    """
    
    @staticmethod
    async def download_model(url: str) -> trimesh.Trimesh:
        """
        Télécharge et parse modèle 3D depuis URL
        
        Args:
            url: URL du modèle 3D (.glb, .gltf, .obj, etc.)
        
        Returns:
            Trimesh object
        
        Raises:
            ValueError: Si le modèle ne peut pas être chargé
            httpx.HTTPError: Si le téléchargement échoue
        """
        try:
            logger.info(f"[ModelProcessor] Downloading model from: {url}")
            
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.get(url)
                response.raise_for_status()
                
            # Determine file type from URL or content
            file_type = None
            if url.endswith('.glb'):
                file_type = 'glb'
            elif url.endswith('.gltf'):
                file_type = 'gltf'
            elif url.endswith('.obj'):
                file_type = 'obj'
            elif url.endswith('.fbx'):
                file_type = 'fbx'
            
            # Load mesh
            mesh = trimesh.load(
                BytesIO(response.content),
                file_type=file_type
            )
            
            # Handle scene (multiple meshes)
            if isinstance(mesh, trimesh.Scene):
                # Convert scene to single mesh (merge all geometries)
                mesh = mesh.dump(concatenate=True)
            
            if not isinstance(mesh, trimesh.Trimesh):
                raise ValueError(f"Unsupported mesh type: {type(mesh)}")
            
            logger.info(f"[ModelProcessor] Model loaded: {len(mesh.vertices)} vertices, {len(mesh.faces)} faces")
            
            return mesh
            
        except httpx.HTTPError as e:
            logger.error(f"[ModelProcessor] HTTP error downloading model: {e}")
            raise
        except Exception as e:
            logger.error(f"[ModelProcessor] Error loading model: {e}")
            raise ValueError(f"Failed to load model: {str(e)}")
    
    @staticmethod
    async def apply_texture_to_zone(
        mesh: trimesh.Trimesh,
        texture: Image.Image,
        uv_zone: Dict[str, Tuple[float, float]],
        blend_mode: str = "overlay"
    ) -> trimesh.Trimesh:
        """
        Apply texture sur zone UV spécifique avec blending intelligent
        
        Args:
            mesh: Modèle 3D Trimesh
            texture: Image PIL de texture à appliquer
            uv_zone: {"u": [0.2, 0.8], "v": [0.3, 0.7]}
            blend_mode: Mode de fusion ("overlay", "multiply", "screen", "normal")
        
        Returns:
            Mesh modifié avec texture appliquée
        """
        try:
            logger.info(f"[ModelProcessor] Applying texture to UV zone: {uv_zone}")
            
            # Vérifie que le mesh a des UVs
            if not hasattr(mesh.visual, 'uv') or mesh.visual.uv is None:
                # Crée des UVs si absents (planar mapping)
                logger.warning("[ModelProcessor] No UVs found, creating planar mapping")
                mesh = ModelProcessor._create_planar_uvs(mesh)
            
            uvs = mesh.visual.uv
            
            # Identifie vertices dans la zone UV
            u_min, u_max = uv_zone["u"]
            v_min, v_max = uv_zone["v"]
            
            # Trouve les faces qui intersectent la zone UV
            face_uvs = uvs[mesh.faces]  # UVs pour chaque face (3 vertices)
            
            # Vérifie si au moins un vertex de la face est dans la zone
            in_zone = (
                ((face_uvs[:, :, 0] >= u_min) & (face_uvs[:, :, 0] <= u_max)) &
                ((face_uvs[:, :, 1] >= v_min) & (face_uvs[:, :, 1] <= v_max))
            ).any(axis=1)
            
            faces_in_zone = np.where(in_zone)[0]
            
            if len(faces_in_zone) == 0:
                logger.warning("[ModelProcessor] No faces found in UV zone")
                return mesh
            
            logger.info(f"[ModelProcessor] Found {len(faces_in_zone)} faces in UV zone")
            
            # Récupère ou crée texture de base
            base_texture = ModelProcessor._get_or_create_base_texture(mesh, size=(2048, 2048))
            
            # Convertit zone UV en pixels
            texture_width, texture_height = base_texture.size
            x_offset = int(u_min * texture_width)
            y_offset = int(v_min * texture_height)
            paste_width = int((u_max - u_min) * texture_width)
            paste_height = int((v_max - v_min) * texture_height)
            
            # Resize texture générée pour correspondre à la zone
            texture_resized = texture.resize((paste_width, paste_height), Image.Resampling.LANCZOS)
            
            # Applique blending selon le mode
            if blend_mode == "overlay":
                # Overlay: combine texture avec base
                region = base_texture.crop((
                    x_offset, y_offset,
                    x_offset + paste_width, y_offset + paste_height
                ))
                blended = Image.blend(region, texture_resized, alpha=0.7)
                base_texture.paste(blended, (x_offset, y_offset))
            elif blend_mode == "multiply":
                # Multiply: assombrit
                region = base_texture.crop((
                    x_offset, y_offset,
                    x_offset + paste_width, y_offset + paste_height
                ))
                blended = Image.blend(region, texture_resized, alpha=0.5)
                base_texture.paste(blended, (x_offset, y_offset))
            else:
                # Normal: remplace directement
                base_texture.paste(texture_resized, (x_offset, y_offset), texture_resized if texture_resized.mode == 'RGBA' else None)
            
            # Crée nouveau material avec texture
            material = trimesh.visual.material.PBRMaterial(
                baseColorTexture=base_texture,
                metallicFactor=0.2,
                roughnessFactor=0.8,
                normalTexture=None,
                occlusionTexture=None
            )
            
            # Applique au mesh
            mesh.visual = trimesh.visual.TextureVisuals(
                uv=uvs,
                material=material
            )
            
            logger.info("[ModelProcessor] Texture applied successfully")
            return mesh
            
        except Exception as e:
            logger.error(f"[ModelProcessor] Error applying texture: {e}", exc_info=True)
            raise
    
    @staticmethod
    def _create_planar_uvs(mesh: trimesh.Trimesh) -> trimesh.Trimesh:
        """Crée des UVs planaires si absents"""
        # Projection simple sur plan XY
        vertices = mesh.vertices
        uvs = np.zeros((len(vertices), 2))
        
        # Normalise les coordonnées
        min_coords = vertices.min(axis=0)
        max_coords = vertices.max(axis=0)
        ranges = max_coords - min_coords
        
        # Évite division par zéro
        ranges[ranges == 0] = 1
        
        # Mappe X,Y -> U,V
        uvs[:, 0] = (vertices[:, 0] - min_coords[0]) / ranges[0]
        uvs[:, 1] = (vertices[:, 1] - min_coords[1]) / ranges[1]
        
        # Crée visual avec UVs
        mesh.visual = trimesh.visual.TextureVisuals(uv=uvs)
        
        return mesh
    
    @staticmethod
    def _get_or_create_base_texture(mesh: trimesh.Trimesh, size: Tuple[int, int] = (2048, 2048)) -> Image.Image:
        """Récupère texture existante ou crée une nouvelle"""
        if hasattr(mesh.visual, 'material') and mesh.visual.material is not None:
            if hasattr(mesh.visual.material, 'baseColorTexture'):
                base_texture = mesh.visual.material.baseColorTexture
                if base_texture is not None:
                    # Resize si nécessaire
                    if base_texture.size != size:
                        base_texture = base_texture.resize(size, Image.Resampling.LANCZOS)
                    return base_texture.copy()
        
        # Crée nouvelle texture blanche
        return Image.new("RGBA", size, (255, 255, 255, 255))
    
    @staticmethod
    async def render_preview(
        mesh: trimesh.Trimesh,
        camera_angle: Literal["front", "side", "top", "isometric"] = "front",
        lighting: Literal["studio", "outdoor", "dramatic"] = "studio",
        resolution: Tuple[int, int] = (1920, 1080),
        samples: int = 256
    ) -> Image.Image:
        """
        Génère rendu photoréaliste avec PyRender
        
        Args:
            mesh: Modèle 3D Trimesh
            camera_angle: Angle de caméra
            lighting: Type d'éclairage
            resolution: Résolution (width, height)
            samples: Nombre de samples pour raytracing (qualité)
        
        Returns:
            Image PIL du rendu
        """
        if not PYRENDER_AVAILABLE:
            logger.warning("[ModelProcessor] PyRender not available, returning placeholder")
            return Image.new("RGB", resolution, color=(200, 200, 200))
        
        try:
            logger.info(f"[ModelProcessor] Rendering preview: {camera_angle}, {lighting}, {resolution}")
            
            # Crée scène PyRender
            scene = pyrender.Scene(ambient_light=[0.3, 0.3, 0.3])
            
            # Convertit Trimesh en PyRender Mesh
            py_mesh = pyrender.Mesh.from_trimesh(mesh, smooth=True)
            scene.add(py_mesh)
            
            # Configure caméra
            camera = pyrender.PerspectiveCamera(yfov=np.pi / 3.0, aspectRatio=resolution[0] / resolution[1])
            
            # Position caméra selon angle
            cam_poses = {
                "front": np.array([
                    [1, 0, 0, 0],
                    [0, 1, 0, 0],
                    [0, 0, 1, 3],
                    [0, 0, 0, 1]
                ]),
                "side": np.array([
                    [0, 0, 1, 3],
                    [0, 1, 0, 0],
                    [-1, 0, 0, 0],
                    [0, 0, 0, 1]
                ]),
                "top": np.array([
                    [1, 0, 0, 0],
                    [0, 0, -1, 3],
                    [0, 1, 0, 0],
                    [0, 0, 0, 1]
                ]),
                "isometric": np.array([
                    [0.7, -0.4, 0.6, 3],
                    [0, 0.8, 0.6, 2],
                    [-0.7, -0.4, 0.6, 3],
                    [0, 0, 0, 1]
                ])
            }
            
            scene.add(camera, pose=cam_poses.get(camera_angle, cam_poses["front"]))
            
            # Lighting selon type
            if lighting == "studio":
                # Key light (principal)
                key_light = pyrender.SpotLight(
                    color=[1.0, 1.0, 1.0],
                    intensity=20.0,
                    innerConeAngle=0.5,
                    outerConeAngle=1.0
                )
                scene.add(key_light, pose=np.array([
                    [1, 0, 0, 2],
                    [0, 1, 0, 3],
                    [0, 0, 1, 2],
                    [0, 0, 0, 1]
                ]))
                
                # Fill light (complémentaire)
                fill_light = pyrender.DirectionalLight(color=[1.0, 1.0, 1.0], intensity=3.0)
                scene.add(fill_light, pose=np.array([
                    [1, 0, 0, -1],
                    [0, 1, 0, 1],
                    [0, 0, 1, 1],
                    [0, 0, 0, 1]
                ]))
                
                # Rim light (contour)
                rim_light = pyrender.DirectionalLight(color=[0.8, 0.8, 1.0], intensity=2.0)
                scene.add(rim_light, pose=np.array([
                    [-1, 0, 0, -2],
                    [0, 1, 0, 0],
                    [0, 0, -1, 2],
                    [0, 0, 0, 1]
                ]))
            
            elif lighting == "outdoor":
                # Sun light (directionnel fort)
                sun_light = pyrender.DirectionalLight(color=[1.0, 0.95, 0.8], intensity=15.0)
                scene.add(sun_light, pose=np.array([
                    [1, 0, 0, 5],
                    [0, 1, 0, 5],
                    [0, 0, 1, 5],
                    [0, 0, 0, 1]
                ]))
                
                # Sky light (ambient)
                sky_light = pyrender.DirectionalLight(color=[0.5, 0.7, 1.0], intensity=5.0)
                scene.add(sky_light, pose=np.array([
                    [0, 1, 0, 10],
                    [0, 0, 0, 0],
                    [0, 0, 1, 0],
                    [0, 0, 0, 1]
                ]))
            
            elif lighting == "dramatic":
                # Light principal fort
                main_light = pyrender.SpotLight(
                    color=[1.0, 0.9, 0.7],
                    intensity=30.0,
                    innerConeAngle=0.3,
                    outerConeAngle=0.8
                )
                scene.add(main_light, pose=np.array([
                    [1, -0.5, 0.5, 3],
                    [0, 1, 0, 2],
                    [0, 0, 1, 2],
                    [0, 0, 0, 1]
                ]))
                
                # Light secondaire faible
                secondary_light = pyrender.DirectionalLight(color=[0.3, 0.3, 0.5], intensity=1.0)
                scene.add(secondary_light, pose=np.array([
                    [-1, 0, 0, -2],
                    [0, 1, 0, 0],
                    [0, 0, 1, 1],
                    [0, 0, 0, 1]
                ]))
            
            # Render
            r = pyrender.OffscreenRenderer(*resolution)
            color, depth = r.render(scene)
            r.delete()
            
            # Convertit en PIL Image
            image = Image.fromarray(color)
            
            logger.info("[ModelProcessor] Preview rendered successfully")
            return image
            
        except Exception as e:
            logger.error(f"[ModelProcessor] Error rendering preview: {e}", exc_info=True)
            # Retourne placeholder en cas d'erreur
            return Image.new("RGB", resolution, color=(200, 200, 200))
    
    @staticmethod
    async def optimize_mesh(
        mesh: trimesh.Trimesh,
        target_faces: Optional[int] = None,
        preserve_uvs: bool = True
    ) -> trimesh.Trimesh:
        """
        Optimise le mesh (réduction polygones, compression)
        
        Args:
            mesh: Mesh à optimiser
            target_faces: Nombre cible de faces (si None, réduit de 50%)
            preserve_uvs: Préserve les UVs lors de la simplification
        
        Returns:
            Mesh optimisé
        """
        try:
            logger.info(f"[ModelProcessor] Optimizing mesh: {len(mesh.faces)} faces")
            
            if target_faces is None:
                target_faces = len(mesh.faces) // 2
            
            # Simplifie le mesh
            simplified = mesh.simplify_quadric_decimation(face_count=target_faces)
            
            if preserve_uvs and hasattr(mesh.visual, 'uv'):
                # Préserve les UVs
                simplified.visual = mesh.visual
            
            logger.info(f"[ModelProcessor] Mesh optimized: {len(simplified.faces)} faces")
            return simplified
            
        except Exception as e:
            logger.error(f"[ModelProcessor] Error optimizing mesh: {e}")
            return mesh
    
    @staticmethod
    async def export_model(
        mesh: trimesh.Trimesh,
        format: Literal["glb", "gltf", "obj", "usdz"] = "glb",
        optimize: bool = True
    ) -> bytes:
        """
        Exporte le mesh dans différents formats
        
        Args:
            mesh: Mesh à exporter
            format: Format d'export
            optimize: Optimise avant export
        
        Returns:
            Bytes du fichier exporté
        """
        try:
            logger.info(f"[ModelProcessor] Exporting mesh as {format}")
            
            if optimize:
                mesh = await ModelProcessor.optimize_mesh(mesh)
            
            if format == "glb":
                export_bytes = mesh.export(file_type="glb")
            elif format == "gltf":
                export_bytes = mesh.export(file_type="gltf")
            elif format == "obj":
                export_bytes = mesh.export(file_type="obj")
            elif format == "usdz":
                # USDZ nécessite conversion spéciale (à implémenter)
                # Pour l'instant, exporte en GLB
                logger.warning("[ModelProcessor] USDZ export not fully implemented, exporting as GLB")
                export_bytes = mesh.export(file_type="glb")
            else:
                raise ValueError(f"Unsupported format: {format}")
            
            logger.info(f"[ModelProcessor] Mesh exported: {len(export_bytes)} bytes")
            return export_bytes
            
        except Exception as e:
            logger.error(f"[ModelProcessor] Error exporting mesh: {e}", exc_info=True)
            raise
