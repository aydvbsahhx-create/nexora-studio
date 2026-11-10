
import os
import re
import time
import requests

from pathlib import Path
from collections import defaultdict, deque
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv(dotenv_path=Path(__file__).with_name(".env"))

app = Flask(__name__)
CORS(app)

BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
CHAT_ID = os.getenv("TELEGRAM_CHAT_ID")

TELEGRAM_URL = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"

# Ограничение частоты заявок
request_history = defaultdict(deque)
RATE_LIMIT = 3
RATE_WINDOW = 600


def is_rate_limited(ip):
    now = time.time()
    history = request_history[ip]

    while history and now - history[0] > RATE_WINDOW:
        history.popleft()

    if len(history) >= RATE_LIMIT:
        return True

    history.append(now)
    return False


@app.route("/api/order", methods=["POST"])
def create_order():
    if not BOT_TOKEN or not CHAT_ID:
        return jsonify({
            "success": False,
            "error": "Server configuration error"
        }), 500

    data = request.get_json(silent=True) or {}

    # Honeypot: поле должно оставаться пустым
    if data.get("website"):
        return jsonify({"success": True}), 200

    ip = request.remote_addr or "unknown"

    if is_rate_limited(ip):
        return jsonify({
            "success": False,
            "error": "Слишком много заявок. Попробуйте позже."
        }), 429

    name = str(data.get("name", "")).strip()
    service = str(data.get("service", "")).strip()
    budget = str(data.get("budget", "")).strip()
    description = str(data.get("description", "")).strip()

    if not all([name, service, budget, description]):
        return jsonify({
            "success": False,
            "error": "Заполните все поля"
        }), 400

    if (
        len(name) > 80
        or len(service) > 100
        or len(budget) > 50
        or len(description) > 1500
    ):
        return jsonify({
            "success": False,
            "error": "Слишком длинные данные"
        }), 400

    name = re.sub(r"[\r\n\t]+", " ", name)
    service = re.sub(r"[\r\n\t]+", " ", service)
    budget = re.sub(r"[\r\n\t]+", " ", budget)

    message = (
        "🚀 НОВАЯ ЗАЯВКА — NEXORA STUDIO\n\n"
        f"👤 Имя: {name}\n"
        f"🛠 Услуга: {service}\n"
        f"💰 Бюджет: {budget}\n\n"
        f"📝 Описание:\n{description}"
    )

    try:
        response = requests.post(
            TELEGRAM_URL,
            json={
                "chat_id": CHAT_ID,
                "text": message
            },
            timeout=10
        )

        if not response.ok or not response.json().get("ok"):
            return jsonify({
                "success": False,
                "error": "Не удалось отправить заявку"
            }), 502

        return jsonify({
            "success": True,
            "message": "Заявка отправлена!"
        })

    except requests.RequestException:
        return jsonify({
            "success": False,
            "error": "Ошибка соединения"
        }), 502


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port, debug=False)
