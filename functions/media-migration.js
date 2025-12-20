const {https} = require('firebase-functions/v2');
const {logger} = require('firebase-functions/v2');
const {defineString} = require('firebase-functions/params');
const admin = require('firebase-admin');

// Get Firestore instance (admin is already initialized in index.js)
const db = admin.firestore();

// Google API Key for YouTube
const googleApiKey = defineString('GOOGLE_API_KEY', {default: ''});

/**
 * Check if URL is a Firebase Storage URL
 */
function isFirebaseStorageUrl(url) {
  if (!url) return false;
  return url.includes('firebasestorage.googleapis.com') ||
         url.includes('storage.googleapis.com');
}

/**
 * Check if URL is a YouTube URL
 */
function isYouTubeUrl(url) {
  if (!url) return false;
  return url.includes('youtube.com') || url.includes('youtu.be');
}

/**
 * Extract YouTube video ID from URL
 */
function extractYouTubeVideoId(url) {
  if (!url) return null;

  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  // Check if it's already just a video ID (11 characters)
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
    return url;
  }

  return null;
}

/**
 * Parse ISO 8601 duration to seconds
 * e.g., "PT4M13S" -> 253 seconds
 */
function parseISO8601Duration(duration) {
  if (!duration) return null;

  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return null;

  const hours = parseInt(match[1] || 0, 10);
  const minutes = parseInt(match[2] || 0, 10);
  const seconds = parseInt(match[3] || 0, 10);

  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Fetch YouTube video metadata (title and duration) using YouTube Data API
 * Returns { title, duration } or null if unable to fetch
 */
async function fetchYouTubeMetadata(videoId, apiKey) {
  if (!videoId || !apiKey) return null;

  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${apiKey}`
    );

    if (!response.ok) {
      logger.warn(`YouTube API request failed for video ${videoId}: ${response.status}`);
      return null;
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      logger.warn(`No video found for ID: ${videoId}`);
      return null;
    }

    const video = data.items[0];
    const title = video.snippet?.title || null;
    const isoDuration = video.contentDetails?.duration;
    const durationSeconds = parseISO8601Duration(isoDuration);

    return {
      title,
      duration: durationSeconds
    };
  } catch (error) {
    logger.warn(`Error fetching YouTube metadata for ${videoId}: ${error.message}`);
    return null;
  }
}

/**
 * Fetch file size from URL using HEAD request
 * Returns file size in bytes or null if unable to fetch
 */
async function fetchFileSizeFromUrl(url) {
  if (!url) return null;

  try {
    const response = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow'
    });

    if (!response.ok) {
      logger.warn(`HEAD request failed for URL: ${url.substring(0, 50)}... Status: ${response.status}`);
      return null;
    }

    const contentLength = response.headers.get('content-length');
    if (contentLength) {
      const size = parseInt(contentLength, 10);
      if (!isNaN(size) && size > 0) {
        return size;
      }
    }

    return null;
  } catch (error) {
    logger.warn(`Error fetching file size for URL: ${url.substring(0, 50)}... Error: ${error.message}`);
    return null;
  }
}

/**
 * Detect media type from URL
 */
function detectMediaTypeFromUrl(url) {
  if (!url) return 'file';

  const lowerUrl = url.toLowerCase();

  // YouTube
  if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) {
    return 'youtube';
  }

  // Spotify
  if (lowerUrl.includes('spotify.com')) {
    return 'spotify';
  }

  // Audio extensions
  const audioExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac', '.wma', '.webm'];
  if (audioExtensions.some(ext => lowerUrl.includes(ext))) {
    return 'audio';
  }

  // Video extensions
  const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.wmv', '.flv', '.m4v'];
  if (videoExtensions.some(ext => lowerUrl.includes(ext))) {
    return 'video';
  }

  // PDF (music sheet)
  if (lowerUrl.includes('.pdf')) {
    return 'music_sheet';
  }

  return 'file';
}

/**
 * Get file extension from URL
 */
function getExtensionFromUrl(url) {
  if (!url) return null;

  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const match = pathname.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
    if (match && match[1]) {
      return match[1].toUpperCase();
    }
  } catch (e) {
    // Ignore URL parsing errors
  }

  return null;
}

/**
 * Get suggested name from URL based on type
 */
function getSuggestedNameFromUrl(url, type) {
  if (!url) return null;

  try {
    const urlObj = new URL(url);

    // For YouTube
    if (type === 'youtube') {
      return 'Vidéo YouTube';
    }

    // For Spotify
    if (type === 'spotify') {
      if (url.includes('/track/')) return 'Piste Spotify';
      if (url.includes('/album/')) return 'Album Spotify';
      if (url.includes('/playlist/')) return 'Playlist Spotify';
      return 'Spotify';
    }

    // For files, try to extract filename
    const pathname = urlObj.pathname;
    const segments = pathname.split('/');
    let filename = segments[segments.length - 1];

    if (filename) {
      // For Firebase URLs, decode and clean
      if (filename.includes('?')) {
        filename = filename.split('?')[0];
      }
      filename = decodeURIComponent(filename);

      // Remove timestamp prefix if present (e.g., "1234567890_filename.pdf")
      if (filename.includes('_')) {
        const parts = filename.split('_');
        if (parts.length > 1 && /^\d+$/.test(parts[0])) {
          filename = parts.slice(1).join('_');
        }
      }

      // Remove extension for cleaner name
      const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
      if (nameWithoutExt && nameWithoutExt !== 'Fichier') {
        return nameWithoutExt;
      }
    }

    // Fallback based on type
    switch (type) {
      case 'audio':
        return 'Audio';
      case 'video':
        return 'Vidéo';
      case 'music_sheet':
        return 'Partition';
      case 'file':
        return urlObj.hostname || 'Fichier';
      default:
        return 'Média';
    }
  } catch (e) {
    return 'Média';
  }
}

/**
 * Get MIME type label from mime string
 */
function getMimeTypeLabel(mimeType) {
  if (!mimeType) return null;

  const mimeMap = {
    'audio/mpeg': 'MP3',
    'audio/mp3': 'MP3',
    'audio/wav': 'WAV',
    'audio/ogg': 'OGG',
    'audio/webm': 'WEBM',
    'audio/m4a': 'M4A',
    'audio/x-m4a': 'M4A',
    'video/mp4': 'MP4',
    'video/webm': 'WEBM',
    'video/quicktime': 'MOV',
    'application/pdf': 'PDF',
  };

  if (mimeMap[mimeType]) {
    return mimeMap[mimeType];
  }

  // Extract subtype from mime (e.g., "audio/mpeg" -> "MPEG")
  const parts = mimeType.split('/');
  if (parts[1]) {
    return parts[1].toUpperCase();
  }

  return null;
}

/**
 * Migrate media metadata for all resources
 * This function ONLY adds missing fields to media items (never overwrites existing):
 * - notes (name): auto-detected from URL if missing
 * - createdAt: uses resource createdAt if missing
 * - mimeType: inferred from extension if not present
 * - fileSize: fetched via HEAD request for Firebase Storage URLs if missing
 *
 * Skips lyrics entirely.
 */
exports.migrateMediaMetadata = https.onCall(async (request) => {
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

  logger.info('Starting media metadata migration (only filling missing fields)');

  // Get YouTube API key
  const apiKey = googleApiKey.value();
  if (!apiKey) {
    logger.warn('YouTube API key not configured - YouTube durations will not be fetched');
  }

  try {
    // Get all resources
    const resourcesSnapshot = await db.collection('resources').get();

    let totalResources = 0;
    let updatedResources = 0;
    let totalMediaItems = 0;
    let updatedMediaItems = 0;
    let skippedLyrics = 0;
    let fileSizesFetched = 0;
    let youtubeDurationsFetched = 0;

    // Process resources one by one (can't use batch with async operations inside map)
    for (const doc of resourcesSnapshot.docs) {
      totalResources++;
      const resource = doc.data();
      const resourceCreatedAt = resource.createdAt;

      if (!resource.contents || !Array.isArray(resource.contents)) {
        continue;
      }

      let resourceUpdated = false;
      const updatedContents = [];

      for (const media of resource.contents) {
        // Skip lyrics entirely - they don't need these fields
        if (media.type === 'lyrics') {
          skippedLyrics++;
          updatedContents.push(media);
          continue;
        }

        totalMediaItems++;

        let updated = {...media};
        let mediaChanged = false;

        // 1. Add notes (name) ONLY if missing (skip YouTube - handled separately with API)
        if (!media.notes && media.url && !isYouTubeUrl(media.url)) {
          const suggestedName = getSuggestedNameFromUrl(media.url, media.type);
          if (suggestedName) {
            updated.notes = suggestedName;
            mediaChanged = true;
            logger.info(`Added notes "${suggestedName}" for media type ${media.type}`);
          }
        }

        // 2. Add createdAt ONLY if missing - use resource's createdAt
        if (!media.createdAt && resourceCreatedAt) {
          updated.createdAt = resourceCreatedAt;
          mediaChanged = true;
        }

        // 3. Infer mimeType from extension ONLY if not present
        if (!media.mimeType && media.url) {
          const ext = getExtensionFromUrl(media.url);
          if (ext) {
            const extToMime = {
              'MP3': 'audio/mpeg',
              'WAV': 'audio/wav',
              'OGG': 'audio/ogg',
              'M4A': 'audio/m4a',
              'WEBM': 'audio/webm',
              'MP4': 'video/mp4',
              'MOV': 'video/quicktime',
              'AVI': 'video/x-msvideo',
              'MKV': 'video/x-matroska',
              'PDF': 'application/pdf',
            };
            if (extToMime[ext]) {
              updated.mimeType = extToMime[ext];
              mediaChanged = true;
            }
          }
        }

        // 4. Fetch fileSize via HEAD request ONLY if missing and URL is Firebase Storage
        if (!media.fileSize && media.url && isFirebaseStorageUrl(media.url)) {
          const fileSize = await fetchFileSizeFromUrl(media.url);
          if (fileSize) {
            updated.fileSize = fileSize;
            mediaChanged = true;
            fileSizesFetched++;
            logger.info(`Fetched fileSize ${fileSize} bytes for ${media.url.substring(0, 50)}...`);
          }
        }

        // 5. Fetch YouTube metadata (title and duration) if any are missing
        if (media.url && isYouTubeUrl(media.url) && apiKey) {
          const needsTitle = !media.notes;
          const needsDuration = !media.duration;

          if (needsTitle || needsDuration) {
            const videoId = extractYouTubeVideoId(media.url);
            if (videoId) {
              const metadata = await fetchYouTubeMetadata(videoId, apiKey);
              if (metadata) {
                if (needsTitle && metadata.title) {
                  updated.notes = metadata.title;
                  mediaChanged = true;
                  logger.info(`Set YouTube title "${metadata.title}" for video ${videoId}`);
                }
                if (needsDuration && metadata.duration) {
                  updated.duration = metadata.duration;
                  mediaChanged = true;
                  youtubeDurationsFetched++;
                  logger.info(`Fetched YouTube duration ${metadata.duration}s for video ${videoId}`);
                }
              }
            }
          }
        }

        if (mediaChanged) {
          updatedMediaItems++;
          resourceUpdated = true;
        }

        updatedContents.push(updated);
      }

      if (resourceUpdated) {
        await doc.ref.update({
          contents: updatedContents,
          updatedAt: new Date().toISOString()
        });
        updatedResources++;
        logger.info(`Updated resource ${doc.id}`);
      }
    }

    const result = {
      success: true,
      totalResources,
      updatedResources,
      totalMediaItems,
      updatedMediaItems,
      skippedLyrics,
      fileSizesFetched,
      youtubeDurationsFetched,
      message: `Migration complete: Updated ${updatedMediaItems} media items in ${updatedResources} resources (skipped ${skippedLyrics} lyrics, fetched ${fileSizesFetched} file sizes, ${youtubeDurationsFetched} YouTube durations)`
    };

    logger.info('Media metadata migration completed', result);

    return result;
  } catch (error) {
    logger.error('Error during media metadata migration:', error);
    throw new https.HttpsError('internal', `Migration failed: ${error.message}`);
  }
});
