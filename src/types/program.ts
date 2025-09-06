export enum ProgramItemType {
  SONG = 'Chant',
  PRAYER = 'Prière',
  SCRIPTURE = 'Lecture biblique',
  SERMON = 'Prédication',
  TITLE = 'Titre',
  ANNOUNCEMENT = 'Annonce',
  OFFERING = 'Offrande',
  BLESSING = 'Bénédiction'
}

export interface ProgramParticipant {
  id: string;
  name: string;
  role?: string;
  isCustom: boolean; // true for custom participants, false for members
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
  reference?: string; // Bible reference, song number, etc.
  lyrics?: string; // For songs
  sectionId?: string; // Optional grouping
}

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
  sections: Omit<ProgramSection, 'id'>[];
}