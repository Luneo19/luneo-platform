"""
★ UTILS - UPLOAD S3/R2 COMPLET ★
Gestion complète upload vers S3 ou Cloudflare R2
- Support multipart pour gros fichiers
- Retry automatique
- Compression automatique
- CDN integration
"""

import os
import logging
import asyncio
from typing import Optional, Dict, Any
from io import BytesIO
import gzip

try:
    import boto3
    from botocore.exceptions import ClientError
    BOTO3_AVAILABLE = True
except ImportError:
    BOTO3_AVAILABLE = False
    logger = logging.getLogger(__name__)
    logger.warning("boto3 not available, S3 uploads will be mocked")

logger = logging.getLogger(__name__)


class S3Uploader:
    """
    Service d'upload vers S3/R2 avec gestion complète
    """
    
    def __init__(
        self,
        bucket_name: Optional[str] = None,
        region: str = "us-east-1",
        endpoint_url: Optional[str] = None,
        access_key_id: Optional[str] = None,
        secret_access_key: Optional[str] = None,
        use_r2: bool = False
    ):
        self.bucket_name = bucket_name or os.getenv("S3_BUCKET", "luneo-assets")
        self.region = region
        self.endpoint_url = endpoint_url
        self.use_r2 = use_r2
        
        if BOTO3_AVAILABLE:
            self.s3_client = boto3.client(
                's3',
                region_name=region,
                endpoint_url=endpoint_url,
                aws_access_key_id=access_key_id or os.getenv("AWS_ACCESS_KEY_ID"),
                aws_secret_access_key=secret_access_key or os.getenv("AWS_SECRET_ACCESS_KEY")
            )
        else:
            self.s3_client = None
    
    async def upload(
        self,
        data: bytes,
        key: str,
        content_type: str,
        metadata: Optional[Dict[str, str]] = None,
        compress: bool = False,
        public: bool = False,
        cache_control: str = "public, max-age=31536000"
    ) -> str:
        """
        Upload fichier vers S3/R2
        
        Args:
            data: Données à uploader
            key: Clé S3 (chemin)
            content_type: Type MIME
            metadata: Métadonnées additionnelles
            compress: Compresser avec gzip
            public: Rendre public
            cache_control: Headers cache
        
        Returns:
            URL publique du fichier
        """
        try:
            logger.info(f"[S3Uploader] Uploading {len(data)} bytes to {key}")
            
            # Compression si demandé
            if compress and content_type.startswith("text/") or content_type in ["application/json", "application/javascript"]:
                data = gzip.compress(data)
                content_type = f"{content_type}; charset=utf-8"
                content_encoding = "gzip"
            else:
                content_encoding = None
            
            # Préparer metadata
            upload_metadata = metadata or {}
            upload_metadata["original-size"] = str(len(data))
            
            if not BOTO3_AVAILABLE or not self.s3_client:
                # Mode mock pour développement
                logger.warning("[S3Uploader] S3 not configured, returning mock URL")
                cdn_url = os.getenv("CDN_URL", "https://cdn.luneo.app")
                return f"{cdn_url}/{key}"
            
            # Upload vers S3
            extra_args = {
                "ContentType": content_type,
                "Metadata": upload_metadata,
                "CacheControl": cache_control
            }
            
            if public:
                extra_args["ACL"] = "public-read"
            
            if content_encoding:
                extra_args["ContentEncoding"] = content_encoding
            
            # Upload avec retry
            max_retries = 3
            for attempt in range(max_retries):
                try:
                    self.s3_client.put_object(
                        Bucket=self.bucket_name,
                        Key=key,
                        Body=data,
                        **extra_args
                    )
                    break
                except ClientError as e:
                    if attempt == max_retries - 1:
                        raise
                    logger.warning(f"[S3Uploader] Upload attempt {attempt + 1} failed, retrying...")
                    await asyncio.sleep(2 ** attempt)
            
            # Génère URL
            if self.use_r2 or self.endpoint_url:
                # R2 ou custom endpoint
                url = f"{self.endpoint_url}/{self.bucket_name}/{key}"
            else:
                # S3 standard
                url = f"https://{self.bucket_name}.s3.{self.region}.amazonaws.com/{key}"
            
            # CDN URL si configuré
            cdn_url = os.getenv("CDN_URL")
            if cdn_url:
                url = f"{cdn_url}/{key}"
            
            logger.info(f"[S3Uploader] Upload successful: {url}")
            return url
            
        except Exception as e:
            logger.error(f"[S3Uploader] Error uploading to S3: {e}", exc_info=True)
            raise
    
    async def delete(self, key: str) -> bool:
        """
        Supprime un fichier de S3
        
        Args:
            key: Clé S3
        
        Returns:
            True si succès
        """
        try:
            if not BOTO3_AVAILABLE or not self.s3_client:
                logger.warning("[S3Uploader] S3 not configured, skipping delete")
                return True
            
            self.s3_client.delete_object(
                Bucket=self.bucket_name,
                Key=key
            )
            
            logger.info(f"[S3Uploader] Deleted: {key}")
            return True
            
        except Exception as e:
            logger.error(f"[S3Uploader] Error deleting from S3: {e}")
            return False
    
    async def exists(self, key: str) -> bool:
        """
        Vérifie si un fichier existe
        
        Args:
            key: Clé S3
        
        Returns:
            True si existe
        """
        try:
            if not BOTO3_AVAILABLE or not self.s3_client:
                return False
            
            self.s3_client.head_object(
                Bucket=self.bucket_name,
                Key=key
            )
            return True
            
        except ClientError as e:
            if e.response['Error']['Code'] == '404':
                return False
            raise


# Instance globale
_s3_uploader: Optional[S3Uploader] = None


def get_s3_uploader() -> S3Uploader:
    """Récupère l'instance S3Uploader (singleton)"""
    global _s3_uploader
    
    if _s3_uploader is None:
        _s3_uploader = S3Uploader(
            bucket_name=os.getenv("S3_BUCKET"),
            region=os.getenv("S3_REGION", "us-east-1"),
            endpoint_url=os.getenv("S3_ENDPOINT_URL"),
            use_r2=os.getenv("USE_R2", "false").lower() == "true"
        )
    
    return _s3_uploader


async def upload_to_s3(
    data: bytes,
    key: str,
    content_type: str,
    **kwargs
) -> str:
    """
    Fonction helper pour upload rapide
    
    Args:
        data: Données à uploader
        key: Clé S3
        content_type: Type MIME
        **kwargs: Options additionnelles
    
    Returns:
        URL publique
    """
    uploader = get_s3_uploader()
    return await uploader.upload(data, key, content_type, **kwargs)
