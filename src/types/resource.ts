export enum ResourceType {
  LYRICS = 'lyrics',
  VIDEO = 'video',
  AUDIO = 'audio',
  MUSIC_SHEET = 'music_sheet',
  YOUTUBE = 'youtube',
  SPOTIFY = 'spotify',
  FILE = 'file'
}

export enum SortOption {
  NEWEST = 'newest',
  OLDEST = 'oldest',
  ALPHABETICAL_ASC = 'alphabetical_asc',
  ALPHABETICAL_DESC = 'alphabetical_desc'
}

export interface ResourceCollection {
  id: string;
  name: string;
  symbol: string; // 2-3 character abbreviation, must be unique
  color: string; // Hex color code for avatar generation
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ResourceMedia {
  type: ResourceType;
  content?: string; // For lyrics or text content
  url?: string; // For videos, audio, youtube links, external links
  thumbnailUrl?: string; // For video/youtube thumbnails
  duration?: number; // Duration in seconds for audio/video
  fileSize?: number; // File size in bytes
  mimeType?: string; // MIME type for files
  notes?: string; // Additional notes or instructions for this media
}

export interface Resource {
  id: string;
  title: string;
  description?: string;
  reference?: string; // Bible reference, song number, etc.
  collectionIds: string[]; // Can belong to multiple collections
  contents: ResourceMedia[]; // Can have multiple media types
  tags?: string[]; // For better search
  createdAt: string;
  updatedAt: string;
  createdBy: string; // User ID who created it
  updatedBy: string; // User ID who last updated it
  viewCount?: number; // Track popularity
  searchText?: string; // Preprocessed text for full-text search
}

export interface ResourceFilter {
  searchQuery?: string;
  collectionIds?: string[];
  resourceTypes?: ResourceType[];
  sortBy?: SortOption;
}