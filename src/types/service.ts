export enum ServiceCategory {
  SERVICE = 'Service',
  SPECIAL_EVENT = 'Évènement spécial'
}

export interface TeamRequirement {
  teamName: string;
  membersNeeded: number;
  isActive: boolean;
}

export interface Service {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD format in America/Toronto timezone
  time: string; // HH:MM format in America/Toronto timezone
  category: ServiceCategory;
  isPublished: boolean;
  availabilityDeadline?: string; // ISO 8601 datetime format (YYYY-MM-DDTHH:MM:SS) for deadline to submit availability
  teamRequirements?: TeamRequirement[]; // Team staffing requirements
  guestMemberIds?: string[]; // Member IDs who have direct access to this service without being in a required team
  createdAt: string; // ISO timestamp
  modifiedAt: string; // ISO timestamp
}

export interface CreateServiceRequest {
  title: string;
  date: string; // YYYY-MM-DD format in America/Toronto timezone
  time: string; // HH:MM format in America/Toronto timezone
  category: ServiceCategory;
  isPublished: boolean;
  availabilityDeadline?: string; // ISO 8601 datetime format (YYYY-MM-DDTHH:MM:SS) for deadline to submit availability
  teamRequirements?: TeamRequirement[]; // Team staffing requirements
  guestMemberIds?: string[]; // Member IDs who have direct access to this service without being in a required team
}

export interface UpdateServiceRequest extends CreateServiceRequest {
  id: string;
}