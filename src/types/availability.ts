export type AvailabilityStatus = 'available' | 'unavailable' | 'maybe';

export interface MemberAvailability {
  id: string;
  serviceId: string;
  memberId: string;
  status: AvailabilityStatus;
  comment?: string;
  submittedAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

export interface TeamMemberAvailability {
  memberId: string;
  memberName: string;
  teamRole: string;
  availability: AvailabilityStatus | null; // null means no response yet
  isAssigned: boolean;
  comment?: string;
}

export interface ServiceAvailabilityRequest {
  serviceId: string;
  memberId: string;
  status: AvailabilityStatus;
  comment?: string;
}

export interface ServiceAvailabilityResponse {
  serviceId: string;
  submissions: MemberAvailability[];
  totalResponses: number;
  availableCount: number;
  unavailableCount: number;
  maybeCount: number;
  noResponseCount: number;
}