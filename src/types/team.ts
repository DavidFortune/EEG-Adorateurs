export type TeamRole = 'owner' | 'leader' | 'member' | 'guest';
export type TeamMemberStatus = 'pending' | 'approved' | 'rejected';

export interface TeamPosition {
  id: string;       // Format: "teamname-positionname" (lowercase, "-" as separator)
  name: string;     // Display name (original casing)
  order: number;    // For display ordering
}

export interface TeamMember {
  id: string;
  memberId: string;
  role: TeamRole;
  status: TeamMemberStatus;
  joinedAt: string;
  positionId?: string; // Default position for this member in this team
}

export interface Team {
  id: string;
  name: string;
  description: string;
  icon: string;
  ownerId: string;
  members: TeamMember[];
  positions?: TeamPosition[]; // Available positions for this team
  createdAt: string;
  updatedAt: string;
}

export interface TeamFormData {
  name: string;
  description: string;
  icon: string;
}