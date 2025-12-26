const {https} = require('firebase-functions/v2');
const {onObjectFinalized} = require('firebase-functions/v2/storage');
const {logger} = require('firebase-functions/v2');
const {defineString} = require('firebase-functions/params');
const admin = require('firebase-admin');
const twilio = require('twilio');
const sharp = require('sharp');
const path = require('path');
const os = require('os');

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
 * Send availability request SMS to members
 * Can target all members, a specific team, or specific members
 */
exports.sendAvailabilityRequestSMS = https.onCall(async (request) => {
  // Verify authentication
  if (!request.auth) {
    throw new https.HttpsError('unauthenticated', 'User must be authenticated to send SMS');
  }

  // Verify admin status
  logger.info(`Checking admin status for user ${request.auth.uid}`);

  const memberSnapshot = await db.collection('members')
    .where('firebaseUserId', '==', request.auth.uid)
    .limit(1)
    .get();

  if (memberSnapshot.empty) {
    logger.warn(`User document not found for ${request.auth.uid}`);
    throw new https.HttpsError('permission-denied', 'User profile not found.');
  }

  const memberDoc = memberSnapshot.docs[0];
  const userData = memberDoc.data();

  if (!userData.isAdmin) {
    throw new https.HttpsError('permission-denied', 'Only admins can send availability requests');
  }

  // Validate request data
  const {recipientType, teamId, memberIds, customMessage, url} = request.data;

  if (!recipientType || !url) {
    throw new https.HttpsError('invalid-argument', 'Missing required fields');
  }

  // Get phone numbers based on recipient type
  let phoneNumbers = [];

  if (recipientType === 'all') {
    // Get all members with phone numbers
    const membersSnapshot = await db.collection('members')
      .where('phone', '!=', null)
      .get();

    phoneNumbers = membersSnapshot.docs
      .map(doc => doc.data().phone)
      .filter(phone => phone && phone.trim() !== '');
  } else if (recipientType === 'team') {
    if (!teamId) {
      throw new https.HttpsError('invalid-argument', 'Team ID required for team recipients');
    }

    // Get team members with phone numbers
    const membersSnapshot = await db.collection('members')
      .where('teams', 'array-contains', teamId)
      .where('phone', '!=', null)
      .get();

    phoneNumbers = membersSnapshot.docs
      .map(doc => doc.data().phone)
      .filter(phone => phone && phone.trim() !== '');
  } else if (recipientType === 'specific') {
    if (!memberIds || memberIds.length === 0) {
      throw new https.HttpsError('invalid-argument', 'Member IDs required for specific recipients');
    }

    // Get specific members' phone numbers
    const memberPromises = memberIds.map(async (id) => {
      try {
        const doc = await db.collection('members').doc(id).get();
        return doc.exists && doc.data().phone ? doc.data().phone : null;
      } catch (error) {
        logger.warn(`Failed to fetch member ${id}`);
        return null;
      }
    });

    const phones = await Promise.all(memberPromises);
    phoneNumbers = phones.filter(phone => phone && phone.trim() !== '');
  }

  if (phoneNumbers.length === 0) {
    throw new https.HttpsError('invalid-argument', 'No phone numbers found for recipients');
  }

  // Get Twilio credentials
  const accountSid = twilioAccountSid.value();
  const authToken = twilioAuthToken.value();
  const fromPhoneNumber = twilioPhoneNumber.value();
  const isDevelopment = smsDevMode.value() === 'true';

  if (!accountSid || !authToken || !fromPhoneNumber) {
    if (isDevelopment) {
      logger.warn('Twilio credentials not configured - running in DEVELOPMENT MODE');
    } else {
      throw new https.HttpsError('failed-precondition', 'SMS service is not configured');
    }
  }

  const client = (accountSid && authToken) ? twilio(accountSid, authToken) : null;

  // Prepare SMS message
  let message = 'Demande de disponibilités';

  if (customMessage && customMessage.trim()) {
    message += `\n\n${customMessage.trim()}`;
  }

  message += `\n\n${url}`;

  logger.info(`Sending availability request SMS to ${phoneNumbers.length} recipients`);

  // Send SMS to all phone numbers
  const results = [];
  const errors = [];

  for (const phoneNumber of phoneNumbers) {
    try {
      let formattedPhone = phoneNumber.trim();
      if (!formattedPhone.startsWith('+')) {
        formattedPhone = `+1${formattedPhone.replace(/\D/g, '')}`;
      }

      if (isDevelopment || !client) {
        logger.info(`[DEV MODE] Would send availability SMS to ${formattedPhone}:`, {message});
        results.push({
          phoneNumber: formattedPhone,
          sid: `DEV_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          status: 'simulated'
        });
      } else {
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

        logger.info(`Availability SMS sent successfully to ${formattedPhone}`, {sid: result.sid});
      }
    } catch (error) {
      logger.error(`Failed to send SMS to ${phoneNumber}`, {error: error.message});
      errors.push({
        phoneNumber,
        error: error.message
      });
    }
  }

  logger.info(`Availability SMS sending complete: ${results.length} successful, ${errors.length} failed`);

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

/**
 * Get all members with phone numbers
 */
exports.getAllMembersPhones = https.onCall(async (request) => {
  if (!request.auth) {
    throw new https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  try {
    const membersSnapshot = await db.collection('members')
      .where('phone', '!=', null)
      .get();

    const members = membersSnapshot.docs
      .filter(doc => doc.data().phone && doc.data().phone.trim() !== '')
      .map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.fullName || `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'Unknown',
          phone: data.phone
        };
      });

    return {
      members,
      count: members.length
    };
  } catch (error) {
    logger.error('Error getting all members phones', {error: error.message});
    throw new https.HttpsError('internal', 'Failed to retrieve members');
  }
});

/**
 * Get all teams
 */
exports.getTeams = https.onCall(async (request) => {
  if (!request.auth) {
    throw new https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  try {
    const teamsSnapshot = await db.collection('teams').get();

    const teams = teamsSnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name
    }));

    return {
      teams
    };
  } catch (error) {
    logger.error('Error getting teams', {error: error.message});
    throw new https.HttpsError('internal', 'Failed to retrieve teams');
  }
});

/**
 * Get team members count with phone numbers
 */
exports.getTeamMembersPhones = https.onCall(async (request) => {
  if (!request.auth) {
    throw new https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const {teamId} = request.data;

  if (!teamId) {
    throw new https.HttpsError('invalid-argument', 'Team ID is required');
  }

  try {
    const membersSnapshot = await db.collection('members')
      .where('teams', 'array-contains', teamId)
      .where('phone', '!=', null)
      .get();

    const count = membersSnapshot.docs.filter(doc =>
      doc.data().phone && doc.data().phone.trim() !== ''
    ).length;

    return {
      count
    };
  } catch (error) {
    logger.error('Error getting team members phones', {error: error.message});
    throw new https.HttpsError('internal', 'Failed to retrieve team members');
  }
});

// Export YouTube search functions
const youtubeSearch = require('./youtube-search');
exports.searchYouTube = youtubeSearch.searchYouTube;
exports.getVideoMetadata = youtubeSearch.getVideoMetadata;
exports.createResourceFromYouTube = youtubeSearch.createResourceFromYouTube;

// Export media migration functions
const mediaMigration = require('./media-migration');
exports.migrateMediaMetadata = mediaMigration.migrateMediaMetadata;

/**
 * Import music styles into resource_options collection
 * This is a one-time admin function to seed the database
 */
exports.importMusicStyles = https.onCall(async (request) => {
  // Verify authentication
  if (!request.auth) {
    throw new https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  // Verify admin status
  const memberSnapshot = await db.collection('members')
    .where('firebaseUserId', '==', request.auth.uid)
    .limit(1)
    .get();

  if (memberSnapshot.empty) {
    throw new https.HttpsError('permission-denied', 'User profile not found.');
  }

  const userData = memberSnapshot.docs[0].data();
  if (!userData.isAdmin) {
    throw new https.HttpsError('permission-denied', 'Only admins can import data');
  }

  // Music styles data
  const musicStyles = [
    {id: 'worship_contemporain', name: 'Worship contemporain', order: 1},
    {id: 'worship_acoustique', name: 'Worship acoustique', order: 2},
    {id: 'hymnes_traditionnels', name: 'Hymnes traditionnels', order: 3},
    {id: 'hymnes_modernises', name: 'Hymnes modernisés', order: 4},
    {id: 'gospel_traditionnel', name: 'Gospel traditionnel', order: 5},
    {id: 'gospel_contemporain', name: 'Gospel contemporain', order: 6},
    {id: 'gospel_choeur', name: 'Gospel chœur', order: 7},
    {id: 'southern_gospel', name: 'Southern gospel', order: 8},
    {id: 'ccm', name: 'CCM (Contemporary Christian Music)', order: 9},
    {id: 'pop_chretien', name: 'Pop chrétien', order: 10},
    {id: 'rock_chretien', name: 'Rock chrétien', order: 11},
    {id: 'soft_rock', name: 'Soft rock / Ballade', order: 12},
    {id: 'kompa', name: 'Kompa', order: 13},
    {id: 'reggae', name: 'Reggae', order: 14},
    {id: 'zouk', name: 'Zouk', order: 15},
    {id: 'calypso_soca', name: 'Calypso / Soca', order: 16},
    {id: 'afro_gospel', name: 'Afro-gospel', order: 17},
    {id: 'afrobeat', name: 'Afrobeat', order: 18},
    {id: 'makossa', name: 'Makossa', order: 19},
    {id: 'rumba_congolaise', name: 'Rumba congolaise', order: 20},
    {id: 'coupe_decale', name: 'Coupé-décalé', order: 21},
    {id: 'latin_salsa', name: 'Latin / Salsa', order: 22},
    {id: 'bachata', name: 'Bachata', order: 23},
    {id: 'cumbia', name: 'Cumbia', order: 24},
    {id: 'bresilien', name: 'Musique brésilienne', order: 25},
    {id: 'rnb_soul', name: 'R&B / Soul', order: 26},
    {id: 'jazz', name: 'Jazz', order: 27},
    {id: 'folk_acoustique', name: 'Folk / Acoustique', order: 28},
    {id: 'electro_edm', name: 'Électro / EDM', order: 29},
    {id: 'hiphop_rap', name: 'Hip-hop / Rap chrétien', order: 30},
    {id: 'country_gospel', name: 'Country gospel', order: 31},
    {id: 'classique_orchestral', name: 'Classique / Orchestral', order: 32},
    {id: 'a_cappella', name: 'A cappella', order: 33},
    {id: 'gregorien_liturgique', name: 'Chant grégorien / Liturgique', order: 34},
    {id: 'enfants', name: 'Chants pour enfants', order: 35},
    {id: 'meditation_instrumental', name: 'Méditation / Instrumental', order: 36},
    {id: 'noel', name: 'Chants de Noël', order: 37},
    {id: 'paques', name: 'Chants de Pâques', order: 38}
  ];

  try {
    // Check if document already exists
    const docRef = db.collection('resource_options').doc('music_styles');
    const docSnapshot = await docRef.get();

    if (docSnapshot.exists) {
      logger.info('Music styles document already exists, skipping import');
      return {
        success: true,
        alreadyExists: true,
        count: 0,
        message: 'Music styles already exist in the database'
      };
    }

    // Create the music_styles document in resource_options collection
    // Store the array directly at the document level
    await docRef.set({
      items: musicStyles,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: request.auth.uid
    });

    logger.info(`Successfully imported ${musicStyles.length} music styles`);

    return {
      success: true,
      alreadyExists: false,
      count: musicStyles.length,
      message: `Successfully imported ${musicStyles.length} music styles`
    };
  } catch (error) {
    logger.error('Error importing music styles', {error: error.message});
    throw new https.HttpsError('internal', `Failed to import music styles: ${error.message}`);
  }
});

/**
 * Import music keys into resource_options collection
 * This is a one-time admin function to seed the database
 */
exports.importMusicKeys = https.onCall(async (request) => {
  // Verify authentication
  if (!request.auth) {
    throw new https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  // Verify admin status
  const memberSnapshot = await db.collection('members')
    .where('firebaseUserId', '==', request.auth.uid)
    .limit(1)
    .get();

  if (memberSnapshot.empty) {
    throw new https.HttpsError('permission-denied', 'User profile not found.');
  }

  const userData = memberSnapshot.docs[0].data();
  if (!userData.isAdmin) {
    throw new https.HttpsError('permission-denied', 'Only admins can import data');
  }

  // Music keys data
  const musicKeys = [
    {id: 'c', name: 'C', order: 1},
    {id: 'cm', name: 'Cm', order: 2},
    {id: 'db', name: 'Db', order: 3},
    {id: 'dbm', name: 'Dbm', order: 4},
    {id: 'd', name: 'D', order: 5},
    {id: 'dm', name: 'Dm', order: 6},
    {id: 'eb', name: 'Eb', order: 7},
    {id: 'ebm', name: 'Ebm', order: 8},
    {id: 'e', name: 'E', order: 9},
    {id: 'em', name: 'Em', order: 10},
    {id: 'f', name: 'F', order: 11},
    {id: 'fm', name: 'Fm', order: 12},
    {id: 'gb', name: 'Gb', order: 13},
    {id: 'gbm', name: 'Gbm', order: 14},
    {id: 'g', name: 'G', order: 15},
    {id: 'gm', name: 'Gm', order: 16},
    {id: 'ab', name: 'Ab', order: 17},
    {id: 'abm', name: 'Abm', order: 18},
    {id: 'a', name: 'A', order: 19},
    {id: 'am', name: 'Am', order: 20},
    {id: 'bb', name: 'Bb', order: 21},
    {id: 'bbm', name: 'Bbm', order: 22},
    {id: 'b', name: 'B', order: 23},
    {id: 'bm', name: 'Bm', order: 24}
  ];

  try {
    // Check if document already exists
    const docRef = db.collection('resource_options').doc('music_keys');
    const docSnapshot = await docRef.get();

    if (docSnapshot.exists) {
      logger.info('Music keys document already exists, skipping import');
      return {
        success: true,
        alreadyExists: true,
        count: 0,
        message: 'Music keys already exist in the database'
      };
    }

    // Create the music_keys document in resource_options collection
    await docRef.set({
      items: musicKeys,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: request.auth.uid
    });

    logger.info(`Successfully imported ${musicKeys.length} music keys`);

    return {
      success: true,
      alreadyExists: false,
      count: musicKeys.length,
      message: `Successfully imported ${musicKeys.length} music keys`
    };
  } catch (error) {
    logger.error('Error importing music keys', {error: error.message});
    throw new https.HttpsError('internal', `Failed to import music keys: ${error.message}`);
  }
});

/**
 * Import music beats into resource_options collection
 * This is a one-time admin function to seed the database
 */
exports.importMusicBeats = https.onCall(async (request) => {
  // Verify authentication
  if (!request.auth) {
    throw new https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  // Verify admin status
  const memberSnapshot = await db.collection('members')
    .where('firebaseUserId', '==', request.auth.uid)
    .limit(1)
    .get();

  if (memberSnapshot.empty) {
    throw new https.HttpsError('permission-denied', 'User profile not found.');
  }

  const userData = memberSnapshot.docs[0].data();
  if (!userData.isAdmin) {
    throw new https.HttpsError('permission-denied', 'Only admins can import data');
  }

  // Music beats data
  const musicBeats = [
    {id: '4_4', name: '4/4', order: 1},
    {id: '6_8', name: '6/8', order: 2},
    {id: '3_4', name: '3/4', order: 3},
    {id: '12_8', name: '12/8', order: 4},
    {id: '2_4', name: '2/4', order: 5},
    {id: '2_2', name: '2/2', order: 6},
    {id: '6_4', name: '6/4', order: 7},
    {id: '9_8', name: '9/8', order: 8},
    {id: '5_4', name: '5/4', order: 9},
    {id: '3_8', name: '3/8', order: 10},
    {id: '7_8', name: '7/8', order: 11},
    {id: '7_4', name: '7/4', order: 12}
  ];

  try {
    // Check if document already exists
    const docRef = db.collection('resource_options').doc('music_beats');
    const docSnapshot = await docRef.get();

    if (docSnapshot.exists) {
      logger.info('Music beats document already exists, skipping import');
      return {
        success: true,
        alreadyExists: true,
        count: 0,
        message: 'Music beats already exist in the database'
      };
    }

    // Create the music_beats document in resource_options collection
    await docRef.set({
      items: musicBeats,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: request.auth.uid
    });

    logger.info(`Successfully imported ${musicBeats.length} music beats`);

    return {
      success: true,
      alreadyExists: false,
      count: musicBeats.length,
      message: `Successfully imported ${musicBeats.length} music beats`
    };
  } catch (error) {
    logger.error('Error importing music beats', {error: error.message});
    throw new https.HttpsError('internal', `Failed to import music beats: ${error.message}`);
  }
});

/**
 * Import music tempos into resource_options collection
 * This is a one-time admin function to seed the database
 */
exports.importMusicTempos = https.onCall(async (request) => {
  // Verify authentication
  if (!request.auth) {
    throw new https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  // Verify admin status
  const memberSnapshot = await db.collection('members')
    .where('firebaseUserId', '==', request.auth.uid)
    .limit(1)
    .get();

  if (memberSnapshot.empty) {
    throw new https.HttpsError('permission-denied', 'User profile not found.');
  }

  const userData = memberSnapshot.docs[0].data();
  if (!userData.isAdmin) {
    throw new https.HttpsError('permission-denied', 'Only admins can import data');
  }

  // Music tempos data
  const musicTempos = [
    {id: 'bpm_20', name: '20 BPM', label: 'Grave', description: 'Très lent, solennel', order: 1},
    {id: 'bpm_25', name: '25 BPM', label: 'Grave', description: 'Très lent, solennel', order: 2},
    {id: 'bpm_30', name: '30 BPM', label: 'Grave', description: 'Très lent, solennel', order: 3},
    {id: 'bpm_35', name: '35 BPM', label: 'Grave', description: 'Très lent, solennel', order: 4},
    {id: 'bpm_40', name: '40 BPM', label: 'Largo', description: 'Lent, large', order: 5},
    {id: 'bpm_45', name: '45 BPM', label: 'Largo', description: 'Lent, large', order: 6},
    {id: 'bpm_50', name: '50 BPM', label: 'Largo', description: 'Lent, large', order: 7},
    {id: 'bpm_55', name: '55 BPM', label: 'Largo', description: 'Lent, large', order: 8},
    {id: 'bpm_60', name: '60 BPM', label: 'Largo', description: 'Lent, large', order: 9},
    {id: 'bpm_65', name: '65 BPM', label: 'Larghetto', description: 'Un peu moins lent', order: 10},
    {id: 'bpm_70', name: '70 BPM', label: 'Adagio', description: 'Lent, expressif', order: 11},
    {id: 'bpm_75', name: '75 BPM', label: 'Adagio', description: 'Lent, expressif', order: 12},
    {id: 'bpm_80', name: '80 BPM', label: 'Andante', description: 'Allure de marche', order: 13},
    {id: 'bpm_85', name: '85 BPM', label: 'Andante', description: 'Allure de marche', order: 14},
    {id: 'bpm_90', name: '90 BPM', label: 'Andante', description: 'Allure de marche', order: 15},
    {id: 'bpm_95', name: '95 BPM', label: 'Andante', description: 'Allure de marche', order: 16},
    {id: 'bpm_100', name: '100 BPM', label: 'Andante', description: 'Allure de marche', order: 17},
    {id: 'bpm_105', name: '105 BPM', label: 'Andante', description: 'Allure de marche', order: 18},
    {id: 'bpm_110', name: '110 BPM', label: 'Moderato', description: 'Modéré', order: 19},
    {id: 'bpm_115', name: '115 BPM', label: 'Moderato', description: 'Modéré', order: 20},
    {id: 'bpm_120', name: '120 BPM', label: 'Allegro', description: 'Rapide, joyeux', order: 21},
    {id: 'bpm_125', name: '125 BPM', label: 'Allegro', description: 'Rapide, joyeux', order: 22},
    {id: 'bpm_130', name: '130 BPM', label: 'Allegro', description: 'Rapide, joyeux', order: 23},
    {id: 'bpm_135', name: '135 BPM', label: 'Allegro', description: 'Rapide, joyeux', order: 24},
    {id: 'bpm_140', name: '140 BPM', label: 'Allegro', description: 'Rapide, joyeux', order: 25},
    {id: 'bpm_145', name: '145 BPM', label: 'Allegro', description: 'Rapide, joyeux', order: 26},
    {id: 'bpm_150', name: '150 BPM', label: 'Allegro', description: 'Rapide, joyeux', order: 27},
    {id: 'bpm_155', name: '155 BPM', label: 'Allegro', description: 'Rapide, joyeux', order: 28},
    {id: 'bpm_160', name: '160 BPM', label: 'Vivace', description: 'Vif, animé', order: 29},
    {id: 'bpm_165', name: '165 BPM', label: 'Vivace', description: 'Vif, animé', order: 30},
    {id: 'bpm_170', name: '170 BPM', label: 'Vivace', description: 'Vif, animé', order: 31},
    {id: 'bpm_175', name: '175 BPM', label: 'Vivace', description: 'Vif, animé', order: 32},
    {id: 'bpm_180', name: '180 BPM', label: 'Presto', description: 'Très rapide', order: 33},
    {id: 'bpm_185', name: '185 BPM', label: 'Presto', description: 'Très rapide', order: 34},
    {id: 'bpm_190', name: '190 BPM', label: 'Presto', description: 'Très rapide', order: 35},
    {id: 'bpm_195', name: '195 BPM', label: 'Presto', description: 'Très rapide', order: 36},
    {id: 'bpm_200', name: '200 BPM', label: 'Presto', description: 'Très rapide', order: 37},
    {id: 'bpm_205', name: '205 BPM', label: 'Prestissimo', description: 'Extrêmement rapide', order: 38},
    {id: 'bpm_210', name: '210 BPM', label: 'Prestissimo', description: 'Extrêmement rapide', order: 39},
    {id: 'bpm_215', name: '215 BPM', label: 'Prestissimo', description: 'Extrêmement rapide', order: 40},
    {id: 'bpm_220', name: '220 BPM', label: 'Prestissimo', description: 'Extrêmement rapide', order: 41},
    {id: 'bpm_225', name: '225 BPM', label: 'Prestissimo', description: 'Extrêmement rapide', order: 42},
    {id: 'bpm_230', name: '230 BPM', label: 'Prestissimo', description: 'Extrêmement rapide', order: 43},
    {id: 'bpm_235', name: '235 BPM', label: 'Prestissimo', description: 'Extrêmement rapide', order: 44},
    {id: 'bpm_240', name: '240 BPM', label: 'Prestissimo', description: 'Extrêmement rapide', order: 45}
  ];

  try {
    // Check if document already exists
    const docRef = db.collection('resource_options').doc('music_tempos');
    const docSnapshot = await docRef.get();

    if (docSnapshot.exists) {
      logger.info('Music tempos document already exists, skipping import');
      return {
        success: true,
        alreadyExists: true,
        count: 0,
        message: 'Music tempos already exist in the database'
      };
    }

    // Create the music_tempos document in resource_options collection
    await docRef.set({
      items: musicTempos,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: request.auth.uid
    });

    logger.info(`Successfully imported ${musicTempos.length} music tempos`);

    return {
      success: true,
      alreadyExists: false,
      count: musicTempos.length,
      message: `Successfully imported ${musicTempos.length} music tempos`
    };
  } catch (error) {
    logger.error('Error importing music tempos', {error: error.message});
    throw new https.HttpsError('internal', `Failed to import music tempos: ${error.message}`);
  }
});

/**
 * Migration function to set end date/time for existing services
 *
 * Sets the end date/time to 2 hours after the service start time
 * for all services that don't already have an end date/time set.
 *
 * This is a one-time migration function that can be called by admins.
 */
exports.migrateServicesEndTime = https.onCall(async (request) => {
  // Verify authentication
  if (!request.auth) {
    throw new https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  // Verify admin status
  const memberSnapshot = await db.collection('members')
    .where('firebaseUserId', '==', request.auth.uid)
    .limit(1)
    .get();

  if (memberSnapshot.empty) {
    throw new https.HttpsError('permission-denied', 'User profile not found.');
  }

  const userData = memberSnapshot.docs[0].data();
  if (!userData.isAdmin) {
    throw new https.HttpsError('permission-denied', 'Only admins can run migrations');
  }

  logger.info('Starting services end time migration');

  try {
    // Get all services
    const servicesSnapshot = await db.collection('services').get();

    if (servicesSnapshot.empty) {
      logger.info('No services found to migrate');
      return {
        success: true,
        migrated: 0,
        skipped: 0,
        message: 'No services found to migrate'
      };
    }

    let migratedCount = 0;
    let skippedCount = 0;
    const errors = [];

    for (const serviceDoc of servicesSnapshot.docs) {
      const service = serviceDoc.data();

      // Skip if already has end date/time
      if (service.endDate && service.endTime) {
        logger.info(`Skipping service ${serviceDoc.id} - already has end time`);
        skippedCount++;
        continue;
      }

      // Skip if missing start date/time
      if (!service.date || !service.time) {
        logger.warn(`Skipping service ${serviceDoc.id} - missing start date/time`);
        skippedCount++;
        continue;
      }

      try {
        // Parse start date and time
        const [year, month, day] = service.date.split('-').map(Number);
        const [hours, minutes] = service.time.split(':').map(Number);

        // Create date object and add 2 hours
        const startDate = new Date(year, month - 1, day, hours, minutes);
        const endDate = new Date(startDate.getTime() + (2 * 60 * 60 * 1000)); // Add 2 hours

        // Format end date and time
        const endDateStr = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;
        const endTimeStr = `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`;

        // Update the service
        await serviceDoc.ref.update({
          endDate: endDateStr,
          endTime: endTimeStr
        });

        logger.info(`Migrated service ${serviceDoc.id}: ${service.date} ${service.time} -> end: ${endDateStr} ${endTimeStr}`);
        migratedCount++;
      } catch (updateError) {
        logger.error(`Failed to migrate service ${serviceDoc.id}:`, updateError.message);
        errors.push({
          serviceId: serviceDoc.id,
          error: updateError.message
        });
      }
    }

    logger.info(`Migration complete: ${migratedCount} migrated, ${skippedCount} skipped, ${errors.length} errors`);

    return {
      success: true,
      migrated: migratedCount,
      skipped: skippedCount,
      errors: errors.length > 0 ? errors : undefined,
      message: `Migration complete: ${migratedCount} services updated, ${skippedCount} skipped`
    };
  } catch (error) {
    logger.error('Error during services migration:', error.message);
    throw new https.HttpsError('internal', `Migration failed: ${error.message}`);
  }
});

/**
 * Cloud Function to optimize avatar images on upload
 *
 * Triggers when an image is uploaded to the avatars/ folder.
 * Optimizes the image to standard profile picture dimensions:
 * - Maximum size: 400x400 pixels (standard for profile pictures, good for retina)
 * - Format: JPEG with quality 80 (optimal balance for web)
 * - Strips metadata (EXIF, etc.) for smaller file size
 * - Uses progressive JPEG for better perceived loading
 *
 * This allows users to upload images up to 10MB which are then
 * automatically compressed to typically < 50KB.
 */
exports.optimizeAvatarImage = onObjectFinalized({
  cpu: 1,
  memory: '512MiB',
  timeoutSeconds: 120,
  region: 'us-east1'
}, async (event) => {
  const filePath = event.data.name;
  const contentType = event.data.contentType;
  const metadata = event.data.metadata || {};

  // Only process files in the avatars folder
  if (!filePath.startsWith('avatars/')) {
    logger.info('File not in avatars folder, skipping:', filePath);
    return null;
  }

  // Skip if already optimized (prevents infinite loop)
  if (metadata.optimized === 'true') {
    logger.info('Image already optimized, skipping:', filePath);
    return null;
  }

  // Only process images
  if (!contentType || !contentType.startsWith('image/')) {
    logger.info('File is not an image, skipping:', filePath);
    return null;
  }

  logger.info('Optimizing avatar image:', {filePath, contentType, size: event.data.size});

  const bucket = admin.storage().bucket(event.data.bucket);
  const file = bucket.file(filePath);
  const fileName = path.basename(filePath);
  const tempFilePath = path.join(os.tmpdir(), `original_${fileName}`);
  const tempOptimizedPath = path.join(os.tmpdir(), `optimized_${fileName}`);

  try {
    // Download the original image
    await file.download({destination: tempFilePath});
    logger.info('Downloaded original image to:', tempFilePath);

    // Get original image metadata for logging
    const originalStats = await sharp(tempFilePath).metadata();
    const originalSizeKB = Math.round(event.data.size / 1024);
    logger.info('Original image stats:', {
      width: originalStats.width,
      height: originalStats.height,
      format: originalStats.format,
      sizeKB: originalSizeKB
    });

    // Optimize the image:
    // - Resize to max 400x400 (standard profile picture size for web/retina)
    // - Convert to JPEG with quality 80
    // - Strip metadata (EXIF, etc.) for smaller size
    // - Use progressive JPEG for better perceived loading
    await sharp(tempFilePath)
      .resize(400, 400, {
        fit: 'cover', // Crop to fill the square, maintaining aspect ratio
        position: 'centre', // Center the crop
        withoutEnlargement: true // Don't upscale smaller images
      })
      .jpeg({
        quality: 80,
        progressive: true,
        mozjpeg: true // Use mozjpeg for better compression
      })
      .toFile(tempOptimizedPath);

    // Get optimized file size
    const fs = require('fs');
    const optimizedSize = fs.statSync(tempOptimizedPath).size;
    const optimizedSizeKB = Math.round(optimizedSize / 1024);
    const compressionRatio = Math.round((1 - optimizedSize / event.data.size) * 100);

    logger.info('Optimized image stats:', {
      sizeKB: optimizedSizeKB,
      compressionRatio: `${compressionRatio}%`
    });

    // Upload the optimized image back to the SAME path
    // This preserves the existing download URL that's stored in Firestore
    await bucket.upload(tempOptimizedPath, {
      destination: filePath,
      metadata: {
        contentType: 'image/jpeg',
        metadata: {
          optimized: 'true',
          originalName: metadata.originalName || fileName,
          originalSize: String(event.data.size),
          optimizedSize: String(optimizedSize),
          uploadedBy: metadata.uploadedBy || '',
          uploadDate: metadata.uploadDate || new Date().toISOString()
        }
      }
    });

    logger.info('Avatar optimization complete:', {
      path: filePath,
      originalSizeKB,
      optimizedSizeKB,
      compressionRatio: `${compressionRatio}%`
    });

    return {
      success: true,
      path: filePath,
      originalSize: event.data.size,
      optimizedSize,
      compressionRatio
    };
  } catch (error) {
    logger.error('Error optimizing avatar image:', {
      error: error.message,
      stack: error.stack,
      filePath
    });
    throw error;
  } finally {
    // Clean up temp files
    const fs = require('fs');
    try {
      if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
      if (fs.existsSync(tempOptimizedPath)) fs.unlinkSync(tempOptimizedPath);
    } catch (cleanupError) {
      logger.warn('Error cleaning up temp files:', cleanupError.message);
    }
  }
});
