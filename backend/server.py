
import os
import re
import time
import requests

from pathlib import Path
from collections import defaultdict, deque
from flask import Flask, request, jsonify, send_file
from dotenv import load_dotenv

# Пути проекта
BASE_DIR = Path(__file__).resolve().parent.parent
BACKEND_DIR = Path(__file__).resolve().parent

# Загрузка секретных переменных
load_dotenv(dotenv_path=BACKEND_DIR / ".env")

app = Flask(__name__)

BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
CHAT_ID = os.getenv("TELEGRAM_CHAT_ID")

TELEGRAM_URL = (
    f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
)

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


# Главная страница
@app.route("/")
def home():
    return send_file(BASE_DIR / "index.html")


# CSS
@app.route("/style.css")
def stylesheet():
    return send_file(BASE_DIR / "style.css")


# JavaScript
@app.route("/script.js")
def javascript():
    return send_file(BASE_DIR / "script.js")
@app.route("/projects/dashboard")
def dashboard():
    return send_file(
        BASE_DIR / "projects" / "dashboard" / "index.html"
    )
@app.route("/projects/telegram-bot")
def telegram_bot():
    return send_file(
        BASE_DIR / "projects" / "tg bot" / "index.html"
    )
    @app.route("/projects/business-website")
def business_website():
    return send_file(
        BASE_DIR / "projects" / "business-website" / "index.html"
    )
    @app.route("/projects/business-website")
def business_website():
    return send_file(
        BASE_DIR / "projects" / "business-website" / "index.html"
    )
# Отправка заявки в Telegram
@app.route("/api/order", methods=["POST"])
def create_order():

    if not BOT_TOKEN or not CHAT_ID:
        return jsonify({
            "success": False,
            "error": "Server configuration error"
        }), 500

    data = request.get_json(silent=True) or {}

    # Honeypot
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


# Проверка работы сервера
@app.route("/api/health")
def health():
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port, debug=False)
