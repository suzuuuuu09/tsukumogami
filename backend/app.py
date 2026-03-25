import os
from datetime import date, timedelta

import cv2
import numpy as np
import requests
from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
from pyzbar.pyzbar import decode

from routes.tsukumogami import tsukumogami_bp

load_dotenv()

YAHOO_APP_ID = os.getenv("YAHOO_APP_ID")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
DEFAULT_YAHOO_ITEM_SEARCH_URL = (
    "https://shopping.yahooapis.jp/ShoppingWebService/V3/itemSearch"
)

app = Flask(__name__)
CORS(
    app,
    resources={
        r"/api/*": {
            "origins": "*",
            "methods": ["GET", "POST", "OPTIONS"],
            "allow_headers": ["Content-Type"],
        }
    },
)
app.register_blueprint(tsukumogami_bp)


class APIError(Exception):
    def __init__(self, status_code: int, detail: str) -> None:
        super().__init__(detail)
        self.status_code = status_code
        self.detail = detail


@app.errorhandler(APIError)
def handle_api_error(error: APIError):
    return jsonify({"detail": error.detail}), error.status_code


@app.errorhandler(404)
def handle_not_found(_error):
    return jsonify({"detail": "Not found"}), 404


@app.errorhandler(405)
def handle_method_not_allowed(_error):
    return jsonify({"detail": "Method not allowed"}), 405


@app.errorhandler(Exception)
def handle_unexpected_error(error: Exception):
    app.logger.exception("Unexpected error: %s", error)
    return jsonify({"detail": "Internal server error"}), 500


def parse_purchase_date(value: str | None) -> date:
    if not value:
        return date.today()

    try:
        return date.fromisoformat(value)
    except ValueError as exc:
        raise APIError(400, "purchase_date must be in YYYY-MM-DD format") from exc


def guess_category(product_name: str, product_description: str | None) -> str:
    text = f"{product_name or ''} {product_description or ''}".lower()
    mapping = [
        ("fire alarm", "火災警報器"),
        ("smoke detector", "火災警報器"),
        ("refrigerator", "冷蔵庫"),
        ("冷蔵庫", "冷蔵庫"),
        ("battery", "電池"),
        ("電池", "電池"),
        ("mask", "衛生用品"),
        ("マスク", "衛生用品"),
        ("cleaner", "掃除用品"),
        ("カメラ", "家電"),
        ("テレビ", "家電"),
        ("food", "食品"),
        ("食品", "食品"),
    ]
    for keyword, category in mapping:
        if keyword in text:
            return category
    return "その他"


def estimate_expiration_date(category: str, purchase_date: date) -> date:
    if "火災警報器" in category:
        return purchase_date + timedelta(days=5 * 365)
    if "冷蔵庫" in category:
        return purchase_date + timedelta(days=8 * 365)
    if "電池" in category:
        return purchase_date + timedelta(days=3 * 365)
    if "食品" in category:
        return purchase_date + timedelta(days=180)
    if "衛生用品" in category:
        return purchase_date + timedelta(days=365)
    return purchase_date + timedelta(days=2 * 365)


def get_yahoo_item(jan_code: str, request_url: str | None = None) -> dict:
    if not YAHOO_APP_ID:
        raise APIError(500, "YAHOO_APP_ID is not set in environment")

    url = (request_url or DEFAULT_YAHOO_ITEM_SEARCH_URL).strip()
    if not url.startswith("https://shopping.yahooapis.jp/"):
        raise APIError(400, "request_url must be a Yahoo Shopping API domain")

    response = requests.get(
        url,
        params={
            "appid": YAHOO_APP_ID,
            "jan_code": jan_code,
            "results": 1,
        },
        timeout=10,
    )
    if response.status_code != 200:
        raise APIError(502, f"Yahoo API error: {response.status_code}")

    data = response.json()
    hits = data.get("hits", [])
    if not hits:
        raise APIError(404, "No Yahoo Shopping item was found for the barcode")

    return hits[0]


### added ###
def decode_barcode_from_image(file) -> dict:
    file_bytes = np.frombuffer(file.read(), np.uint8)
    img = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)

    if img is None:
        raise APIError(
            400,
            "The image could not be loaded correctly. Please check the image format",
        )

    barcodes = decode(img)
    if not barcodes:
        raise APIError(404, "Barcode is not detected from the image")

    barcode_data = barcodes[0].data.decode("utf-8")
    barcode_type = barcodes[0].type

    return {"barcode": barcode_data, "type": barcode_type}


### added ###


def infer_deadline_reason(
    product_name: str,
    category: str,
    purchase_date: date,
    expiration_date: date,
) -> str:
    if GEMINI_API_KEY:
        try:
            prompt = (
                "次の商品について、交換期限の目安とした理由を日本語で80文字以内で簡潔に説明してください。"
                f" 商品名: {product_name}, カテゴリ: {category}, 購入日: {purchase_date}, "
                f"推定交換期限: {expiration_date}"
            )
            response = requests.post(
                (
                    "https://generativelanguage.googleapis.com/v1beta/models/"
                    f"gemini-2.0-flash:generateContent?key={GEMINI_API_KEY}"
                ),
                headers={"Content-Type": "application/json"},
                json={
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {
                        "temperature": 0.2,
                        "maxOutputTokens": 120,
                    },
                },
                timeout=12,
            )
            if response.status_code == 200:
                result = response.json()
                candidates = result.get("candidates", [])
                if candidates and isinstance(candidates[0], dict):
                    content = candidates[0].get("content", {})
                    parts = (
                        content.get("parts", []) if isinstance(content, dict) else []
                    )
                    text = " ".join(
                        part.get("text", "")
                        for part in parts
                        if isinstance(part, dict) and part.get("text")
                    ).strip()
                    if text:
                        return text
        except Exception:
            pass

    return (
        f"{category}の一般的な交換目安を基準に、購入日 {purchase_date.isoformat()} から "
        f"{expiration_date.isoformat()} を推定交換期限としました。"
    )


@app.get("/")
def root():
    return jsonify({"message": "Flask backend is running"})


@app.get("/health")
def health():
    return jsonify({"status": "ok"})


@app.post("/api/estimate")
def estimate():
    payload = request.get_json(silent=True) or {}

    barcode = str(payload.get("barcode", "")).strip().replace("-", "").replace(" ", "")
    if not barcode.isdigit() or len(barcode) < 8:
        raise APIError(400, "A valid barcode is required")

    purchase_date = parse_purchase_date(payload.get("purchase_date"))
    request_url = payload.get("request_url")

    jan_code = barcode[-13:]
    if len(jan_code) not in {8, 12, 13}:
        jan_code = barcode

    try:
        item = get_yahoo_item(jan_code, request_url)
    except APIError:
        raise
    except Exception as exc:
        raise APIError(500, f"Failed to retrieve product information: {exc}") from exc

    product_name = item.get("name") or "未取得の商品"
    image_obj = item.get("image", {}) if isinstance(item.get("image"), dict) else {}
    product_image = image_obj.get("medium") or image_obj.get("small")
    genre_text = " ".join(
        genre.get("name", "")
        for genre in item.get("parentGenreCategories", [])
        if isinstance(genre, dict)
    )
    description = item.get("description", "")
    category = guess_category(product_name, f"{description} {genre_text}")
    suggested_expiration = estimate_expiration_date(category, purchase_date)
    reason = infer_deadline_reason(
        product_name, category, purchase_date, suggested_expiration
    )

    return jsonify(
        {
            "product_name": product_name,
            "product_image": product_image,
            "category": category,
            "suggested_expiration": suggested_expiration.isoformat(),
            "reason": reason,
        }
    )


### added ###
@app.post("/api/scan-barcode")  # あとで決める
def scan_barcode():
    if "image" not in request.files:
        raise APIError(400, "Not included the 'image' key")

    file = request.files["image"]

    try:
        result = decode_barcode_from_image(file)
    except APIError:
        raise
    except Exception as exc:
        raise APIError(500, f"An unexpected error has occurred: {exc}") from exc

    return jsonify(result)


### added ###

if __name__ == "__main__":
    port = int(os.getenv("PORT", "5002"))
    app.run(host="0.0.0.0", port=port, debug=True)
