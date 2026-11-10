"""
POST /records/diet : 食事記録（メニュー名、カロリー、PFC、食材内訳リスト）の登録ハンドラ
"""
from typing import Any, Dict, List
from utils.dynamodb import put_fitness_record
from utils.response import build_response
from utils.validator import (
    ValidationError,
    build_sort_key,
    parse_json_body,
    resolve_timestamp,
    to_decimal,
    to_int,
    to_non_empty_str,
)


def _validate_ingredients(raw_ingredients: Any) -> List[Dict[str, Any]]:
    """食材リスト (最大10品) のバリデーションと Decimal 変換を行う"""
    if raw_ingredients is None:
        return []
    if not isinstance(raw_ingredients, list):
        raise ValidationError("'ingredients' は配列形式で指定してください。")
    if len(raw_ingredients) > 10:
        raise ValidationError("'ingredients' は最大10品まで登録可能です。")

    validated: List[Dict[str, Any]] = []
    for idx, ing in enumerate(raw_ingredients):
        if not isinstance(ing, dict):
            raise ValidationError(f"'ingredients[{idx}]' はオブジェクト形式で指定してください。")
        name = to_non_empty_str(ing.get("name"), f"ingredients[{idx}].name", max_length=120)
        p = to_decimal(ing.get("protein", 0), f"ingredients[{idx}].protein", min_val=0.0, max_val=500.0)
        f = to_decimal(ing.get("fat", 0), f"ingredients[{idx}].fat", min_val=0.0, max_val=500.0)
        c = to_decimal(ing.get("carbs", 0), f"ingredients[{idx}].carbs", min_val=0.0, max_val=1000.0)
        raw_cal = ing.get("calories")
        cal = (
            to_int(raw_cal, f"ingredients[{idx}].calories", min_val=0, max_val=10000)
            if raw_cal is not None
            else int(round(float(p) * 4 + float(f) * 9 + float(c) * 4))
        )
        validated.append(
            {
                "name": name,
                "protein": p,
                "fat": f,
                "carbs": c,
                "calories": cal,
            }
        )
    return validated


def handle_post_diet(event: Dict[str, Any], user_id: str, table=None) -> Dict[str, Any]:
    """
    リクエストボディ例:
    {
      "menuName": "昼食: 鶏胸肉とブロッコリー",
      "calories": 420,
      "protein": 45.5,
      "fat": 8.2,
      "carbs": 35.0,
      "ingredients": [
        {"name": "鶏胸肉 150g", "protein": 33.0, "fat": 2.8, "carbs": 0.0, "calories": 157}
      ],
      "recordedAt": "2026-11-10T12:00:00Z" // 省略時は現在時刻
    }
    """
    body = parse_json_body(event)

    menu_name = to_non_empty_str(body.get("menuName"), "menuName", max_length=255)
    protein = to_decimal(body.get("protein"), "protein", min_val=0.0, max_val=1000.0)
    fat = to_decimal(body.get("fat"), "fat", min_val=0.0, max_val=1000.0)
    carbs = to_decimal(body.get("carbs"), "carbs", min_val=0.0, max_val=2000.0)
    ingredients = _validate_ingredients(body.get("ingredients"))

    # カロリーが省略された場合は PFC から自動算出 (P*4 + F*9 + C*4)
    raw_calories = body.get("calories")
    if raw_calories is None:
        calculated = int(round(float(protein) * 4 + float(fat) * 9 + float(carbs) * 4))
        calories = calculated
    else:
        calories = to_int(raw_calories, "calories", min_val=0, max_val=20000)

    recorded_at = resolve_timestamp(body.get("recordedAt"))
    record_type, sort_key = build_sort_key("DIET", recorded_at)

    item: Dict[str, Any] = {
        "userId": user_id,
        "recordKey": sort_key,
        "recordType": record_type,
        "recordedAt": recorded_at,
        "menuName": menu_name,
        "calories": calories,
        "protein": protein,
        "fat": fat,
        "carbs": carbs,
        "syncedToCold": False,
    }
    if ingredients:
        item["ingredients"] = ingredients

    put_fitness_record(item, table=table)
    return build_response(
        201,
        {
            "message": "食事記録を登録しました。",
            "record": item,
        },
    )
