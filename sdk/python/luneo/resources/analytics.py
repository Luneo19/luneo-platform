"""
Analytics Resource
"""

from typing import Optional, Dict, Any
from ..client import LuneoClient


class AnalyticsResource:
    """Resource for analytics data"""

    def __init__(self, client: LuneoClient):
        self.client = client

    def overview(
        self,
        start: Optional[str] = None,
        end: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Get analytics overview

        Args:
            start: Start date (ISO 8601 format)
            end: End date (ISO 8601 format)

        Returns:
            Analytics overview data
        """
        params = {}
        if start:
            params["start"] = start
        if end:
            params["end"] = end

        return self.client._request("GET", "/analytics/overview", params=params)
