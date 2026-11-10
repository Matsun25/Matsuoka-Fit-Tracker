"""
GET /records : 直近の食事・トレーニング・体組成履歴を取得するハンドラ
"""
from typing import Any, Dict
from utils.dynamodb import query_user_records
from utils.response import build_response
from utils.validator import ValidationError, to_int

ALLOWED_TYPES = {"DIET", "WORKOUT", "BODY"}


def handle_get_records(event: Dict[str, Any], user_id: str, table=None) -> Dict[str, Any]:
    """
    クエリパラメータ:
      - type (任意): 'DIET' | 'WORKOUT' | 'BODY'
      - limit (任意): 取得件数上限 (デフォルト 100, 最大 500)
    """
    query_params = event.get("queryStringParameters") or {}
    record_type = query_params.get("type")
    raw_limit = query_params.get("limit", 100)

    if record_type:
        record_type = record_type.strip().upper()
        if record_type not in ALLOWED_TYPES:
            raise ValidationError(f"'type' は {', '.join(sorted(ALLOWED_TYPES))} のいずれかを指定してください。")

    limit = to_int(raw_limit, "limit", min_val=1, max_val=500)
    items = query_user_records(
        user_id=user_id,
        record_type=record_type,
        limit=limit,
        table=table,
    )

    return build_response(
        200,
        {
            "records": items,
            "count": len(items),
        },
    )

