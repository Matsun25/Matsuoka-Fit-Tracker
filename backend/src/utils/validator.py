"""
リクエストボディのパースおよびバリデーションユーティリティ
"""
import json
from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation
from typing import Any, Dict, Tuple


class ValidationError(Exception):
    """入力値バリデーションエラー"""


def parse_json_body(event: Dict[str, Any]) -> Dict[str, Any]:
    """event['body'] を JSON としてパースする"""
    raw_body = event.get("body")
    if not raw_body:
        raise ValidationError("リクエストボディが空です。")
    if isinstance(raw_body, dict):
        return raw_body
    try:
        data = json.loads(raw_body)
        if not isinstance(data, dict):
            raise ValidationError("JSON オブジェクト形式で送信してください。")
        return data
    except json.JSONDecodeError as exc:
        raise ValidationError("不正な JSON 形式です。") from exc


def to_decimal(value: Any, field_name: str, min_val: float = 0.0, max_val: float = 100000.0) -> Decimal:
    """数値を DynamoDB 保存用の Decimal 型に安全に変換・検証する"""
    if value is None or isinstance(value, bool):
        raise ValidationError(f"'{field_name}' は必須の数値項目です。")
    try:
        dec = Decimal(str(value))
    except (InvalidOperation, ValueError, TypeError) as exc:
        raise ValidationError(f"'{field_name}' には有効な数値を指定してください。") from exc

    if dec < Decimal(str(min_val)) or dec > Decimal(str(max_val)):
        raise ValidationError(f"'{field_name}' は {min_val} 以上 {max_val} 以下で指定してください。")
    return dec


def to_int(value: Any, field_name: str, min_val: int = 0, max_val: int = 100000) -> int:
    """整数値を検証して int として返す"""
    if value is None or isinstance(value, bool):
        raise ValidationError(f"'{field_name}' は必須の整数項目です。")
    try:
        num = int(value)
    except (ValueError, TypeError) as exc:
        raise ValidationError(f"'{field_name}' には有効な整数を指定してください。") from exc

    if num < min_val or num > max_val:
        raise ValidationError(f"'{field_name}' は {min_val} 以上 {max_val} 以下で指定してください。")
    return num


def to_non_empty_str(value: Any, field_name: str, max_length: int = 255) -> str:
    """非空文字列を検証して返す"""
    if not isinstance(value, str) or not value.strip():
        raise ValidationError(f"'{field_name}' は必須の文字列項目です。")
    cleaned = value.strip()
    if len(cleaned) > max_length:
        raise ValidationError(f"'{field_name}' は {max_length} 文字以内で指定してください。")
    return cleaned


def resolve_timestamp(recorded_at: Any = None) -> str:
    """
    ISO8601 UTC タイムスタンプ文字列を返す。
    未指定の場合は現在時刻 (UTC) を生成する。
    """
    if recorded_at and isinstance(recorded_at, str) and recorded_at.strip():
        raw = recorded_at.strip()
        try:
            # Z を +00:00 に置換して ISO8601 パース確認
            normalized = raw.replace("Z", "+00:00")
            dt = datetime.fromisoformat(normalized)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            else:
                dt = dt.astimezone(timezone.utc)
            return dt.strftime("%Y-%m-%dT%H:%M:%SZ")
        except ValueError as exc:
            raise ValidationError("'recordedAt' は ISO8601 形式 (例: 2026-11-10T12:00:00Z) で指定してください。") from exc

    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def build_sort_key(record_type: str, timestamp_str: str) -> Tuple[str, str]:
    """
    DynamoDB Sort Key (例: DIET#2026-11-10T12:00:00Z) を生成する
    """
    prefix = record_type.upper()
    sk = f"{prefix}#{timestamp_str}"
    return prefix, sk

