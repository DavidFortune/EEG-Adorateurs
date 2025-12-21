export enum ProgramItemType {
  SONG = 'Chant',
  PRAYER = 'Prière',
  SCRIPTURE = 'Lecture biblique',
  SERMON = 'Prédication',
  TITLE = 'Titre',
  SECTION = 'Section'
}

export interface ProgramParticipant {
  id: string;
  name: string;
  role?: string;
  isCustom: boolean; // true for custom participants, false for members
}

// Sub-item for items that have children (e.g., songs under worship moment)
export interface ProgramSubItem {
  id: string;
  title: string;
  resourceId?: string; // Link to a resource (song, etc.)
  notes?: string;
  order: number;
}

export interface ProgramItem {
  id: string;
  order: number;
  type: ProgramItemType;
  title: string;
  subtitle?: string;
  notes?: string;
  participant?: ProgramParticipant;
  duration?: number; // in minutes
  lyrics?: string; // For songs
  resourceId?: string; // Link to a single resource (1:1 relationship)
  subItems?: ProgramSubItem[]; // Optional sub-items (e.g., list of songs)
  // DEPRECATED: sectionId is no longer used in flat structure
  sectionId?: string; // Kept for backward compatibility
}

// DEPRECATED: Sections are no longer used in flat structure
// Kept for backward compatibility
export interface ProgramSection {
  id: string;
  title: string;
  order: number;
  color?: string;
}

export interface ServiceProgram {
  id: string;
  serviceId: string;
  items: ProgramItem[];
  // DEPRECATED: sections are no longer used in flat structure
  // Kept for backward compatibility
  sections: ProgramSection[];
  conductor?: ProgramParticipant; // Dirigeant/Leader of the service
  totalDuration: number; // calculated from items
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string; // User ID who created the program
  updatedBy?: string; // User ID who last updated the program
}

export interface CreateProgramRequest {
  serviceId: string;
  items: Omit<ProgramItem, 'id'>[];
  sections?: Omit<ProgramSection, 'id'>[]; // Optional for backward compatibility
}