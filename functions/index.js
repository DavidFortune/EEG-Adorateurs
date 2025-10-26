const {https} = require('firebase-functions/v2');
const {logger} = require('firebase-functions/v2');
const {defineString} = require('firebase-functions/params');
const admin = require('firebase-admin');
const twilio = require('twilio');

// Define environment parameters for Twilio
const twilioAccountSid = defineString('TWILIO_ACCOUNT_SID', {default: ''});
const twilioAuthToken = defineString('TWILIO_AUTH_TOKEN', {default: ''});
const twilioPhoneNumber = defineString('TWILIO_PHONE_NUMBER', {default: ''});
const smsDevMode = defineString('SMS_DEV_MODE', {default: 'false'});

admin.initializeApp();

// Get Firestore instance with the correct database ID
// The database name is configured in firebase.json under firestore.database
const db = admin.firestore();
db.settings({databaseId: 'eeg-adorateurs-db'});

/**
 * Cloud Function to send SMS notifications via Twilio
 *
 * This function sends an SMS to notify users that a program is available.
 *
 * Expected request data:
 * {
 *   serviceId: string,      // The service ID
 *   serviceTitle: string,   // The title of the service
 *   serviceDate: string,    // The date of the service
 *   phoneNumbers: string[]  // Array of phone numbers to notify (E.164 format recommended)
 * }
 *
 * Environment variables required:
 * - TWILIO_ACCOUNT_SID: Your Twilio Account SID
 * - TWILIO_AUTH_TOKEN: Your Twilio Auth Token
 * - TWILIO_PHONE_NUMBER: Your Twilio phone number
 */
exports.sendProgramAvailableSMS = https.onCall(async (request) => {
  // Verify authentication
  if (!request.auth) {
    throw new https.HttpsError('unauthenticated', 'User must be authenticated to send SMS');
  }

  // Verify admin status
  logger.info(`Checking admin status for user ${request.auth.uid}`);

  // Find the member document by firebaseUserId
  const memberSnapshot = await db.collection('members')
    .where('firebaseUserId', '==', request.auth.uid)
    .limit(1)
    .get();

  if (memberSnapshot.empty) {
    logger.warn(`User document not found for ${request.auth.uid}`);
    throw new https.HttpsError('permission-denied', 'User profile not found. Please complete your profile first.');
  }

  const memberDoc = memberSnapshot.docs[0];
  const userData = memberDoc.data();

  logger.info(`User data for ${request.auth.uid}:`, {
    memberId: memberDoc.id,
    hasIsAdmin: 'isAdmin' in userData,
    isAdminValue: userData.isAdmin,
    email: request.auth.token.email
  });

  if (!userData.isAdmin) {
    throw new https.HttpsError('permission-denied', 'Only admins can send SMS notifications');
  }

  // Validate request data
  const {serviceId, serviceTitle, serviceDate, phoneNumbers, customNote, serviceUrl} = request.data;

  if (!serviceId || !serviceTitle || !serviceDate || !phoneNumbers || !Array.isArray(phoneNumbers)) {
    throw new https.HttpsError('invalid-argument', 'Missing or invalid required parameters: serviceId, serviceTitle, serviceDate, phoneNumbers');
  }

  if (phoneNumbers.length === 0) {
    throw new https.HttpsError('invalid-argument', 'Phone numbers array cannot be empty');
  }

  // Get Twilio credentials from environment parameters
  const accountSid = twilioAccountSid.value();
  const authToken = twilioAuthToken.value();
  const fromPhoneNumber = twilioPhoneNumber.value();
  const isDevelopment = smsDevMode.value() === 'true';

  if (!accountSid || !authToken || !fromPhoneNumber) {
    if (isDevelopment) {
      logger.warn('Twilio credentials not configured - running in DEVELOPMENT MODE');
      logger.warn('SMS messages will be logged but not sent');
    } else {
      logger.error('Twilio credentials not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER environment variables.');
      throw new https.HttpsError(
        'failed-precondition',
        'SMS service is not configured. Please contact the administrator to set up Twilio credentials.'
      );
    }
  }

  // Initialize Twilio client (only if credentials are available)
  const client = (accountSid && authToken) ? twilio(accountSid, authToken) : null;

  // Prepare SMS message
  let message = `Le programme du service "${serviceTitle}" du ${serviceDate} est maintenant disponible!`;

  // Add custom note if provided
  if (customNote && customNote.trim()) {
    message += `\n\n${customNote.trim()}`;
  }

  // Add service URL
  if (serviceUrl) {
    message += `\n\nConsultez-le ici: ${serviceUrl}`;
  }

  // Send SMS to all phone numbers
  const results = [];
  const errors = [];

  for (const phoneNumber of phoneNumbers) {
    try {
      // Format phone number if needed (ensure it starts with +)
      let formattedPhone = phoneNumber.trim();
      if (!formattedPhone.startsWith('+')) {
        // Assume North American number if no country code
        formattedPhone = `+1${formattedPhone.replace(/\D/g, '')}`;
      }

      if (isDevelopment || !client) {
        // Development mode - simulate SMS sending
        logger.info(`[DEV MODE] Would send SMS to ${formattedPhone}:`, {message});
        results.push({
          phoneNumber: formattedPhone,
          sid: `DEV_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          status: 'simulated'
        });
      } else {
        // Production mode - actually send SMS
        const result = await client.messages.create({
          body: message,
          from: fromPhoneNumber,
          to: formattedPhone
        });

        results.push({
          phoneNumber: formattedPhone,
          sid: result.sid,
          status: result.status
        });

        logger.info(`SMS sent successfully to ${formattedPhone}`, {sid: result.sid});
      }
    } catch (error) {
      logger.error(`Failed to send SMS to ${phoneNumber}`, {error: error.message});
      errors.push({
        phoneNumber,
        error: error.message
      });
    }
  }

  // Log summary
  logger.info(`SMS sending complete: ${results.length} successful, ${errors.length} failed`);

  return {
    success: true,
    sent: results.length,
    failed: errors.length,
    results,
    errors: errors.length > 0 ? errors : undefined
  };
});

/**
 * Helper function to get members with phone numbers for a service
 * This can be called before sending SMS to get the list of recipients
 */
exports.getServiceMembersPhones = https.onCall(async (request) => {
  // Verify authentication
  if (!request.auth) {
    throw new https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const {serviceId} = request.data;

  if (!serviceId) {
    throw new https.HttpsError('invalid-argument', 'Missing required parameter: serviceId');
  }

  try {
    logger.info(`Fetching assignments for service ${serviceId}`);

    // Get all assignments for this service
    const assignmentsSnapshot = await db
      .collection('assignments')
      .where('serviceId', '==', serviceId)
      .get();

    logger.info(`Found ${assignmentsSnapshot.docs.length} assignments for service ${serviceId}`);

    const memberIds = assignmentsSnapshot.docs.map(doc => doc.data().memberId);

    if (memberIds.length === 0) {
      logger.info(`No member IDs found for service ${serviceId}`);
      return {
        members: [],
        count: 0
      };
    }

    // Get unique member IDs and filter out invalid ones
    const uniqueMemberIds = [...new Set(memberIds)].filter(id => id && typeof id === 'string');

    if (uniqueMemberIds.length === 0) {
      return {
        members: [],
        count: 0
      };
    }

    // Get member details with error handling
    const memberPromises = uniqueMemberIds.map(async (id) => {
      try {
        return await db.collection('members').doc(id).get();
      } catch (error) {
        logger.warn(`Failed to fetch member ${id}`, {error: error.message});
        return null;
      }
    });

    const memberDocs = await Promise.all(memberPromises);

    const members = memberDocs
      .filter(doc => doc && doc.exists && doc.data()?.phone)
      .map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.fullName || `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'Unknown',
          phone: data.phone
        };
      });

    logger.info(`Found ${members.length} members with phone numbers for service ${serviceId}`);

    return {
      members,
      count: members.length
    };
  } catch (error) {
    logger.error('Error getting service members phones', {error: error.message, stack: error.stack});
    throw new https.HttpsError('internal', `Failed to retrieve member phone numbers: ${error.message}`);
  }
});
