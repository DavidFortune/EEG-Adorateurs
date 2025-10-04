export interface Member {
  id: string;
  firebaseUserId: string;
  email: string;
  avatar?: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone?: string;
  ministries?: string[];
  teams?: string[]; // Team IDs that the member belongs to
  availabilities: {
    [serviceId: string]: 'available' | 'unavailable' | 'maybe' | null;
  };
  isOnboardingCompleted: boolean;
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OnboardingFormData {
  email: string;
  fullName: string;
  phone: string;
  selectedTeamIds: string[];
  ministries: string[];
  customMinistry: string;
  availabilities: {
    [serviceId: string]: 'available' | 'unavailable' | 'maybe' | null;
  };
}

export interface Ministry {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

