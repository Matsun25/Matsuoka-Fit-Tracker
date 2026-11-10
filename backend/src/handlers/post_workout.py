"""
POST /records/workout : トレーニング記録（種目、重量、回数、セット数）の登録ハンドラ
"""
from typing import Any, Dict
from utils.dynamodb import put_fitness_record
from utils.response import build_response
from utils.validator import (
    build_sort_key,
    parse_json_body,
    resolve_timestamp,
    to_decimal,
    to_int,
    to_non_empty_str,
)


def handle_post_workout(event: Dict[str, Any], user_id: str, table=None) -> Dict[str, Any]:
    """
    リクエストボディ例:
    {
      "workoutName": "ベンチプレス",
      "weight": 80.0,
      "reps": 10,
      "sets": 3,
      "recordedAt": "2026-11-10T14:30:00Z" // 省略時は現在時刻
    }
    """
    body = parse_json_body(event)

    workout_name = to_non_empty_str(body.get("workoutName"), "workoutName", max_length=255)
    weight = to_decimal(body.get("weight"), "weight", min_val=0.0, max_val=1000.0)
    reps = to_int(body.get("reps"), "reps", min_val=1, max_val=1000)
    sets = to_int(body.get("sets", 1), "sets", min_val=1, max_val=100)

    recorded_at = resolve_timestamp(body.get("recordedAt"))
    record_type, sort_key = build_sort_key("WORKOUT", recorded_at)

    item: Dict[str, Any] = {
        "userId": user_id,
        "recordKey": sort_key,
        "recordType": record_type,
        "recordedAt": recorded_at,
        "workoutName": workout_name,
        "weight": weight,
        "reps": reps,
        "sets": sets,
        "syncedToCold": False,
    }

    put_fitness_record(item, table=table)
    return build_response(
        201,
        {
            "message": "トレーニング記録を登録しました。",
            "record": item,
        },
    )

