export enum ServiceCategory {
  SERVICE = 'Service',
  SPECIAL_EVENT = 'Évènement spécial'
}

export interface Service {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD format in America/Toronto timezone
  time: string; // HH:MM format in America/Toronto timezone
  category: ServiceCategory;
  isPublished: boolean;
  createdAt: string; // ISO timestamp
  modifiedAt: string; // ISO timestamp
}

export interface CreateServiceRequest {
  title: string;
  date: string; // YYYY-MM-DD format in America/Toronto timezone
  time: string; // HH:MM format in America/Toronto timezone
  category: ServiceCategory;
  isPublished: boolean;
}

export interface UpdateServiceRequest extends CreateServiceRequest {
  id: string;
}