export interface Member {
  id: string;
  firebaseUserId: string;
  email: string;
  avatar?: string;
  firstName: string;
  lastName: string;
  fullName: string;
  teams: string[];
  availabilities: {
    [serviceId: string]: 'available' | 'unavailable' | null;
  };
  isOnboardingCompleted: boolean;
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OnboardingFormData {
  email: string;
  firstName: string;
  lastName: string;
  teams: string[];
  customTeam: string;
  availabilities: {
    [serviceId: string]: 'available' | 'unavailable' | null;
  };
}

export const AVAILABLE_TEAMS = [
  'Accueil',
  'Audiovisuel',
  'Diacre',
  'Dirigeant',
  'Louange',
  'Musicien',
  'Prédicateur',
  'Sécurité'
] as const;

export type TeamType = typeof AVAILABLE_TEAMS[number];