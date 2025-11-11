const {https} = require('firebase-functions/v2');
const {logger} = require('firebase-functions/v2');
const {defineString} = require('firebase-functions/params');
const admin = require('firebase-admin');

// Define Google API Key as an environment parameter
const googleApiKey = defineString('GOOGLE_API_KEY', {default: ''});

// Get Firestore instance (admin is already initialized in index.js)
const db = admin.firestore();

/**
 * Search YouTube for videos using Google API
 *
 * Uses the YouTube Data API v3 to search for videos based on a query
 */
exports.searchYouTube = https.onCall(async (request) => {
  // Verify authentication
  if (!request.auth) {
    throw new https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const {query} = request.data;

  if (!query || typeof query !== 'string' || query.trim() === '') {
    throw new https.HttpsError('invalid-argument', 'Search query is required');
  }

  try {
    const apiKey = googleApiKey.value();

    if (!apiKey) {
      throw new https.HttpsError('failed-precondition', 'YouTube API is not configured');
    }

    // Call YouTube Data API
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?` +
      `part=snippet&q=${encodeURIComponent(query)}&` +
      `type=video&maxResults=10&key=${apiKey}`
    );

    if (!response.ok) {
      logger.error('YouTube API error:', await response.text());
      throw new https.HttpsError('internal', 'Failed to search YouTube');
    }

    const data = await response.json();

    // Transform results
    const results = data.items?.map(item => ({
      id: item.id.videoId,
      title: item.snippet.title,
      channel: item.snippet.channelTitle,
      thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
      videoUrl: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      description: item.snippet.description
    })) || [];

    logger.info(`Found ${results.length} YouTube results for query: ${query}`);

    return {
      results
    };
  } catch (error) {
    logger.error('Error searching YouTube:', error);
    throw new https.HttpsError('internal', `Failed to search YouTube: ${error.message}`);
  }
});

/**
 * Get video captions/description from YouTube
 * Note: This extracts publicly available video descriptions and metadata,
 * not copyrighted lyrics. Users should add lyrics manually if needed.
 */
exports.getVideoMetadata = https.onCall(async (request) => {
  // Verify authentication
  if (!request.auth) {
    throw new https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const {videoId} = request.data;

  if (!videoId) {
    throw new https.HttpsError('invalid-argument', 'Video ID is required');
  }

  try {
    const apiKey = googleApiKey.value();

    if (!apiKey) {
      throw new https.HttpsError('failed-precondition', 'YouTube API is not configured');
    }

    // Call YouTube Data API to get video details
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?` +
      `part=snippet&id=${videoId}&key=${apiKey}`
    );

    if (!response.ok) {
      logger.error('YouTube API error:', await response.text());
      throw new https.HttpsError('internal', 'Failed to get video metadata');
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      throw new https.HttpsError('not-found', 'Video not found');
    }

    const video = data.items[0];

    return {
      description: video.snippet.description || '',
      tags: video.snippet.tags || [],
      categoryId: video.snippet.categoryId,
      // Note: We don't extract captions as they may contain copyrighted content
      // Users should manually add lyrics if they have proper licensing
      metadata: {
        title: video.snippet.title,
        channel: video.snippet.channelTitle,
        publishedAt: video.snippet.publishedAt
      }
    };
  } catch (error) {
    logger.error('Error getting video metadata:', error);
    throw new https.HttpsError('internal', `Failed to get video metadata: ${error.message}`);
  }
});

/**
 * Create a resource from a YouTube video
 */
exports.createResourceFromYouTube = https.onCall(async (request) => {
  // Verify authentication
  if (!request.auth) {
    throw new https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const {title, videoUrl, thumbnail, channel, description, lyrics} = request.data;

  if (!title || !videoUrl) {
    throw new https.HttpsError('invalid-argument', 'Title and video URL are required');
  }

  try {
    // Find the member document by firebaseUserId
    const memberSnapshot = await db.collection('members')
      .where('firebaseUserId', '==', request.auth.uid)
      .limit(1)
      .get();

    if (memberSnapshot.empty) {
      throw new https.HttpsError('permission-denied', 'User profile not found');
    }

    const memberDoc = memberSnapshot.docs[0];
    const userId = memberDoc.id;

    // Create the resource
    const now = new Date().toISOString();

    const resource = {
      title: title,
      description: description || (channel ? `Vidéo YouTube de ${channel}` : 'Vidéo YouTube'),
      collectionIds: [], // Can be assigned later
      contents: [
        {
          type: lyrics ? 'lyrics' : 'youtube',
          url: videoUrl,
          thumbnailUrl: thumbnail || null,
          notes: null,
          content: lyrics || null // Store lyrics as content if provided
        }
      ],
      tags: ['youtube', 'vidéo'],
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
      updatedBy: userId,
      viewCount: 0
    };

    // Add the resource to Firestore
    const resourceRef = await db.collection('resources').add(resource);

    logger.info(`Created resource ${resourceRef.id} from YouTube video: ${videoUrl}`);

    return {
      resourceId: resourceRef.id,
      resource: {
        id: resourceRef.id,
        ...resource
      }
    };
  } catch (error) {
    logger.error('Error creating resource from YouTube:', error);
    throw new https.HttpsError('internal', `Failed to create resource: ${error.message}`);
  }
});
