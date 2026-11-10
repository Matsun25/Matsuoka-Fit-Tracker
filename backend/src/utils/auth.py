"""
Cognito JWT Authorizer クレームから userId を抽出するユーティリティ
"""
from typing import Any, Dict, Optional


def get_user_id_from_event(event: Dict[str, Any]) -> Optional[str]:
    """
    API Gateway HTTP API (v2) または REST API (v1) のイベントから
    Cognito の sub (ユーザーID) を取得する。
    ローカル開発・テスト時は x-mock-user-id ヘッダーもフォールバックとしてサポートする。
    """
    request_context = event.get("requestContext", {})
    authorizer = request_context.get("authorizer", {})

    # HTTP API (v2) payload format 2.0
    jwt_claims = authorizer.get("jwt", {}).get("claims", {})
    if "sub" in jwt_claims:
        return str(jwt_claims["sub"])

    # REST API (v1) / Lambda Authorizer 互換
    claims = authorizer.get("claims", {})
    if "sub" in claims:
        return str(claims["sub"])

    # ローカルテスト用ヘッダーフォールバック
    headers = event.get("headers") or {}
    normalized_headers = {k.lower(): v for k, v in headers.items()}
    if "x-mock-user-id" in normalized_headers:
        return str(normalized_headers["x-mock-user-id"])

    return None

