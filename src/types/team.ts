export type TeamRole = 'owner' | 'leader' | 'member' | 'guest';
export type TeamMemberStatus = 'pending' | 'approved' | 'rejected';

export interface TeamMember {
  id: string;
  memberId: string;
  role: TeamRole;
  status: TeamMemberStatus;
  joinedAt: string;
}

export interface Team {
  id: string;
  name: string;
  description: string;
  icon: string;
  ownerId: string;
  members: TeamMember[];
  createdAt: string;
  updatedAt: string;
}

export interface TeamFormData {
  name: string;
  description: string;
  icon: string;
}