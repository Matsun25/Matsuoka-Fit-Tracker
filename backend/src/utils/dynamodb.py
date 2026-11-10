"""
DynamoDB アクセスレイヤー (FitnessRecords テーブル操作)
"""
import os
from typing import Any, Dict, List, Optional

try:
    import boto3
    from boto3.dynamodb.conditions import Key
except ImportError:  # pragma: no cover - ローカル環境で boto3 未導入時の単体テスト互換用
    boto3 = None  # type: ignore[assignment]

    class Key:  # type: ignore[no-redef]
        """boto3 未インストール環境向けの軽量 Key 条件ビルダ"""

        def __init__(self, name: str) -> None:
            self.name = name

        def eq(self, value: Any) -> "Key":
            return self

        def begins_with(self, value: Any) -> "Key":
            return self

        def __and__(self, other: Any) -> "Key":
            return self


def get_table():
    """環境変数 TABLE_NAME から DynamoDB Table リソースを取得する"""
    if boto3 is None:
        raise RuntimeError("boto3 がインストールされていません。")
    table_name = os.environ.get("TABLE_NAME", "FitnessRecords")
    dynamodb = boto3.resource("dynamodb")
    return dynamodb.Table(table_name)


def put_fitness_record(item: Dict[str, Any], table=None) -> Dict[str, Any]:
    """FitnessRecords テーブルに1件のレコードを保存する"""
    target_table = table or get_table()
    target_table.put_item(Item=item)
    return item


def query_user_records(
    user_id: str,
    record_type: Optional[str] = None,
    limit: int = 100,
    table=None,
) -> List[Dict[str, Any]]:
    """
    指定ユーザーの記録を取得する。
    - record_type ('DIET', 'WORKOUT', 'BODY') が指定された場合は begins_with でフィルタ。
    - 未指定の場合は全種別のレコードを取得し、recordedAt の降順でソートして返す。
    """
    target_table = table or get_table()

    key_condition = Key("userId").eq(user_id)
    if record_type:
        prefix = f"{record_type.upper()}#"
        key_condition = key_condition & Key("recordKey").begins_with(prefix)

    response = target_table.query(
        KeyConditionExpression=key_condition,
        ScanIndexForward=False,
        Limit=limit,
    )
    items: List[Dict[str, Any]] = response.get("Items", [])

    # recordedAt 降順で整列 (DIET#, WORKOUT#, BODY# 混在時にも最新順に並べるため)
    items.sort(key=lambda x: str(x.get("recordedAt", "")), reverse=True)
    return items[:limit]
