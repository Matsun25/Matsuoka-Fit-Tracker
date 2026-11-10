"""
API Gateway 用 HTTP レスポンスおよび JSON シリアライズヘルパー
"""
import json
import os
from decimal import Decimal
from typing import Any, Dict


class DecimalEncoder(json.JSONEncoder):
    """DynamoDB の Decimal 型を int または float に変換する JSON エンコーダ"""

    def default(self, obj: Any) -> Any:
        if isinstance(obj, Decimal):
            if obj % 1 == 0:
                return int(obj)
            return float(obj)
        return super().default(obj)


def build_response(status_code: int, body: Dict[str, Any]) -> Dict[str, Any]:
    """CORS ヘッダー付きの標準 API Gateway レスポンスを生成する"""
    allowed_origin = os.environ.get("ALLOWED_ORIGIN", "*")
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json; charset=utf-8",
            "Access-Control-Allow-Origin": allowed_origin,
            "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Mock-User-Id",
            "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
        },
        "body": json.dumps(body, cls=DecimalEncoder, ensure_ascii=False),
    }

