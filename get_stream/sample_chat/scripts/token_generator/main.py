import os
import stream_chat
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn

load_dotenv()

app = FastAPI(
    title="Stream Chat Token Generator",
    description="API for generating Stream Chat authentication tokens",
    version="0.1.0"
)

# Initialize Stream Chat client
API_KEY = os.getenv("API_KEY")
API_SECRET = os.getenv("API_SECRET")

if not API_KEY or not API_SECRET:
    raise ValueError("API_KEY and API_SECRET must be set in .env file")

server_client = stream_chat.StreamChat(api_key=API_KEY, api_secret=API_SECRET)

# Subscribe to all events (empty list = all events)
server_client.update_app_settings(
    event_hooks=[
        {
            "enabled": True,
            "hook_type": "webhook",
            "webhook_url": "https://indubitably-unimmediate-donna.ngrok-free.dev",
            "event_types": []  # empty list = all events
        }
    ]
)

class TokenRequest(BaseModel):
    user_id: str


class TokenResponse(BaseModel):
    token: str
    user_id: str


@app.get("/")
async def root():
    """Health check endpoint"""
    return {"status": "ok", "message": "Stream Chat Token Generator API"}


@app.post("/generate-token", response_model=TokenResponse)
async def generate_token(request: TokenRequest):
    """Generate a Stream Chat token for a given user ID"""
    try:
        token = server_client.create_token(request.user_id)
        return TokenResponse(token=token, user_id=request.user_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate token: {str(e)}")


@app.get("/generate-token/{user_id}", response_model=TokenResponse)
async def generate_token_get(user_id: str):
    """Generate a Stream Chat token for a given user ID (GET endpoint)"""
    try:
        token = server_client.create_token(user_id)
        return TokenResponse(token=token, user_id=user_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate token: {str(e)}")


if __name__ == "__main__":
    print("👋🏾 Starting Stream Chat Token Generator API...")
    print("📡 Server running on http://localhost:8001")
    print("📖 API docs available at http://localhost:8001/docs")
    uvicorn.run(app, host="0.0.0.0", port=8001)
