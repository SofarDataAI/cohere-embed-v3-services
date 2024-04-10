FROM python:3.11-slim AS builder
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir --target=/app/dependencies -r requirements.txt

FROM python:3.11-slim AS runtime
WORKDIR /app
COPY --from=builder /app/dependencies /usr/local
COPY . .
EXPOSE 8090
CMD ["uvicorn", "index:app", "--host", "0.0.0.0", "--port", "8090"]