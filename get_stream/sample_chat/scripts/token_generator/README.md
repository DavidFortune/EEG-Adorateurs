# Stream Chat Token Generator API

FastAPI service for generating Stream Chat authentication tokens.

## Setup

1. Create a `.env` file with your Stream Chat credentials:

```env
API_KEY=your_stream_api_key
API_SECRET=your_stream_api_secret
```

2. Install dependencies:

```bash
uv sync
```

## Running the Server

Start the API server:

```bash
uv run python main.py
```

The server will run on **http://localhost:8001**

## API Endpoints

### Health Check

```bash
GET http://localhost:8001/
```

Response:
```json
{
  "status": "ok",
  "message": "Stream Chat Token Generator API"
}
```

### Generate Token (GET)

```bash
GET http://localhost:8001/generate-token/{user_id}
```

Example:
```bash
curl http://localhost:8001/generate-token/john
```

Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user_id": "john"
}
```

### Generate Token (POST)

```bash
POST http://localhost:8001/generate-token
Content-Type: application/json

{
  "user_id": "john"
}
```

Example:
```bash
curl -X POST http://localhost:8001/generate-token \
  -H "Content-Type: application/json" \
  -d '{"user_id": "john"}'
```

Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user_id": "john"
}
```

## Interactive API Documentation

FastAPI provides automatic interactive API documentation:

- **Swagger UI**: http://localhost:8001/docs
- **ReDoc**: http://localhost:8001/redoc

## Port

The service runs on port **8001** to avoid conflicts with common development ports (8000, 3000, etc.).