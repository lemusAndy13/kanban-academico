from rest_framework.test import APITestCase
from django.urls import reverse


class SmokeApiTests(APITestCase):
    def test_schema_available(self):
        resp = self.client.get("/api/schema/")
        self.assertIn(resp.status_code, (200, 301, 302))  # 200 esperado

    def test_docs_available(self):
        resp = self.client.get("/api/docs/")
        self.assertIn(resp.status_code, (200, 301, 302))







