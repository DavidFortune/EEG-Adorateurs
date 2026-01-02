# sample_chat

A Flutter chat application powered by [Stream Chat](https://getstream.io/chat/).

## Prerequisites

- Flutter SDK installed
- [uv](https://docs.astral.sh/uv/) (Python package manager) for token generation
- Stream Chat API credentials

## Setup & Running the App

### 1. Configure Stream Chat API Key

Create a JSON configuration file at `config/.env.dev.json` with your Stream Chat API key:

```json
{
  "STREAM_CHAT_API_KEY": "your_api_key_here"
}
```

Replace `your_api_key_here` with your actual API key from the [Stream Dashboard](https://dashboard.getstream.io/).

### 2. Generate User Token

Navigate to the token generator directory and run the script:

```bash
cd scripts/token_generator
uv run main.py
```

This will generate a JWT token for authenticating your user with Stream Chat.

### 3. Update User Token in Code

Open `lib/main.dart` and update the `userToken` constant with the token generated in step 2:

```dart
const userToken = 'your_generated_token_here';
```

### 4. Run the Application

From the project root, run Flutter with the configuration file:

```bash
flutter run --dart-define-from-file=config/.env.dev.json
```

**Important:** The `--dart-define-from-file` flag is required to load the API key at compile time.

## Troubleshooting

If you encounter any issues, please refer to [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for common problems and solutions.

## Resources

- [Stream Chat Flutter Documentation](https://getstream.io/chat/docs/sdk/flutter/)
- [Flutter Documentation](https://docs.flutter.dev/)
- [Stream Dashboard](https://dashboard.getstream.io/)
