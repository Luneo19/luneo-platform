import unittest

from app.health import healthcheck


class HealthcheckTestCase(unittest.TestCase):
    def test_healthcheck_payload(self) -> None:
        payload = healthcheck()
        self.assertEqual(payload["status"], "ok")
        self.assertEqual(payload["service"], "ai-engine")


if __name__ == "__main__":
    unittest.main()
