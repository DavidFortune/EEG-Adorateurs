import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query, 
  where,
  Timestamp 
} from 'firebase/firestore';
import { db } from './config';
import type { Team, TeamFormData, TeamMember } from '@/types/team';

const TEAMS_COLLECTION = 'teams';

interface FirestoreTeam extends Omit<Team, 'createdAt' | 'updatedAt'> {
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

function convertFirestoreToTeam(firestoreTeam: FirestoreTeam): Team {
  return {
    ...firestoreTeam,
    createdAt: firestoreTeam.createdAt.toDate().toISOString(),
    updatedAt: firestoreTeam.updatedAt.toDate().toISOString()
  };
}

function convertTeamToFirestore(team: Omit<Team, 'id'>): Omit<FirestoreTeam, 'id'> {
  return {
    ...team,
    createdAt: Timestamp.fromDate(new Date(team.createdAt)),
    updatedAt: Timestamp.fromDate(new Date(team.updatedAt))
  };
}

export const teamsService = {
  /**
   * Get all teams
   */
  async getAllTeams(): Promise<Team[]> {
    try {
      const querySnapshot = await getDocs(collection(db, TEAMS_COLLECTION));
      return querySnapshot.docs.map(doc => 
        convertFirestoreToTeam({ id: doc.id, ...doc.data() } as FirestoreTeam)
      );
    } catch (error) {
      console.error('Error getting all teams:', error);
      throw new Error('Failed to fetch teams');
    }
  },

  /**
   * Get team by ID
   */
  async getTeamById(teamId: string): Promise<Team | null> {
    try {
      const docRef = doc(db, TEAMS_COLLECTION, teamId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }
      
      return convertFirestoreToTeam({ id: docSnap.id, ...docSnap.data() } as FirestoreTeam);
    } catch (error) {
      console.error('Error getting team by ID:', error);
      throw new Error('Failed to fetch team');
    }
  },

  /**
   * Create a new team
   */
  async createTeam(ownerId: string, formData: TeamFormData): Promise<Team> {
    try {
      const now = new Date().toISOString();
      
      const teamData: Omit<Team, 'id'> = {
        name: formData.name,
        description: formData.description,
        icon: formData.icon,
        ownerId,
        members: [{
          id: crypto.randomUUID(),
          memberId: ownerId,
          role: 'owner',
          status: 'approved',
          joinedAt: now
        }],
        createdAt: now,
        updatedAt: now
      };
      
      const docRef = await addDoc(collection(db, TEAMS_COLLECTION), convertTeamToFirestore(teamData));
      
      return {
        id: docRef.id,
        ...teamData
      };
    } catch (error) {
      console.error('Error creating team:', error);
      throw new Error('Failed to create team');
    }
  },

  /**
   * Update team information
   */
  async updateTeam(teamId: string, updates: Partial<TeamFormData>): Promise<Team | null> {
    try {
      const docRef = doc(db, TEAMS_COLLECTION, teamId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      const existingTeam = convertFirestoreToTeam({ id: docSnap.id, ...docSnap.data() } as FirestoreTeam);
      const updatedTeam: Team = {
        ...existingTeam,
        ...updates,
        updatedAt: new Date().toISOString()
      };

      const { id, ...teamDataWithoutId } = updatedTeam;
      await updateDoc(docRef, convertTeamToFirestore(teamDataWithoutId));

      return updatedTeam;
    } catch (error) {
      console.error('Error updating team:', error);
      throw new Error('Failed to update team');
    }
  },

  /**
   * Delete team (only if no members other than owner)
   */
  async deleteTeam(teamId: string): Promise<boolean> {
    try {
      const team = await this.getTeamById(teamId);
      
      if (!team) {
        return false;
      }
      
      // Check if team has only the owner as member
      const nonOwnerMembers = team.members.filter(member => member.role !== 'owner');
      if (nonOwnerMembers.length > 0) {
        throw new Error('Cannot delete team with assigned members');
      }
      
      const docRef = doc(db, TEAMS_COLLECTION, teamId);
      await deleteDoc(docRef);
      
      return true;
    } catch (error) {
      console.error('Error deleting team:', error);
      throw error;
    }
  },

  /**
   * Add member to team (approved by admin/owner/leader)
   */
  async addMemberToTeam(teamId: string, memberId: string, role: 'leader' | 'member' | 'guest' = 'member'): Promise<Team | null> {
    try {
      const team = await this.getTeamById(teamId);

      if (!team) {
        return null;
      }

      // Check if member is already in team
      const existingMember = team.members.find(m => m.memberId === memberId);
      if (existingMember) {
        throw new Error('Member is already in this team');
      }

      const newMember: TeamMember = {
        id: crypto.randomUUID(),
        memberId,
        role,
        status: 'approved',
        joinedAt: new Date().toISOString()
      };

      const updatedTeam: Team = {
        ...team,
        members: [...team.members, newMember],
        updatedAt: new Date().toISOString()
      };

      const docRef = doc(db, TEAMS_COLLECTION, teamId);
      const { id, ...teamDataWithoutId } = updatedTeam;
      await updateDoc(docRef, convertTeamToFirestore(teamDataWithoutId));

      return updatedTeam;
    } catch (error) {
      console.error('Error adding member to team:', error);
      throw error;
    }
  },

  /**
   * Request to join team (pending status)
   */
  async requestToJoinTeam(teamId: string, memberId: string): Promise<Team | null> {
    try {
      const team = await this.getTeamById(teamId);

      if (!team) {
        return null;
      }

      // Check if member is already in team or has a pending request
      const existingMember = team.members.find(m => m.memberId === memberId);
      if (existingMember) {
        throw new Error('Member already has a request or membership in this team');
      }

      const newMember: TeamMember = {
        id: crypto.randomUUID(),
        memberId,
        role: 'member', // Default role, can be changed when approved
        status: 'pending',
        joinedAt: new Date().toISOString()
      };

      const updatedTeam: Team = {
        ...team,
        members: [...team.members, newMember],
        updatedAt: new Date().toISOString()
      };

      const docRef = doc(db, TEAMS_COLLECTION, teamId);
      const { id, ...teamDataWithoutId } = updatedTeam;
      await updateDoc(docRef, convertTeamToFirestore(teamDataWithoutId));

      return updatedTeam;
    } catch (error) {
      console.error('Error requesting to join team:', error);
      throw error;
    }
  },

  /**
   * Approve pending member
   */
  async approvePendingMember(teamId: string, memberId: string, role: 'leader' | 'member' | 'guest'): Promise<Team | null> {
    try {
      const team = await this.getTeamById(teamId);

      if (!team) {
        return null;
      }

      const updatedMembers = team.members.map(member =>
        member.memberId === memberId && member.status === 'pending'
          ? { ...member, status: 'approved' as const, role }
          : member
      );

      const updatedTeam: Team = {
        ...team,
        members: updatedMembers,
        updatedAt: new Date().toISOString()
      };

      const docRef = doc(db, TEAMS_COLLECTION, teamId);
      const { id, ...teamDataWithoutId } = updatedTeam;
      await updateDoc(docRef, convertTeamToFirestore(teamDataWithoutId));

      return updatedTeam;
    } catch (error) {
      console.error('Error approving pending member:', error);
      throw error;
    }
  },

  /**
   * Reject pending member (removes them from team)
   */
  async rejectPendingMember(teamId: string, memberId: string): Promise<Team | null> {
    try {
      const team = await this.getTeamById(teamId);

      if (!team) {
        return null;
      }

      const updatedMembers = team.members.filter(
        member => !(member.memberId === memberId && member.status === 'pending')
      );

      const updatedTeam: Team = {
        ...team,
        members: updatedMembers,
        updatedAt: new Date().toISOString()
      };

      const docRef = doc(db, TEAMS_COLLECTION, teamId);
      const { id, ...teamDataWithoutId } = updatedTeam;
      await updateDoc(docRef, convertTeamToFirestore(teamDataWithoutId));

      return updatedTeam;
    } catch (error) {
      console.error('Error rejecting pending member:', error);
      throw error;
    }
  },

  /**
   * Remove member from team
   */
  async removeMemberFromTeam(teamId: string, memberId: string): Promise<Team | null> {
    try {
      const team = await this.getTeamById(teamId);

      if (!team) {
        return null;
      }

      // Cannot remove owner
      const memberToRemove = team.members.find(m => m.memberId === memberId);
      if (memberToRemove?.role === 'owner') {
        throw new Error('Cannot remove team owner');
      }

      const updatedTeam: Team = {
        ...team,
        members: team.members.filter(m => m.memberId !== memberId),
        updatedAt: new Date().toISOString()
      };

      const docRef = doc(db, TEAMS_COLLECTION, teamId);
      const { id, ...teamDataWithoutId } = updatedTeam;
      await updateDoc(docRef, convertTeamToFirestore(teamDataWithoutId));

      return updatedTeam;
    } catch (error) {
      console.error('Error removing member from team:', error);
      throw error;
    }
  },

  /**
   * Update member role in team
   */
  async updateMemberRole(teamId: string, memberId: string, newRole: 'leader' | 'member' | 'guest'): Promise<Team | null> {
    try {
      const team = await this.getTeamById(teamId);

      if (!team) {
        return null;
      }

      // Cannot change owner role
      const memberToUpdate = team.members.find(m => m.memberId === memberId);
      if (memberToUpdate?.role === 'owner') {
        throw new Error('Cannot change owner role');
      }

      const updatedMembers = team.members.map(member =>
        member.memberId === memberId
          ? { ...member, role: newRole }
          : member
      );

      const updatedTeam: Team = {
        ...team,
        members: updatedMembers,
        updatedAt: new Date().toISOString()
      };

      const docRef = doc(db, TEAMS_COLLECTION, teamId);
      const { id, ...teamDataWithoutId } = updatedTeam;
      await updateDoc(docRef, convertTeamToFirestore(teamDataWithoutId));

      return updatedTeam;
    } catch (error) {
      console.error('Error updating member role:', error);
      throw error;
    }
  },

  /**
   * Transfer team ownership to another member
   */
  async transferOwnership(teamId: string, newOwnerId: string): Promise<Team | null> {
    try {
      const team = await this.getTeamById(teamId);

      if (!team) {
        return null;
      }

      // Check if new owner is already in the team
      const newOwnerMember = team.members.find(m => m.memberId === newOwnerId);
      if (!newOwnerMember) {
        throw new Error('New owner must be a member of the team');
      }

      // Find current owner
      const currentOwner = team.members.find(m => m.role === 'owner');
      if (!currentOwner) {
        throw new Error('Current owner not found');
      }

      // Update members: change current owner to leader, change new owner to owner
      const updatedMembers = team.members.map(member => {
        if (member.role === 'owner') {
          return { ...member, role: 'leader' as const };
        }
        if (member.memberId === newOwnerId) {
          return { ...member, role: 'owner' as const };
        }
        return member;
      });

      const updatedTeam: Team = {
        ...team,
        ownerId: newOwnerId,
        members: updatedMembers,
        updatedAt: new Date().toISOString()
      };

      const docRef = doc(db, TEAMS_COLLECTION, teamId);
      const { id, ...teamDataWithoutId } = updatedTeam;
      await updateDoc(docRef, convertTeamToFirestore(teamDataWithoutId));

      return updatedTeam;
    } catch (error) {
      console.error('Error transferring ownership:', error);
      throw error;
    }
  },

  /**
   * Get all teams that a member belongs to
   */
  async getMemberTeams(memberId: string): Promise<Team[]> {
    try {
      const allTeams = await this.getAllTeams();

      // Filter teams where the member is in the members array
      return allTeams.filter(team =>
        team.members.some(member => member.memberId === memberId)
      );
    } catch (error) {
      console.error('Error getting member teams:', error);
      throw new Error('Failed to fetch member teams');
    }
  }
};