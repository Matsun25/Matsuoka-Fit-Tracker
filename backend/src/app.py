"""
AWS Lambda エントリーポイント (API Gateway HTTP API v2 / REST API v1 対応)
"""
import logging
from typing import Any, Dict
from handlers.get_records import handle_get_records
from handlers.post_body import handle_post_body
from handlers.post_diet import handle_post_diet
from handlers.post_workout import handle_post_workout
from utils.auth import get_user_id_from_event
from utils.response import build_response
from utils.validator import ValidationError

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)


def _extract_method_and_path(event: Dict[str, Any]) -> tuple[str, str]:
    """HTTP API (v2) と REST API (v1) の両方から HTTP メソッドとパスを抽出する"""
    request_context = event.get("requestContext", {})
    http_info = request_context.get("http", {})

    method = http_info.get("method") or event.get("httpMethod") or ""
    raw_path = event.get("rawPath") or event.get("path") or ""

    # ステージ名 (/prod 等) が先頭に含まれている場合は除去して正規化
    stage = request_context.get("stage")
    if stage and raw_path.startswith(f"/{stage}/"):
        raw_path = raw_path[len(stage) + 1 :]

    return method.upper(), raw_path.rstrip("/") or "/"


def lambda_handler(event: Dict[str, Any], context: Any = None, table=None) -> Dict[str, Any]:
    """Lambda メインハンドラ"""
    method, path = _extract_method_and_path(event)

    # CORS Preflight
    if method == "OPTIONS":
        return build_response(200, {"message": "OK"})

    user_id = get_user_id_from_event(event)
    if not user_id:
        return build_response(
            401,
            {"error": "Unauthorized", "message": "認証トークンが無効または不足しています。"},
        )

    try:
        if method == "GET" and path == "/records":
            return handle_get_records(event, user_id=user_id, table=table)
        if method == "POST" and path == "/records/diet":
            return handle_post_diet(event, user_id=user_id, table=table)
        if method == "POST" and path == "/records/workout":
            return handle_post_workout(event, user_id=user_id, table=table)
        if method == "POST" and path == "/records/body":
            return handle_post_body(event, user_id=user_id, table=table)

        return build_response(
            404,
            {"error": "NotFound", "message": f"エンドポイントが見つかりません: {method} {path}"},
        )
    except ValidationError as exc:
        return build_response(
            400,
            {"error": "BadRequest", "message": str(exc)},
        )
    except Exception as exc:  # pylint: disable=broad-except
        logger.exception("Unhandled error in lambda_handler: %s", exc)
        return build_response(
            500,
            {"error": "InternalServerError", "message": "サーバー内部エラーが発生しました。"},
        )

