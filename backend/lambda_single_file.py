"""
Diet & Training Tracker - 単一ファイル AWS Lambda ハンドラ (AWS コンソール直接貼り付けにも対応)
エンドポイント:
  - GET  /records
  - POST /records/diet
  - POST /records/workout
  - POST /records/body
"""
import json
import logging
import os
from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation
from typing import Any, Dict, List, Optional
import boto3
from boto3.dynamodb.conditions import Key

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

TABLE_NAME = os.environ.get("TABLE_NAME", "FitnessRecords")
ALLOWED_ORIGIN = os.environ.get("ALLOWED_ORIGIN", "*")


class DecimalEncoder(json.JSONEncoder):
    def default(self, obj: Any) -> Any:
        if isinstance(obj, Decimal):
            return int(obj) if obj % 1 == 0 else float(obj)
        return super().default(obj)


def build_response(status_code: int, body: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json; charset=utf-8",
            "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
            "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token",
            "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
        },
        "body": json.dumps(body, cls=DecimalEncoder, ensure_ascii=False),
    }


def get_user_id(event: Dict[str, Any]) -> Optional[str]:
    rc = event.get("requestContext", {})
    auth = rc.get("authorizer", {})
    claims = auth.get("jwt", {}).get("claims", {}) or auth.get("claims", {})
    if "sub" in claims:
        return str(claims["sub"])
    return None


def resolve_timestamp(recorded_at: Any = None) -> str:
    if recorded_at and isinstance(recorded_at, str) and recorded_at.strip():
        try:
            dt = datetime.fromisoformat(recorded_at.strip().replace("Z", "+00:00"))
            dt = dt.replace(tzinfo=timezone.utc) if dt.tzinfo is None else dt.astimezone(timezone.utc)
            return dt.strftime("%Y-%m-%dT%H:%M:%SZ")
        except ValueError:
            pass
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def to_dec(val: Any, default: str = "0") -> Decimal:
    try:
        return Decimal(str(val if val is not None else default))
    except (InvalidOperation, ValueError, TypeError):
        return Decimal(default)


def lambda_handler(event: Dict[str, Any], context: Any = None) -> Dict[str, Any]:
    rc = event.get("requestContext", {})
    http_info = rc.get("http", {})
    method = (http_info.get("method") or event.get("httpMethod") or "").upper()
    raw_path = event.get("rawPath") or event.get("path") or ""

    stage = rc.get("stage")
    if stage and raw_path.startswith(f"/{stage}/"):
        raw_path = raw_path[len(stage) + 1 :]
    path = raw_path.rstrip("/") or "/"

    if method == "OPTIONS":
        return build_response(200, {"message": "OK"})

    user_id = get_user_id(event)
    if not user_id:
        return build_response(401, {"error": "Unauthorized", "message": "Invalid or missing Cognito JWT"})

    dynamodb = boto3.resource("dynamodb")
    table = dynamodb.Table(TABLE_NAME)

    try:
        # 1. GET /records
        if method == "GET" and path.endswith("/records"):
            q = event.get("queryStringParameters") or {}
            rec_type = (q.get("type") or "").strip().upper()
            limit = min(500, max(1, int(q.get("limit", 200))))

            key_cond = Key("userId").eq(user_id)
            if rec_type in {"DIET", "WORKOUT", "BODY"}:
                key_cond = key_cond & Key("recordKey").begins_with(f"{rec_type}#")

            resp = table.query(KeyConditionExpression=key_cond, ScanIndexForward=False, Limit=limit)
            items: List[Dict[str, Any]] = resp.get("Items", [])
            items.sort(key=lambda x: str(x.get("recordedAt", "")), reverse=True)
            return build_response(200, {"records": items[:limit], "count": len(items[:limit])})

        body = json.loads(event.get("body") or "{}")
        recorded_at = resolve_timestamp(body.get("recordedAt"))

        # 2. POST /records/diet
        if method == "POST" and path.endswith("/records/diet"):
            p = to_dec(body.get("protein"), "0")
            f = to_dec(body.get("fat"), "0")
            c = to_dec(body.get("carbs"), "0")
            raw_cal = body.get("calories")
            calories = int(raw_cal) if raw_cal is not None else int(round(float(p) * 4 + float(f) * 9 + float(c) * 4))

            item: Dict[str, Any] = {
                "userId": user_id,
                "recordKey": f"DIET#{recorded_at}",
                "recordType": "DIET",
                "recordedAt": recorded_at,
                "menuName": str(body.get("menuName") or "食事記録").strip(),
                "calories": calories,
                "protein": p,
                "fat": f,
                "carbs": c,
                "syncedToCold": False,
            }
            if isinstance(body.get("ingredients"), list):
                ing_list = []
                for ing in body["ingredients"][:10]:
                    ip = to_dec(ing.get("protein"), "0")
                    if_ = to_dec(ing.get("fat"), "0")
                    ic = to_dec(ing.get("carbs"), "0")
                    ical = int(ing.get("calories", round(float(ip) * 4 + float(if_) * 9 + float(ic) * 4)))
                    ing_list.append({"name": str(ing.get("name", "")), "protein": ip, "fat": if_, "carbs": ic, "calories": ical})
                item["ingredients"] = ing_list

            table.put_item(Item=item)
            return build_response(201, {"message": "食事記録を登録しました。", "record": item})

        # 3. POST /records/workout
        if method == "POST" and path.endswith("/records/workout"):
            item = {
                "userId": user_id,
                "recordKey": f"WORKOUT#{recorded_at}",
                "recordType": "WORKOUT",
                "recordedAt": recorded_at,
                "workoutName": str(body.get("workoutName") or "トレーニング").strip(),
                "weight": to_dec(body.get("weight"), "0"),
                "reps": int(body.get("reps", 1)),
                "sets": int(body.get("sets", 1)),
                "syncedToCold": False,
            }
            table.put_item(Item=item)
            return build_response(201, {"message": "トレーニング記録を登録しました。", "record": item})

        # 4. POST /records/body
        if method == "POST" and path.endswith("/records/body"):
            item = {
                "userId": user_id,
                "recordKey": f"BODY#{recorded_at}",
                "recordType": "BODY",
                "recordedAt": recorded_at,
                "bodyWeight": to_dec(body.get("bodyWeight"), "60"),
                "syncedToCold": False,
            }
            if body.get("bodyFatPercentage") is not None and body.get("bodyFatPercentage") != "":
                item["bodyFatPercentage"] = to_dec(body.get("bodyFatPercentage"))
            table.put_item(Item=item)
            return build_response(201, {"message": "体組成記録を登録しました。", "record": item})

        return build_response(404, {"error": "NotFound", "message": f"Route not found: {method} {path}"})
    except Exception as exc:  # pylint: disable=broad-except
        logger.exception("Error: %s", exc)
        return build_response(500, {"error": "InternalServerError", "message": str(exc)})

