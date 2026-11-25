FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=5000 \
    DATABASE_PATH=/app/instance/management.db

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY app.py .
COPY templates ./templates
COPY static ./static

RUN mkdir -p /app/instance \
    && chown -R 10001:10001 /app

USER 10001:10001

EXPOSE 5000

VOLUME ["/app/instance"]

CMD ["sh", "-c", "exec gunicorn --bind 0.0.0.0:${PORT:-5000} --workers 1 --access-logfile - --error-logfile - app:app"]

