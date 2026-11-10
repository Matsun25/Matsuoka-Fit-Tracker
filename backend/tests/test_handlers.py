"""
Lambda ハンドラの単体テストスイート (インメモリモックテーブル使用)
"""
import json
import os
import sys
import unittest
from pathlib import Path
from typing import Any, Dict, List

# backend/src を import パスに追加
SRC_DIR = Path(__file__).resolve().parent.parent / "src"
sys.path.insert(0, str(SRC_DIR))

from app import lambda_handler  # noqa: E402


class FakeDynamoTable:
    """テスト用のインメモリ DynamoDB テーブルモック"""

    def __init__(self) -> None:
        self.items: List[Dict[str, Any]] = []

    def put_item(self, Item: Dict[str, Any]) -> Dict[str, Any]:
        # 同じ PK + SK があれば上書き
        self.items = [
            existing
            for existing in self.items
            if not (
                existing.get("userId") == Item.get("userId")
                and existing.get("recordKey") == Item.get("recordKey")
            )
        ]
        self.items.append(Item)
        return {"ResponseMetadata": {"HTTPStatusCode": 200}}

    def query(self, **kwargs: Any) -> Dict[str, Any]:
        limit = kwargs.get("Limit", 100)
        # シンプルに保存済みアイテムを返す（単体テストでは同一 userId を検証）
        return {"Items": list(self.items)[:limit]}


def _make_event(
    method: str,
    path: str,
    body: Any = None,
    query_params: Dict[str, str] | None = None,
    user_id: str | None = "user-cognito-sub-123",
) -> Dict[str, Any]:
    event: Dict[str, Any] = {
        "rawPath": path,
        "queryStringParameters": query_params,
        "requestContext": {
            "http": {"method": method, "path": path},
            "authorizer": (
                {"jwt": {"claims": {"sub": user_id}}} if user_id else {}
            ),
        },
    }
    if body is not None:
        event["body"] = json.dumps(body) if isinstance(body, dict) else body
    return event


class TestFitTrackerHandlers(unittest.TestCase):
    def setUp(self) -> None:
        self.table = FakeDynamoTable()
        os.environ["ALLOWED_ORIGIN"] = "https://fit-tracker.example.com"

    def test_unauthorized_when_no_jwt_sub(self) -> None:
        event = _make_event("GET", "/records", user_id=None)
        res = lambda_handler(event, table=self.table)
        self.assertEqual(res["statusCode"], 401)

    def test_post_diet_and_auto_calories(self) -> None:
        event = _make_event(
            "POST",
            "/records/diet",
            body={
                "menuName": "オートミールとプロテイン",
                "protein": 30.0,
                "fat": 5.0,
                "carbs": 40.0,
                "recordedAt": "2026-11-10T08:00:00Z",
            },
        )
        res = lambda_handler(event, table=self.table)
        self.assertEqual(res["statusCode"], 201)
        payload = json.loads(res["body"])
        record = payload["record"]
        # P:30*4=120, F:5*9=45, C:40*4=160 => 325 kcal
        self.assertEqual(record["calories"], 325)
        self.assertEqual(record["recordKey"], "DIET#2026-11-10T08:00:00Z")
        self.assertEqual(record["syncedToCold"], False)

    def test_post_workout_success(self) -> None:
        event = _make_event(
            "POST",
            "/records/workout",
            body={
                "workoutName": "ベンチプレス",
                "weight": 82.5,
                "reps": 8,
                "sets": 4,
                "recordedAt": "2026-11-10T18:30:00Z",
            },
        )
        res = lambda_handler(event, table=self.table)
        self.assertEqual(res["statusCode"], 201)
        payload = json.loads(res["body"])
        record = payload["record"]
        self.assertEqual(record["workoutName"], "ベンチプレス")
        self.assertEqual(record["weight"], 82.5)
        self.assertEqual(record["reps"], 8)
        self.assertEqual(record["sets"], 4)
        self.assertEqual(record["recordKey"], "WORKOUT#2026-11-10T18:30:00Z")

    def test_post_body_success(self) -> None:
        event = _make_event(
            "POST",
            "/records/body",
            body={
                "bodyWeight": 67.8,
                "bodyFatPercentage": 14.2,
                "recordedAt": "2026-11-10T07:00:00Z",
            },
        )
        res = lambda_handler(event, table=self.table)
        self.assertEqual(res["statusCode"], 201)
        payload = json.loads(res["body"])
        record = payload["record"]
        self.assertEqual(record["bodyWeight"], 67.8)
        self.assertEqual(record["bodyFatPercentage"], 14.2)
        self.assertEqual(record["recordKey"], "BODY#2026-11-10T07:00:00Z")

    def test_get_records_sorted_descending(self) -> None:
        # 2件登録して最新順で返ることを確認
        lambda_handler(
            _make_event(
                "POST",
                "/records/body",
                body={"bodyWeight": 68.0, "recordedAt": "2026-11-09T07:00:00Z"},
            ),
            table=self.table,
        )
        lambda_handler(
            _make_event(
                "POST",
                "/records/diet",
                body={
                    "menuName": "サラダチキン",
                    "calories": 110,
                    "protein": 24,
                    "fat": 1.2,
                    "carbs": 0.5,
                    "recordedAt": "2026-11-10T12:00:00Z",
                },
            ),
            table=self.table,
        )
        res = lambda_handler(_make_event("GET", "/records"), table=self.table)
        self.assertEqual(res["statusCode"], 200)
        payload = json.loads(res["body"])
        self.assertEqual(payload["count"], 2)
        self.assertEqual(payload["records"][0]["recordType"], "DIET")
        self.assertEqual(payload["records"][1]["recordType"], "BODY")

    def test_validation_error_returns_400(self) -> None:
        event = _make_event(
            "POST",
            "/records/workout",
            body={"workoutName": "", "weight": -10, "reps": 0},
        )
        res = lambda_handler(event, table=self.table)
        self.assertEqual(res["statusCode"], 400)


if __name__ == "__main__":
    unittest.main()

