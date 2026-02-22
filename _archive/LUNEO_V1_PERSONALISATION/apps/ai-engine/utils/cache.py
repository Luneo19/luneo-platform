"""
★ UTILS - CACHE REDIS COMPLET ★
Gestion cache Redis avec:
- TTL automatique
- Serialization JSON
- Compression pour gros objets
- Invalidation par pattern
"""

import os
import json
import logging
import gzip
from typing import Optional, Any, Dict, List
import hashlib

try:
    import redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False
    logger = logging.getLogger(__name__)
    logger.warning("redis not available, caching will be disabled")

logger = logging.getLogger(__name__)


class RedisCache:
    """
    Service de cache Redis avec fonctionnalités avancées
    """
    
    def __init__(
        self,
        redis_url: Optional[str] = None,
        default_ttl: int = 3600,
        compress_threshold: int = 1024  # Compress si > 1KB
    ):
        self.redis_url = redis_url or os.getenv("REDIS_URL", "redis://localhost:6379")
        self.default_ttl = default_ttl
        self.compress_threshold = compress_threshold
        
        if REDIS_AVAILABLE:
            try:
                self.redis_client = redis.from_url(
                    self.redis_url,
                    decode_responses=False,  # On gère la sérialisation nous-mêmes
                    socket_connect_timeout=5,
                    socket_timeout=5
                )
                # Test connection
                self.redis_client.ping()
                logger.info("[RedisCache] Connected to Redis")
            except Exception as e:
                logger.warning(f"[RedisCache] Failed to connect to Redis: {e}")
                self.redis_client = None
        else:
            self.redis_client = None
    
    def _serialize(self, value: Any) -> bytes:
        """Sérialise une valeur en bytes"""
        json_str = json.dumps(value, default=str)
        json_bytes = json_str.encode('utf-8')
        
        # Compression si nécessaire
        if len(json_bytes) > self.compress_threshold:
            compressed = gzip.compress(json_bytes)
            # Préfixe pour indiquer compression
            return b'GZIP:' + compressed
        else:
            return json_bytes
    
    def _deserialize(self, data: bytes) -> Any:
        """Désérialise bytes en valeur"""
        if data.startswith(b'GZIP:'):
            # Décompresse
            compressed = data[5:]  # Enlève préfixe
            json_bytes = gzip.decompress(compressed)
        else:
            json_bytes = data
        
        json_str = json_bytes.decode('utf-8')
        return json.loads(json_str)
    
    async def get(self, key: str) -> Optional[Any]:
        """
        Récupère une valeur depuis le cache
        
        Args:
            key: Clé cache
        
        Returns:
            Valeur ou None
        """
        if not self.redis_client:
            return None
        
        try:
            data = self.redis_client.get(key)
            if data is None:
                return None
            
            return self._deserialize(data)
            
        except Exception as e:
            logger.error(f"[RedisCache] Error getting key {key}: {e}")
            return None
    
    async def set(
        self,
        key: str,
        value: Any,
        ttl: Optional[int] = None
    ) -> bool:
        """
        Met une valeur en cache
        
        Args:
            key: Clé cache
            value: Valeur à mettre en cache
            ttl: Time to live en secondes (None = default)
        
        Returns:
            True si succès
        """
        if not self.redis_client:
            return False
        
        try:
            data = self._serialize(value)
            ttl = ttl or self.default_ttl
            
            self.redis_client.setex(key, ttl, data)
            return True
            
        except Exception as e:
            logger.error(f"[RedisCache] Error setting key {key}: {e}")
            return False
    
    async def delete(self, key: str) -> bool:
        """Supprime une clé"""
        if not self.redis_client:
            return False
        
        try:
            self.redis_client.delete(key)
            return True
        except Exception as e:
            logger.error(f"[RedisCache] Error deleting key {key}: {e}")
            return False
    
    async def delete_pattern(self, pattern: str) -> int:
        """
        Supprime toutes les clés correspondant au pattern
        
        Args:
            pattern: Pattern (ex: "texture:*")
        
        Returns:
            Nombre de clés supprimées
        """
        if not self.redis_client:
            return 0
        
        try:
            keys = self.redis_client.keys(pattern)
            if keys:
                return self.redis_client.delete(*keys)
            return 0
        except Exception as e:
            logger.error(f"[RedisCache] Error deleting pattern {pattern}: {e}")
            return 0
    
    async def exists(self, key: str) -> bool:
        """Vérifie si une clé existe"""
        if not self.redis_client:
            return False
        
        try:
            return bool(self.redis_client.exists(key))
        except Exception as e:
            logger.error(f"[RedisCache] Error checking key {key}: {e}")
            return False
    
    def generate_key(self, prefix: str, **kwargs) -> str:
        """
        Génère une clé cache à partir de paramètres
        
        Args:
            prefix: Préfixe (ex: "texture")
            **kwargs: Paramètres pour hash
        
        Returns:
            Clé cache
        """
        # Crée hash des paramètres
        params_str = json.dumps(kwargs, sort_keys=True, default=str)
        params_hash = hashlib.md5(params_str.encode()).hexdigest()[:8]
        
        return f"{prefix}:{params_hash}"


# Instance globale
_redis_cache: Optional[RedisCache] = None


def get_redis_cache() -> RedisCache:
    """Récupère l'instance RedisCache (singleton)"""
    global _redis_cache
    
    if _redis_cache is None:
        _redis_cache = RedisCache()
    
    return _redis_cache


async def cache_get(key: str) -> Optional[Any]:
    """Helper pour récupérer depuis cache"""
    cache = get_redis_cache()
    return await cache.get(key)


async def cache_set(key: str, value: Any, ttl: int = 3600) -> bool:
    """Helper pour mettre en cache"""
    cache = get_redis_cache()
    return await cache.set(key, value, ttl)
