"""
Luneo API Client
"""

import time
from typing import Optional, Dict, Any, List
import requests
from .exceptions import LuneoAPIError
from .resources.products import ProductsResource
from .resources.designs import DesignsResource
from .resources.orders import OrdersResource
from .resources.analytics import AnalyticsResource


class LuneoClient:
    """Main client for interacting with Luneo API"""

    def __init__(
        self,
        api_key: str,
        base_url: Optional[str] = None,
        timeout: Optional[int] = 30,
    ):
        """
        Initialize Luneo API client

        Args:
            api_key: Your Luneo API key
            base_url: Base URL for API (defaults to production)
            timeout: Request timeout in seconds (default: 30)
        """
        self.api_key = api_key
        self.base_url = base_url or "https://api.luneo.com/api/v1"
        self.timeout = timeout

        # Create session with default headers
        self.session = requests.Session()
        self.session.headers.update(
            {
                "Content-Type": "application/json",
                "X-API-Key": api_key,
            }
        )

        # Initialize resources
        self.products = ProductsResource(self)
        self.designs = DesignsResource(self)
        self.orders = OrdersResource(self)
        self.analytics = AnalyticsResource(self)

    def _request(
        self,
        method: str,
        endpoint: str,
        params: Optional[Dict[str, Any]] = None,
        data: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Make HTTP request to API

        Args:
            method: HTTP method (GET, POST, etc.)
            endpoint: API endpoint (without base URL)
            params: Query parameters
            data: Request body data

        Returns:
            Response data as dictionary

        Raises:
            LuneoAPIError: If API returns an error
        """
        url = f"{self.base_url}{endpoint}"

        try:
            response = self.session.request(
                method=method,
                url=url,
                params=params,
                json=data,
                timeout=self.timeout,
            )

            # Handle errors
            if not response.ok:
                error_data = response.json() if response.content else {}
                if "error" in error_data:
                    raise LuneoAPIError(
                        error_data["error"],
                        status_code=response.status_code,
                    )
                response.raise_for_status()

            return response.json()

        except requests.exceptions.RequestException as e:
            if isinstance(e, LuneoAPIError):
                raise
            raise LuneoAPIError(
                {
                    "code": "REQUEST_ERROR",
                    "message": str(e),
                },
                status_code=None,
            )

    def health(self) -> Dict[str, str]:
        """
        Check API health status

        Returns:
            Health status information
        """
        return self._request("GET", "/health")

    def get_rate_limit_info(self) -> Optional[Dict[str, int]]:
        """
        Get rate limit information from last response

        Returns:
            Rate limit info or None if not available
        """
        # This would need to be implemented with response headers tracking
        # For now, return None
        return None

