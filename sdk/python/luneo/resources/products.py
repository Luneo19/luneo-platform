"""
Products Resource
"""

from typing import Optional, Dict, Any, List
from ..client import LuneoClient


class ProductsResource:
    """Resource for managing products"""

    def __init__(self, client: LuneoClient):
        self.client = client

    def list(
        self,
        limit: Optional[int] = None,
        offset: Optional[int] = None,
        category: Optional[str] = None,
        search: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        List all products

        Args:
            limit: Number of results (default: 20, max: 100)
            offset: Pagination offset (default: 0)
            category: Filter by category
            search: Search query

        Returns:
            Paginated response with products
        """
        params = {}
        if limit is not None:
            params["limit"] = limit
        if offset is not None:
            params["offset"] = offset
        if category:
            params["category"] = category
        if search:
            params["search"] = search

        return self.client._request("GET", "/products", params=params)

    def get(self, product_id: str) -> Dict[str, Any]:
        """
        Get a specific product by ID

        Args:
            product_id: Product ID

        Returns:
            Product data
        """
        return self.client._request("GET", f"/products/{product_id}")
