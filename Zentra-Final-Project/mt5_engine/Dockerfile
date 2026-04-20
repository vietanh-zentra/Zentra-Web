# Zentra MT5 Engine — Dockerfile
# NOTE: MT5 service MUST run on Windows (MetaTrader5 lib requires Windows)
# This Dockerfile is for reference only — production runs on Windows VPS with waitress
# For Linux testing without MT5 (mock mode), this can be used

FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt || \
    pip install --no-cache-dir flask flask-cors python-dotenv requests

COPY . .

# Environment
ENV MT5_SERVICE_PORT=5000
ENV LOG_LEVEL=INFO
ENV FLASK_DEBUG=false

EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:5000/health')" || exit 1

CMD ["python", "app_v2.py"]
