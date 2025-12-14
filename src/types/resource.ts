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

export enum CollectionType {
  CORE = 'core',
  TEAM = 'team',
  SERVICE = 'service',
  USER = 'user'
}

export interface ResourceCollection {
  id: string;
  name: string;
  symbol: string; // 2-3 character abbreviation, must be unique
  color: string; // Hex color code for avatar generation
  type: CollectionType; // Determines if collection is core, for a team, a service, or a user
  ownerId?: string; // ID of the associated team, service, or user (only when type is not 'core')
  ownerName?: string; // Name of the associated entity for display purposes
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
  createdAt?: string; // ISO timestamp when media was added
}

export interface Resource {
  id: string;
  title: string;
  reference?: string; // Bible reference, song number, etc.
  collectionId: string; // Belongs to one collection
  contents: ResourceMedia[]; // Can have multiple media types
  tags?: string[]; // For better search
  createdAt: string;
  updatedAt: string;
  createdBy: string; // User ID who created it
  updatedBy: string; // User ID who last updated it
  viewCount?: number; // Track popularity
  searchText?: string; // Preprocessed text for full-text search
  // Music metadata
  musicKey?: string; // e.g., 'C', 'D', 'Em', 'F#m'
  musicBeat?: string; // e.g., '4/4', '3/4', '6/8'
  musicTempo?: string; // e.g., 'bpm_120'
  musicStyle?: string; // e.g., 'gospel', 'hymn', 'contemporary'
}

export interface ResourceOption {
  id: string;
  name: string;
  label?: string;
  description?: string;
  order: number;
}

export interface ResourceOptionsDoc {
  items: ResourceOption[];
  updatedAt?: string;
  updatedBy?: string;
}

export interface ResourceFilter {
  searchQuery?: string;
  collectionId?: string;
  resourceTypes?: ResourceType[];
  sortBy?: SortOption;
}