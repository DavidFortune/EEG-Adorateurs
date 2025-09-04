export interface ServiceAssignment {
  id: string;
  serviceId: string;
  teamId: string;
  teamName: string;
  memberId: string;
  memberName: string;
  assignedAt: string; // ISO timestamp
  assignedBy: string; // Admin member ID who made the assignment
}

export interface CreateAssignmentRequest {
  serviceId: string;
  teamId: string;
  memberId: string;
  assignedBy: string;
}

export interface ServiceTeamAssignments {
  serviceId: string;
  teamId: string;
  teamName: string;
  requiredCount: number;
  assignments: ServiceAssignment[];
  assignedCount: number;
}