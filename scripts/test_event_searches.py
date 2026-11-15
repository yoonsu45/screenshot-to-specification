"""Integration checks for search RPCs against a clean test database.

Run with `python3 scripts/test_event_searches.py`. Before running, seed an
eight-day-old `test-event-searches-old` row and a one-day-future
`test-event-searches-future` row using the database data tools. Remove rows
whose event_id starts with `test-event-searches-` afterwards with those tools.
Uses only the application's public URL/key and never prints credentials.
"""

import json
import os
from pathlib import Path
import unittest
import uuid

import requests


def public_config():
    values = dict(os.environ)
    env_file = Path(__file__).resolve().parents[1] / ".env"
    if env_file.exists():
        for line in env_file.read_text().splitlines():
            key, separator, value = line.partition("=")
            if separator and key.startswith("VITE_SUPABASE_"):
                values.setdefault(key, value.strip().strip('"').strip("'"))
    return values["VITE_SUPABASE_URL"], values["VITE_SUPABASE_PUBLISHABLE_KEY"]


class EventSearchIntegrationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        url, key = public_config()
        cls.url = url + "/rest/v1"
        cls.headers = {"apikey": key, "Content-Type": "application/json"}
        cls.sessions = [str(uuid.uuid4()) for _ in range(7)]
        for event_number in range(1, 8):
            for session in cls.sessions[:event_number]:
                response = cls.rpc("record_event_search", {
                    "p_event_id": f"test-event-searches-{event_number}",
                    "p_anonymous_session_id": session,
                })
                if not response.ok:
                    raise AssertionError(f"Anonymous recording failed: {response.status_code}")

    @classmethod
    def rpc(cls, name, body):
        return requests.post(f"{cls.url}/rpc/{name}", headers=cls.headers,
                             data=json.dumps(body), timeout=20)

    def ranking(self):
        response = self.rpc("get_top_event_searches", {})
        self.assertEqual(response.status_code, 200)
        return response.json()

    def test_anonymous_searches_and_same_session_duplicates(self):
        response = self.rpc("record_event_search", {
            "p_event_id": "test-event-searches-7",
            "p_anonymous_session_id": self.sessions[0],
        })
        self.assertTrue(response.ok)
        top = self.ranking()
        self.assertEqual(top[0], {"event_id": "test-event-searches-7", "search_count": 7})

    def test_only_top_five_are_returned_in_descending_order(self):
        self.assertEqual(self.ranking(), [
            {"event_id": f"test-event-searches-{n}", "search_count": n}
            for n in [7, 6, 5, 4, 3]
        ])

    def test_seven_day_window_excludes_old_and_future_searches(self):
        ids = {row["event_id"] for row in self.ranking()}
        self.assertNotIn("test-event-searches-old", ids)
        self.assertNotIn("test-event-searches-future", ids)

    def test_raw_rows_are_not_readable_or_directly_writable(self):
        response = requests.get(f"{self.url}/event_searches?select=*",
                                headers=self.headers, timeout=20)
        self.assertIn(response.status_code, [401, 403])
        response = requests.post(f"{self.url}/event_searches", headers=self.headers,
                                 json={"event_id": "test-event-searches-direct",
                                       "anonymous_session_id": str(uuid.uuid4())}, timeout=20)
        self.assertIn(response.status_code, [401, 403])

    def test_public_results_have_no_session_or_row_identifiers(self):
        for row in self.ranking():
            self.assertEqual(set(row), {"event_id", "search_count"})

    def test_invalid_event_and_missing_session_are_rejected(self):
        for event_id, session in [(" ", self.sessions[0]), ("x" * 201, self.sessions[0]),
                                  ("test-event-searches-invalid", None)]:
            response = self.rpc("record_event_search", {
                "p_event_id": event_id, "p_anonymous_session_id": session,
            })
            self.assertEqual(response.status_code, 400)


if __name__ == "__main__":
    unittest.main()