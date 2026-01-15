import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '@/firebase/config';

export interface YouTubeSearchResult {
  id: string;
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnail?: string;
  duration?: string;
  viewCount?: number;
}

/**
 * Search YouTube videos using Firebase Cloud Functions
 */
export const searchYouTubeVideos = async (query: string): Promise<YouTubeSearchResult[]> => {
  if (!query.trim()) return [];

  try {
    const functions = getFunctions(app);
    const searchYouTubeFn = httpsCallable(functions, 'searchYouTube');
    const result = await searchYouTubeFn({ query });
    const data = result.data as { results: YouTubeSearchResult[] };

    return (data.results || []).map(r => ({
      id: r.id || r.videoId,
      videoId: r.videoId,
      title: r.title,
      channelTitle: r.channelTitle,
      thumbnail: r.thumbnail,
      duration: r.duration,
      viewCount: r.viewCount
    }));
  } catch (error) {
    console.error('Error searching YouTube:', error);
    throw error;
  }
};
