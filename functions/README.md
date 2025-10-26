# Firebase Cloud Functions - EEG Adorateurs

This directory contains Firebase Cloud Functions for the EEG Adorateurs application.

## Functions

### sendProgramAvailableSMS

Sends SMS notifications via Twilio to inform users that a program is available for a service.

**Type:** Callable HTTPS Function (requires authentication)

**Authentication:** Requires user to be authenticated and have admin privileges

**Request Parameters:**
```javascript
{
  serviceId: string,      // The service ID
  serviceTitle: string,   // The title of the service
  serviceDate: string,    // The date of the service
  phoneNumbers: string[]  // Array of phone numbers (E.164 format recommended, e.g., +14385551234)
}
```

**Response:**
```javascript
{
  success: true,
  sent: number,           // Number of successful SMS
  failed: number,         // Number of failed SMS
  results: [{             // Array of successful sends
    phoneNumber: string,
    sid: string,         // Twilio message SID
    status: string       // Twilio message status
  }],
  errors: [{             // Array of failures (if any)
    phoneNumber: string,
    error: string
  }]
}
```

**Example Usage (from frontend):**
```javascript
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const sendProgramSMS = httpsCallable(functions, 'sendProgramAvailableSMS');

try {
  const result = await sendProgramSMS({
    serviceId: 'service123',
    serviceTitle: 'Culte du Dimanche',
    serviceDate: '7 janvier 2025',
    phoneNumbers: ['+14385551234', '+15145552345']
  });

  console.log(`SMS sent to ${result.data.sent} recipients`);
  if (result.data.failed > 0) {
    console.warn(`Failed to send to ${result.data.failed} recipients`);
  }
} catch (error) {
  console.error('Error sending SMS:', error);
}
```

### getServiceMembersPhones

Helper function to retrieve phone numbers of all members assigned to a service.

**Type:** Callable HTTPS Function (requires authentication)

**Request Parameters:**
```javascript
{
  serviceId: string  // The service ID
}
```

**Response:**
```javascript
{
  members: [{
    id: string,
    name: string,
    phone: string
  }],
  count: number
}
```

**Example Usage:**
```javascript
const getMembers = httpsCallable(functions, 'getServiceMembersPhones');

const result = await getMembers({ serviceId: 'service123' });
const phoneNumbers = result.data.members.map(m => m.phone);

// Then use these numbers with sendProgramAvailableSMS
```

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

#### Development Mode (Testing without Twilio)

For development and testing without sending real SMS, use the provided `.env.yaml` file:

```yaml
# SMS Development Mode - simulates SMS sending
SMS_DEV_MODE: "true"
```

This will log SMS messages to the console without actually sending them via Twilio.

#### Production Mode (Real SMS via Twilio)

Edit `.env.yaml` and configure your Twilio credentials:

```yaml
# Set to false or remove to enable real SMS
SMS_DEV_MODE: "false"

# Twilio Configuration
TWILIO_ACCOUNT_SID: "your_account_sid_here"
TWILIO_AUTH_TOKEN: "your_auth_token_here"
TWILIO_PHONE_NUMBER: "+1234567890"
```

**Note:** `.env.yaml` is gitignored to protect your credentials. Never commit this file with real credentials.

### 3. Get Twilio Credentials

1. Create a Twilio account at https://www.twilio.com
2. Get your Account SID and Auth Token from the Twilio Console
3. Purchase a phone number with SMS capabilities
4. Configure the credentials as shown above

### 4. Deploy Functions

```bash
npm run deploy
```

Or from project root:

```bash
firebase deploy --only functions
```

## Phone Number Format

Phone numbers should be in E.164 format for best results:
- Include country code: `+14385551234` (Canada/US)
- The function will attempt to format numbers automatically by adding +1 for North American numbers

## Testing

### Local Testing with Emulator

```bash
npm run serve
```

This starts the Firebase Functions emulator for local testing.

### Test Function Call

```javascript
// In your app, point to emulator
import { connectFunctionsEmulator } from 'firebase/functions';

if (location.hostname === 'localhost') {
  connectFunctionsEmulator(functions, 'localhost', 5001);
}
```

## Monitoring

View function logs:

```bash
npm run logs
```

Or:

```bash
firebase functions:log
```

## Error Handling

The function includes comprehensive error handling:
- Authentication verification
- Admin privilege verification
- Input validation
- Twilio API error handling
- Individual phone number failure tracking

Failed SMS sends are logged but don't prevent other sends from completing.

## Security

- Only authenticated admin users can call the function
- Twilio credentials are stored securely in Firebase environment configuration
- Individual send failures are tracked without exposing sensitive information

## Cost Considerations

- Twilio charges per SMS sent (typically $0.0075 per SMS for US/Canada)
- Firebase Functions have a free tier, then pay-as-you-go pricing
- Monitor usage in Twilio Console and Firebase Console

## Support

For issues or questions:
- Twilio Documentation: https://www.twilio.com/docs
- Firebase Functions Documentation: https://firebase.google.com/docs/functions
