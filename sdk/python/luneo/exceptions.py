"""
Luneo API Exceptions
"""

from typing import Optional


class LuneoAPIError(Exception):
    """Base exception for Luneo API errors"""

    def __init__(self, error: dict, status_code: Optional[int] = None):
        """
        Initialize Luneo API error

        Args:
            error: Error data from API
            status_code: HTTP status code
        """
        self.code = error.get("code", "UNKNOWN_ERROR")
        self.message = error.get("message", "An unknown error occurred")
        self.details = error.get("details", {})
        self.status_code = status_code
        super().__init__(self.message)

    def __str__(self):
        return f"[{self.code}] {self.message}"

    def __repr__(self):
        return f"LuneoAPIError(code={self.code!r}, message={self.message!r}, status_code={self.status_code})"
