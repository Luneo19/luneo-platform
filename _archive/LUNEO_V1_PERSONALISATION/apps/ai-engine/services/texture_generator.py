"""
★ SERVICE - GENERATION DE TEXTURE AVEC TEXTE COMPLET ★
Génère des textures avec texte stylisé
Supporte : normal, embossed, engraved, 3D, outline
Gestion polices custom, anti-aliasing, compression
"""

from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance
from typing import Literal, Optional, Tuple
import numpy as np
import logging
import os

logger = logging.getLogger(__name__)


class TextureGenerator:
    """
    Génère des textures avec texte stylisé
    Supporte : normal, embossed, engraved, 3D, outline
    """
    
    def __init__(
        self,
        text: str,
        font: str = "Arial",
        color: str = "#000000",
        size: int = 24,
        effect: Literal["normal", "embossed", "engraved", "3d", "outline"] = "engraved",
        background_color: Optional[str] = None,
        antialiasing: bool = True,
        quality: Literal["low", "medium", "high"] = "high"
    ):
        self.text = text
        self.font_name = font
        self.color = self._hex_to_rgb(color)
        self.size = size
        self.effect = effect
        self.background_color = background_color
        self.antialiasing = antialiasing
        self.quality = quality
        
    async def generate(self, width: int = 2048, height: int = 2048) -> Image.Image:
        """
        Génère la texture complète
        
        Args:
            width: Largeur texture
            height: Hauteur texture
        
        Returns:
            Image PIL de la texture
        """
        try:
            logger.info(f"[TextureGenerator] Generating texture: '{self.text[:50]}...'")
            
            # Crée canvas
            if self.background_color:
                bg_color = self._hex_to_rgb(self.background_color)
                texture = Image.new("RGBA", (width, height), bg_color)
            else:
                texture = Image.new("RGBA", (width, height), (255, 255, 255, 0))
            
            draw = ImageDraw.Draw(texture)
            
            # Charge police avec fallback
            font = self._load_font(self.size)
            
            # Mesure texte
            bbox = draw.textbbox((0, 0), self.text, font=font)
            text_width = bbox[2] - bbox[0]
            text_height = bbox[3] - bbox[1]
            
            # Centre le texte
            x = (width - text_width) // 2
            y = (height - text_height) // 2
            
            # Apply effet selon qualité
            if self.effect == "normal":
                draw.text((x, y), self.text, font=font, fill=self.color)
                
            elif self.effect == "embossed":
                texture = self._apply_emboss(draw, texture, self.text, font, (x, y))
                
            elif self.effect == "engraved":
                texture = self._apply_engrave(draw, texture, self.text, font, (x, y))
                
            elif self.effect == "3d":
                texture = self._apply_3d(draw, texture, self.text, font, (x, y))
            
            elif self.effect == "outline":
                texture = self._apply_outline(draw, texture, self.text, font, (x, y))
            
            # Post-processing selon qualité
            if self.quality == "high":
                # Anti-aliasing avancé
                if self.antialiasing:
                    texture = texture.filter(ImageFilter.SMOOTH_MORE)
                
                # Amélioration contraste
                enhancer = ImageEnhance.Contrast(texture)
                texture = enhancer.enhance(1.1)
            
            logger.info("[TextureGenerator] Texture generated successfully")
            return texture
            
        except Exception as e:
            logger.error(f"[TextureGenerator] Error generating texture: {e}", exc_info=True)
            raise
    
    def _load_font(self, size: int) -> ImageFont.FreeTypeFont:
        """Charge la police avec fallback intelligent"""
        try:
            # Try system fonts
            system_fonts = [
                f"/System/Library/Fonts/Supplemental/{self.font_name}.ttf",
                f"/System/Library/Fonts/{self.font_name}.ttf",
                f"/usr/share/fonts/truetype/{self.font_name.lower()}.ttf",
                f"/usr/share/fonts/truetype/liberation/{self.font_name.lower()}.ttf",
            ]
            
            for font_path in system_fonts:
                if os.path.exists(font_path):
                    return ImageFont.truetype(font_path, size)
            
            # Fallback to default
            logger.warning(f"Font {self.font_name} not found, using default")
            return ImageFont.load_default()
            
        except Exception as e:
            logger.warning(f"Error loading font: {e}, using default")
            return ImageFont.load_default()
    
    def _apply_emboss(
        self,
        draw: ImageDraw.Draw,
        img: Image.Image,
        text: str,
        font: ImageFont.FreeTypeFont,
        pos: Tuple[int, int]
    ) -> Image.Image:
        """Effet relief (embossé) - texte en relief"""
        x, y = pos
        
        # Ombre en haut à gauche (clair)
        highlight_color = tuple(min(255, c + 80) for c in self.color[:3]) + (200,)
        draw.text((x - 2, y - 2), text, font=font, fill=highlight_color)
        
        # Ombre en bas à droite (sombre)
        shadow_color = tuple(max(0, c - 80) for c in self.color[:3]) + (200,)
        draw.text((x + 2, y + 2), text, font=font, fill=shadow_color)
        
        # Texte principal
        draw.text(pos, text, font=font, fill=self.color)
        
        return img
    
    def _apply_engrave(
        self,
        draw: ImageDraw.Draw,
        img: Image.Image,
        text: str,
        font: ImageFont.FreeTypeFont,
        pos: Tuple[int, int]
    ) -> Image.Image:
        """Effet gravé (creux) - texte en creux"""
        x, y = pos
        
        # Ombre en bas à droite (sombre)
        shadow_color = tuple(max(0, c - 100) for c in self.color[:3]) + (180,)
        draw.text((x + 2, y + 2), text, font=font, fill=shadow_color)
        
        # Highlight en haut à gauche (clair)
        highlight_color = tuple(min(255, c + 60) for c in self.color[:3]) + (150,)
        draw.text((x - 1, y - 1), text, font=font, fill=highlight_color)
        
        # Texte principal (plus sombre)
        darker_color = tuple(max(0, c - 50) for c in self.color[:3]) + (255,)
        draw.text(pos, text, font=font, fill=darker_color)
        
        # Blur léger pour effet creux
        img = img.filter(ImageFilter.GaussianBlur(radius=0.5))
        
        return img
    
    def _apply_3d(
        self,
        draw: ImageDraw.Draw,
        img: Image.Image,
        text: str,
        font: ImageFont.FreeTypeFont,
        pos: Tuple[int, int]
    ) -> Image.Image:
        """Effet 3D (extrusion) - texte avec profondeur"""
        x, y = pos
        
        # Dessine couches successives pour effet 3D
        depth = 8
        for i in range(depth, 0, -1):
            offset_x = -i
            offset_y = -i
            shadow_color = tuple(max(0, c - i * 20) for c in self.color[:3]) + (255,)
            draw.text((x + offset_x, y + offset_y), text, font=font, fill=shadow_color)
        
        # Texte principal
        draw.text(pos, text, font=font, fill=self.color)
        
        # Highlight sur le texte principal
        highlight_color = (255, 255, 255, 120)
        draw.text((x + 1, y + 1), text, font=font, fill=highlight_color)
        
        return img
    
    def _apply_outline(
        self,
        draw: ImageDraw.Draw,
        img: Image.Image,
        text: str,
        font: ImageFont.FreeTypeFont,
        pos: Tuple[int, int]
    ) -> Image.Image:
        """Effet outline - contour autour du texte"""
        x, y = pos
        
        # Dessine contour (8 directions)
        outline_color = (0, 0, 0, 255)
        for dx in [-2, -1, 0, 1, 2]:
            for dy in [-2, -1, 0, 1, 2]:
                if dx != 0 or dy != 0:
                    draw.text((x + dx, y + dy), text, font=font, fill=outline_color)
        
        # Texte principal par-dessus
        draw.text(pos, text, font=font, fill=self.color)
        
        return img
    
    def _hex_to_rgb(self, hex_color: str) -> Tuple[int, int, int, int]:
        """Convertit #RRGGBB en (R, G, B, A)"""
        hex_color = hex_color.lstrip("#")
        if len(hex_color) == 6:
            return (
                int(hex_color[0:2], 16),
                int(hex_color[2:4], 16),
                int(hex_color[4:6], 16),
                255
            )
        elif len(hex_color) == 8:
            return (
                int(hex_color[0:2], 16),
                int(hex_color[2:4], 16),
                int(hex_color[4:6], 16),
                int(hex_color[6:8], 16)
            )
        return (0, 0, 0, 255)
