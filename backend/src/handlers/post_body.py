"""
POST /records/body : 体組成（体重、体脂肪率）の登録ハンドラ
"""
from typing import Any, Dict
from utils.dynamodb import put_fitness_record
from utils.response import build_response
from utils.validator import (
    build_sort_key,
    parse_json_body,
    resolve_timestamp,
    to_decimal,
)


def handle_post_body(event: Dict[str, Any], user_id: str, table=None) -> Dict[str, Any]:
    """
    リクエストボディ例:
    {
      "bodyWeight": 68.4,
      "bodyFatPercentage": 14.8,
      "recordedAt": "2026-11-10T07:00:00Z" // 省略時は現在時刻
    }
    """
    body = parse_json_body(event)

    body_weight = to_decimal(body.get("bodyWeight"), "bodyWeight", min_val=10.0, max_val=500.0)
    raw_fat = body.get("bodyFatPercentage")
    body_fat = (
        to_decimal(raw_fat, "bodyFatPercentage", min_val=1.0, max_val=90.0)
        if raw_fat is not None and raw_fat != ""
        else None
    )

    recorded_at = resolve_timestamp(body.get("recordedAt"))
    record_type, sort_key = build_sort_key("BODY", recorded_at)

    item: Dict[str, Any] = {
        "userId": user_id,
        "recordKey": sort_key,
        "recordType": record_type,
        "recordedAt": recorded_at,
        "bodyWeight": body_weight,
        "syncedToCold": False,
    }
    if body_fat is not None:
        item["bodyFatPercentage"] = body_fat

    put_fitness_record(item, table=table)
    return build_response(
        201,
        {
            "message": "体組成記録を登録しました。",
            "record": item,
        },
    )

