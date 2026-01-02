from dotenv import load_dotenv
import os

load_dotenv()


def main():
    print("👋🏾 Hello from token-generator!")

    # pip install stream-chat
    import stream_chat

    server_client = stream_chat.StreamChat(
        api_key=os.getenv("API_KEY"), api_secret=os.getenv("API_SECRET")
    )
    token = server_client.create_token("john")
    print(f"Generated token: {token}")


if __name__ == "__main__":
    main()
