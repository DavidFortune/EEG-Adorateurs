import { ResourceType } from '@/types/resource';
import {
  documentTextOutline, videocamOutline, volumeHighOutline,
  musicalNotesOutline, logoYoutube, documentOutline, musicalNoteOutline
} from 'ionicons/icons';

/**
 * Get icon for a resource content type
 */
export function getContentIcon(type: ResourceType): string {
  switch (type) {
    case ResourceType.LYRICS:
      return documentTextOutline;
    case ResourceType.VIDEO:
      return videocamOutline;
    case ResourceType.AUDIO:
      return volumeHighOutline;
    case ResourceType.MUSIC_SHEET:
      return musicalNotesOutline;
    case ResourceType.YOUTUBE:
      return logoYoutube;
    case ResourceType.SPOTIFY:
      return musicalNoteOutline;
    case ResourceType.FILE:
      return documentOutline;
    default:
      return documentTextOutline;
  }
}

/**
 * Get label for a resource content type
 */
export function getContentLabel(type: ResourceType): string {
  switch (type) {
    case ResourceType.LYRICS:
      return 'Paroles';
    case ResourceType.VIDEO:
      return 'Vidéo';
    case ResourceType.AUDIO:
      return 'Audio';
    case ResourceType.MUSIC_SHEET:
      return 'Partition';
    case ResourceType.YOUTUBE:
      return 'YouTube';
    case ResourceType.SPOTIFY:
      return 'Spotify';
    case ResourceType.FILE:
      return 'Fichier';
    default:
      return type;
  }
}

/**
 * Format file size in human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Check if URL is a YouTube URL
 */
export function isYouTubeUrl(url?: string): boolean {
  if (!url) return false;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)/,
    /^[a-zA-Z0-9_-]{11}$/ // Just a YouTube video ID
  ];
  return patterns.some(pattern => pattern.test(url));
}

/**
 * Get YouTube embed URL from various YouTube URL formats
 */
export function getYouTubeEmbedUrl(url?: string): string | null {
  if (!url) return null;

  // Extract video ID from various YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return `https://www.youtube.com/embed/${match[1]}`;
    }
  }

  // Check if it's already just a video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
    return `https://www.youtube.com/embed/${url}`;
  }

  return null;
}

/**
 * Check if a URL points to a PDF file
 */
export function isPdfFile(url: string): boolean {
  return url.toLowerCase().includes('.pdf') || url.toLowerCase().includes('pdf');
}

/**
 * Extract filename from URL
 */
export function getFileName(url: string): string {
  if (!url) return '';

  // Extract filename from URL, handling Firebase URLs and regular URLs
  try {
    const urlObj = new URL(url);
    const pathName = urlObj.pathname;
    const segments = pathName.split('/');
    let filename = segments[segments.length - 1];

    // For Firebase URLs, remove query parameters and decode
    if (filename.includes('?')) {
      filename = filename.split('?')[0];
    }

    // Decode URI component
    filename = decodeURIComponent(filename);

    // Remove timestamp prefix if present (e.g., "1234567890_filename.pdf")
    if (filename.includes('_')) {
      const parts = filename.split('_');
      if (parts.length > 1 && /^\d+$/.test(parts[0])) {
        filename = parts.slice(1).join('_');
      }
    }

    return filename || 'Fichier';
  } catch (error) {
    // Fallback for invalid URLs
    const lastSlash = url.lastIndexOf('/');
    return lastSlash >= 0 ? url.substring(lastSlash + 1) : 'Fichier';
  }
}

/**
 * Get preview text from content
 */
export function getPreviewText(content: string, maxLength: number = 50): string {
  if (!content) return '';
  const preview = content.trim().substring(0, maxLength);
  return preview + (content.length > maxLength ? '...' : '');
}

/**
 * Check if URL is a Spotify URL
 */
export function isSpotifyUrl(url?: string): boolean {
  if (!url) return false;
  return url.includes('spotify.com/');
}

/**
 * Check if URL points to an audio file
 */
export function isAudioUrl(url?: string): boolean {
  if (!url) return false;
  const audioExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac', '.wma', '.webm'];
  const lowerUrl = url.toLowerCase();
  return audioExtensions.some(ext => lowerUrl.includes(ext));
}

/**
 * Check if URL points to a video file
 */
export function isVideoUrl(url?: string): boolean {
  if (!url) return false;
  const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.wmv', '.flv', '.m4v'];
  const lowerUrl = url.toLowerCase();
  return videoExtensions.some(ext => lowerUrl.includes(ext));
}

/**
 * Check if URL points to a music sheet (PDF or image)
 */
export function isMusicSheetUrl(url?: string): boolean {
  if (!url) return false;
  return isPdfFile(url);
}

/**
 * Detect ResourceType from URL
 */
export function detectMediaTypeFromUrl(url: string): ResourceType {
  if (isYouTubeUrl(url)) {
    return ResourceType.YOUTUBE;
  }
  if (isSpotifyUrl(url)) {
    return ResourceType.SPOTIFY;
  }
  if (isAudioUrl(url)) {
    return ResourceType.AUDIO;
  }
  if (isVideoUrl(url)) {
    return ResourceType.VIDEO;
  }
  if (isPdfFile(url)) {
    return ResourceType.MUSIC_SHEET;
  }
  // Default to FILE for any other URL
  return ResourceType.FILE;
}

/**
 * Get a suggested name for a URL based on its type and content
 */
export function getSuggestedNameFromUrl(url: string, type: ResourceType): string {
  try {
    const urlObj = new URL(url);

    // For YouTube, try to extract video info from URL
    if (type === ResourceType.YOUTUBE) {
      return 'Vidéo YouTube';
    }

    // For Spotify, determine the type
    if (type === ResourceType.SPOTIFY) {
      if (url.includes('/track/')) return 'Piste Spotify';
      if (url.includes('/album/')) return 'Album Spotify';
      if (url.includes('/playlist/')) return 'Playlist Spotify';
      return 'Spotify';
    }

    // For files, try to extract filename
    const filename = getFileName(url);
    if (filename && filename !== 'Fichier') {
      // Remove extension for cleaner name
      const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
      return nameWithoutExt;
    }

    // Fallback based on type
    switch (type) {
      case ResourceType.AUDIO:
        return 'Audio';
      case ResourceType.VIDEO:
        return 'Vidéo';
      case ResourceType.MUSIC_SHEET:
        return 'Partition';
      case ResourceType.FILE:
        return urlObj.hostname || 'Lien';
      default:
        return 'Média';
    }
  } catch {
    return 'Lien';
  }
}

/**
 * Get Spotify embed URL from various Spotify URL formats
 */
export function getSpotifyEmbedUrl(url?: string): string | null {
  if (!url) return null;

  // Extract Spotify URI from various URL formats
  // Formats supported:
  // - https://open.spotify.com/track/6rqhFgbbKwnb9MLmUQDhG6
  // - https://open.spotify.com/album/4aawyAB9vmqN3uQ7FjRGTy
  // - https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M
  // - https://open.spotify.com/episode/7makk4oTQel546B0PZlDM5

  const patterns = [
    /spotify\.com\/(track|album|playlist|episode|show)\/([a-zA-Z0-9]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1] && match[2]) {
      const type = match[1];
      const id = match[2];
      return `https://open.spotify.com/embed/${type}/${id}`;
    }
  }

  return null;
}