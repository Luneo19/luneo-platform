"""
Orders Resource
"""

from typing import Dict, Any, List
from ..client import LuneoClient


class OrdersResource:
    """Resource for managing orders"""

    def __init__(self, client: LuneoClient):
        self.client = client

    def create(
        self,
        items: List[Dict[str, Any]],
        shipping: Dict[str, Any],
        currency: str,
    ) -> Dict[str, Any]:
        """
        Create a new order

        Args:
            items: List of order items
            shipping: Shipping information
            currency: Currency code (EUR, USD, etc.)

        Returns:
            Created order data
        """
        data = {
            "items": items,
            "shipping": shipping,
            "currency": currency,
        }

        return self.client._request("POST", "/orders", data=data)

    def get(self, order_id: str) -> Dict[str, Any]:
        """
        Get a specific order by ID

        Args:
            order_id: Order ID

        Returns:
            Order data
        """
        return self.client._request("GET", f"/orders/{order_id}")

    def cancel(self, order_id: str) -> Dict[str, Any]:
        """
        Cancel an order

        Args:
            order_id: Order ID

        Returns:
            Cancelled order data
        """
        return self.client._request("POST", f"/orders/{order_id}/cancel")
