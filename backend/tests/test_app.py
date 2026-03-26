### python -m pytest -v ###

import io
import pytest
from datetime import date
from app import guess_category, estimate_expiration_date, app, db, Task
from unittest.mock import patch
from collections import namedtuple

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
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    app.config["TESTING"] = True
    with app.test_client() as client:
        with app.app_context():
            
            db.create_all()
            yield client

            db.session.remove()
            db.drop_all()

def test_get_tasks_empty(client):
    response = client.get("/api/tasks")
    assert response.status_code == 200
    assert response.get_json() == []

def test_create_task_success(client):
    response = client.post("/api/tasks", json={"task_name": "ハッカソン"})

    assert response.status_code == 201
    data = response.get_json()
    assert data["task_name"] == "ハッカソン"
    assert data["task_is_done"] is False

def test_create_task_invalid(client):
    response = client.post("/api/tasks", json={"wrong_key": "テスト"})
    assert response.status_code == 400
    assert "detail" in response.get_json()

def task_change_task_done(client):
    post_response = client.post("/api/tasks", json={"task_name": "ヤッタスク"})
    task_id = post_response.get_json()["id"]

    put_response = client.put(f"/api/tasks/{task_id}/done")
    assert put_response.status_code == 200
    assert put_response.get_json()["task_is_done"] is True

def test_change_task_done_not_found(client):
    response = client.put("/api/tasks/999/done")
    assert response.status_code == 404


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

@patch("app.decode")
@patch("app.cv2.imdecode")
def test_scan_barcode_success(mock_imdecode, mock_decode, client):

    mock_imdecode.return_value = "dummy_image_array"

    Decoded = namedtuple("Decoded", ["data", "type"])
    mock_barcode = Decoded(data=b"4901234567890", type="EAN13")

    mock_decode.return_value = [mock_barcode]

    data = {
        "image": (io.BytesIO(b"fake_image_bytes"), "test.jpg")
    }
    response = client.post("/api/scan-barcode", data=data)

    assert response.status_code == 200
    json_data = response.get_json()
    assert json_data["barcode"] == "4901234567890"
    assert json_data["type"] == "EAN13"

def test_scan_barcode_no_file(client):
    response = client.post("/api/scan-barcode", data={})

    assert response.status_code == 400
    assert "image" in response.get_json()["detail"]

@patch("app.cv2.imdecode")
def test_scan_barcode_invalid_image(mock_imdecode, client):
    mock_imdecode.return_value = None

    data = {
        "image": (io.BytesIO(b"bad_data"), "test.txt")
    }
    response = client.post("/api/scan-barcode", data=data)

    assert response.status_code == 400
    assert "could not be loaded correctly" in response.get_json()["detail"]

@patch("app.decode")
@patch("app.cv2.imdecode")
def test_scan_barcode_no_barcode_found(mock_imdecode, mock_decode, client):
    mock_imdecode.return_value = "dummy_image_array"
    mock_decode.return_value = []

    data = {
        "image": (io.BytesIO(b"fake_image_bytes"), "test.jpg")
    }
    response = client.post("/api/scan-barcode", data=data)

    assert response.status_code == 404
    assert "not detected" in response.get_json()["detail"]
 