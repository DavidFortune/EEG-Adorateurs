export interface ProgramParticipant {
  id: string;
  name: string;
  role?: string;
  avatar?: string; // Member avatar URL (only for non-custom participants)
  isCustom: boolean; // true for custom participants, false for members
}

export interface ProgramItem {
  id: string;
  order: number;
  title: string;
  subtitle?: string;
  notes?: string;
  participants?: ProgramParticipant[];
  duration?: number; // in minutes
  lyrics?: string;
  resourceId?: string; // Link to a single resource (1:1 relationship)
  scriptureReference?: string;
  scriptureText?: string;
  scriptureVersion?: string;
  // Group support
  isGroup?: boolean; // true = this item is a group header
  groupId?: string; // ID of parent group (if item belongs to a group)
  // Legacy fields (read-only, preserved for backward compatibility)
  type?: string; // Legacy item type, not used in new UI
  subItems?: any[]; // Read during migration, never written
  sectionId?: string;
  participant?: ProgramParticipant; // DEPRECATED: use participants
}

export type ProgramStatus = 'draft' | 'published';

export interface EditLock {
  userId: string;
  userName: string;
  lockedAt: Date;
  expiresAt: Date;
}

export interface ServiceProgram {
  id: string;
  serviceId: string;
  items: ProgramItem[];
  sections: any[]; // Legacy, kept for backward compatibility
  conductor?: ProgramParticipant; // Dirigeant/Leader of the service
  totalDuration: number; // calculated from items
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string; // User ID who created the program
  updatedBy?: string; // User ID who last updated the program
  // Lifecycle status
  status: ProgramStatus; // 'draft' = limited visibility, 'published' = visible to all
  draftViewerIds: string[]; // Firebase UIDs allowed to view/edit when in draft
  publishedAt?: Date; // Timestamp when program was published
  publishedBy?: string; // Firebase UID who published the program
  // Edit lock fields
  editLock?: EditLock | null; // Distributed lock for concurrent editing prevention
}

export interface CreateProgramRequest {
  serviceId: string;
  items: Omit<ProgramItem, 'id'>[];
}