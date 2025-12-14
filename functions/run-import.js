// Direct Firestore import script
const admin = require('firebase-admin');

// Initialize with default credentials
admin.initializeApp({
  projectId: 'eeg-adorateurs'
});

const db = admin.firestore();
db.settings({databaseId: 'eeg-adorateurs-db'});

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

async function importMusicStyles() {
  try {
    const docRef = db.collection('resource_options').doc('music_styles');
    
    await docRef.set({
      music_styles: musicStyles,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log('Successfully imported ' + musicStyles.length + ' music styles to resource_options/music_styles');
    process.exit(0);
  } catch (error) {
    console.error('Error importing music styles:', error);
    process.exit(1);
  }
}

importMusicStyles();
