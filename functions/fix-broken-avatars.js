/**
 * Script to find and fix broken avatar URLs in the members collection
 *
 * Usage:
 *   cd functions
 *   node fix-broken-avatars.js
 *
 * This script will:
 * 1. Fetch all members with avatar URLs
 * 2. Test each URL to check if it's accessible
 * 3. Clear the avatar field for members with broken URLs
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
db.settings({ databaseId: 'eeg-adorateurs-db' });

async function checkUrlAccessible(url) {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    return false;
  }
}

async function fixBrokenAvatars() {
  console.log('Fetching members with avatars...\n');

  const membersRef = db.collection('members');
  const snapshot = await membersRef.get();

  const membersWithAvatars = [];
  const brokenAvatars = [];

  snapshot.forEach(doc => {
    const data = doc.data();
    if (data.avatar) {
      membersWithAvatars.push({
        id: doc.id,
        fullName: data.fullName,
        avatar: data.avatar
      });
    }
  });

  console.log(`Found ${membersWithAvatars.length} members with avatars.\n`);
  console.log('Checking avatar URLs...\n');

  for (const member of membersWithAvatars) {
    process.stdout.write(`Checking ${member.fullName}... `);
    const isAccessible = await checkUrlAccessible(member.avatar);

    if (isAccessible) {
      console.log('OK');
    } else {
      console.log('BROKEN');
      brokenAvatars.push(member);
    }
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`Found ${brokenAvatars.length} broken avatar(s).\n`);

  if (brokenAvatars.length === 0) {
    console.log('No broken avatars to fix!');
    return;
  }

  console.log('Broken avatars:');
  brokenAvatars.forEach(m => {
    console.log(`  - ${m.fullName} (${m.id})`);
  });

  console.log('\nClearing broken avatar URLs...\n');

  for (const member of brokenAvatars) {
    try {
      await membersRef.doc(member.id).update({
        avatar: admin.firestore.FieldValue.delete()
      });
      console.log(`  Cleared avatar for ${member.fullName}`);
    } catch (error) {
      console.error(`  Error clearing avatar for ${member.fullName}:`, error.message);
    }
  }

  console.log('\nDone! Broken avatar URLs have been cleared.');
  console.log('Affected members will now show their initials instead.');
}

fixBrokenAvatars()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
