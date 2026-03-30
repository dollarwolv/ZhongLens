FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV PORT=8080
ENV PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK=True
ENV DET_MODEL_DIR=/app/models/PP-OCRv5_mobile_det
ENV REC_MODEL_DIR=/app/models/PP-OCRv5_mobile_rec

CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT}"]