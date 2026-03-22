import pytest
from datetime import date

from app import guess_category, estimate_expiration_date, app

from unittest.mock import patch

def test_guess_category():
    assert guess_category("panasonic 冷蔵庫", "最新モデル") == "冷蔵庫"
    assert guess_category("単３形 電池", None) == "電池"
    assert guess_category("美味しい りんご", "新鮮な 食品 です") == "食品"

    assert guess_category("謎のアイテム", "説明文なし") == "その他"

def test_estimate_expiration_date():
    base_date = date(2026, 3, 22)

    result_alarm = estimate_expiration_date("火災警報器", base_date)
    assert result_alarm == date(2031, 3, 21) or result_alarm == date(2031, 3, 22)

    assert estimate_expiration_date("食品", base_date) == date(2026, 9, 18)


@pytest.fixture
def client():
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client

def test_health_endpoint(client):
    response = client.get("/health")

    assert response.status_code == 200

    assert response.get_json() == {"status": "ok"}

def test_estimate_missing_barcode(client):
    response = client.post("/api/estimate", json={"purchase_date": "2026-03-22"})

    assert response.status_code == 400
    assert "barcode is required" in response.get_json()["detail"]

@patch("app.requests.get")
@patch("app.requests.post")
def test_estimate_success_with_mock(mock_post, mock_get, client):
    mock_get.return_value.status_code = 200
    mock_get.return_value.json.return_value = {
        "hits": [
            {
                "name": "ダミーの美味しい水",
                "image": {"medium": "https://dummy.com/image.jpg"},
                "description": "ミネラルウォーターです",
                "parentGenreCategories": [{"name": "食品"}]
            }
        ]
    }

    mock_post.return_value.status_code = 200
    mock_post.return_value.json.return_value = {
        "candidates": [
            {
                    "content": {
                    "parts": [{"text": "食品の一般的な消費期限を考慮しました（モックAIより）"}]
                }
            }
        ]
    }
    
    response = client.post(
        "/api/estimate",
        json={"barcode": "4901234567890", "purchase_date": "2026-03-22"}
    )

    assert response.status_code == 200
    data = response.get_json()

    assert data["product_name"] == "ダミーの美味しい水"
    assert data["category"] == "食品"
    assert data["suggested_expiration"] == "2026-09-18"
    assert data["reason"] == "食品の一般的な消費期限を考慮しました（モックAIより）" 

    mock_get.assert_called_once()
    mock_post.assert_called_once()
