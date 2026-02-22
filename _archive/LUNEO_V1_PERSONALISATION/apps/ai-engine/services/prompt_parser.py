"""
★ SERVICE - PARSE PROMPT UTILISATEUR ★
Parse et valide les prompts utilisateur
- Détection langue
- Nettoyage caractères spéciaux
- Validation longueur
- Extraction entités (dates, noms, etc.)
"""

import re
import logging
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class ParsedPrompt:
    """Résultat du parsing d'un prompt"""
    text: str
    language: str
    word_count: int
    char_count: int
    has_special_chars: bool
    has_emojis: bool
    entities: Dict[str, List[str]]
    cleaned_text: str
    is_valid: bool
    validation_errors: List[str]


class PromptParser:
    """
    Service de parsing et validation de prompts utilisateur
    """
    
    # Patterns pour détection langue
    FRENCH_PATTERNS = [
        r'[àâäéèêëïîôùûüÿç]',
        r'\b(le|la|les|un|une|des|de|du|et|ou|est|sont|avec|pour|dans|sur)\b',
    ]
    
    ENGLISH_PATTERNS = [
        r'\b(the|a|an|and|or|is|are|with|for|in|on)\b',
    ]
    
    # Patterns pour entités
    DATE_PATTERN = r'\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b'
    EMAIL_PATTERN = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    PHONE_PATTERN = r'\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b'
    URL_PATTERN = r'https?://[^\s]+'
    
    # Emojis pattern
    EMOJI_PATTERN = re.compile(
        "["
        "\U0001F600-\U0001F64F"  # emoticons
        "\U0001F300-\U0001F5FF"  # symbols & pictographs
        "\U0001F680-\U0001F6FF"  # transport & map
        "\U0001F1E0-\U0001F1FF"  # flags
        "\U00002702-\U000027B0"
        "\U000024C2-\U0001F251"
        "]+",
        flags=re.UNICODE
    )
    
    def __init__(
        self,
        max_length: int = 100,
        min_length: int = 1,
        allowed_languages: Optional[List[str]] = None,
        strip_emojis: bool = False
    ):
        self.max_length = max_length
        self.min_length = min_length
        self.allowed_languages = allowed_languages or ["fr", "en"]
        self.strip_emojis = strip_emojis
    
    async def parse(self, prompt: str) -> ParsedPrompt:
        """
        Parse et valide un prompt
        
        Args:
            prompt: Texte du prompt
        
        Returns:
            ParsedPrompt avec toutes les informations
        """
        try:
            logger.info(f"[PromptParser] Parsing prompt: '{prompt[:50]}...'")
            
            # Nettoyage initial
            cleaned = prompt.strip()
            
            # Détection langue
            language = self._detect_language(cleaned)
            
            # Extraction entités
            entities = self._extract_entities(cleaned)
            
            # Détection emojis
            has_emojis = bool(self.EMOJI_PATTERN.search(cleaned))
            
            # Strip emojis si demandé
            if self.strip_emojis and has_emojis:
                cleaned = self.EMOJI_PATTERN.sub('', cleaned).strip()
            
            # Détection caractères spéciaux
            has_special_chars = bool(re.search(r'[^\w\s\-.,!?;:()\[\]{}"\']', cleaned))
            
            # Validation
            validation_errors = []
            is_valid = True
            
            if len(cleaned) < self.min_length:
                validation_errors.append(f"Texte trop court (minimum {self.min_length} caractères)")
                is_valid = False
            
            if len(cleaned) > self.max_length:
                validation_errors.append(f"Texte trop long (maximum {self.max_length} caractères)")
                is_valid = False
            
            if language not in self.allowed_languages:
                validation_errors.append(f"Langue non supportée: {language}")
                is_valid = False
            
            if not cleaned:
                validation_errors.append("Le texte est vide après nettoyage")
                is_valid = False
            
            result = ParsedPrompt(
                text=prompt,
                language=language,
                word_count=len(cleaned.split()),
                char_count=len(cleaned),
                has_special_chars=has_special_chars,
                has_emojis=has_emojis,
                entities=entities,
                cleaned_text=cleaned,
                is_valid=is_valid,
                validation_errors=validation_errors
            )
            
            logger.info(f"[PromptParser] Parsed: language={language}, valid={is_valid}, words={result.word_count}")
            
            return result
            
        except Exception as e:
            logger.error(f"[PromptParser] Error parsing prompt: {e}", exc_info=True)
            raise
    
    def _detect_language(self, text: str) -> str:
        """Détecte la langue du texte"""
        text_lower = text.lower()
        
        # Compte patterns français
        french_score = sum(
            len(re.findall(pattern, text_lower, re.IGNORECASE))
            for pattern in self.FRENCH_PATTERNS
        )
        
        # Compte patterns anglais
        english_score = sum(
            len(re.findall(pattern, text_lower, re.IGNORECASE))
            for pattern in self.ENGLISH_PATTERNS
        )
        
        if french_score > english_score:
            return "fr"
        elif english_score > 0:
            return "en"
        else:
            # Par défaut, français
            return "fr"
    
    def _extract_entities(self, text: str) -> Dict[str, List[str]]:
        """Extrait entités du texte (dates, emails, etc.)"""
        entities = {
            "dates": re.findall(self.DATE_PATTERN, text),
            "emails": re.findall(self.EMAIL_PATTERN, text),
            "phones": re.findall(self.PHONE_PATTERN, text),
            "urls": re.findall(self.URL_PATTERN, text),
        }
        
        # Nettoie les listes vides
        return {k: v for k, v in entities.items() if v}
    
    async def sanitize(self, prompt: str) -> str:
        """
        Nettoie et sanitize le prompt pour sécurité
        
        Args:
            prompt: Texte à nettoyer
        
        Returns:
            Texte nettoyé
        """
        # Supprime caractères de contrôle
        cleaned = re.sub(r'[\x00-\x1f\x7f-\x9f]', '', prompt)
        
        # Supprime scripts potentiels
        cleaned = re.sub(r'<script[^>]*>.*?</script>', '', cleaned, flags=re.IGNORECASE | re.DOTALL)
        
        # Trim
        cleaned = cleaned.strip()
        
        return cleaned

