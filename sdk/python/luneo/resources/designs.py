"""
Designs Resource
"""

import time
from typing import Optional, Dict, Any
from ..client import LuneoClient
from ..exceptions import LuneoAPIError


class DesignsResource:
    """Resource for managing designs"""

    def __init__(self, client: LuneoClient):
        self.client = client

    def create(
        self,
        product_id: str,
        prompt: str,
        options: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Create a new design with AI

        Args:
            product_id: Product ID
            prompt: Design prompt description
            options: Design options (material, size, color, etc.)

        Returns:
            Created design data
        """
        data = {
            "productId": product_id,
            "prompt": prompt,
        }
        if options:
            data["options"] = options

        return self.client._request("POST", "/designs", data=data)

    def get(self, design_id: str) -> Dict[str, Any]:
        """
        Get a specific design by ID

        Args:
            design_id: Design ID

        Returns:
            Design data
        """
        return self.client._request("GET", f"/designs/{design_id}")

    def wait_for_completion(
        self,
        design_id: str,
        interval: int = 2,
        timeout: int = 300,
    ) -> Dict[str, Any]:
        """
        Wait for design completion with polling

        Args:
            design_id: Design ID
            interval: Polling interval in seconds (default: 2)
            timeout: Maximum wait time in seconds (default: 300)

        Returns:
            Completed design data

        Raises:
            LuneoAPIError: If design fails or timeout occurs
        """
        start_time = time.time()

        while True:
            design = self.get(design_id)
            status = design.get("status")

            if status == "completed":
                return design

            if status == "failed":
                raise LuneoAPIError(
                    {
                        "code": "DESIGN_FAILED",
                        "message": "Design generation failed",
                    }
                )

            if time.time() - start_time > timeout:
                raise LuneoAPIError(
                    {
                        "code": "TIMEOUT",
                        "message": f"Design generation timeout after {timeout} seconds",
                    }
                )

            time.sleep(interval)
