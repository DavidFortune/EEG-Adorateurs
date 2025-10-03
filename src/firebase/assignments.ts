import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  deleteDoc,
  query, 
  where,
  Timestamp 
} from 'firebase/firestore';
import { db } from './config';
import type { 
  ServiceAssignment, 
  CreateAssignmentRequest,
  ServiceTeamAssignments 
} from '@/types/assignment';

const ASSIGNMENTS_COLLECTION = 'assignments';

interface FirestoreAssignment extends Omit<ServiceAssignment, 'assignedAt'> {
  assignedAt: Timestamp;
}

function convertFirestoreToAssignment(firestoreAssignment: FirestoreAssignment): ServiceAssignment {
  return {
    ...firestoreAssignment,
    assignedAt: firestoreAssignment.assignedAt.toDate().toISOString()
  };
}

function convertAssignmentToFirestore(assignment: Omit<ServiceAssignment, 'id'>): Omit<FirestoreAssignment, 'id'> {
  return {
    ...assignment,
    assignedAt: Timestamp.fromDate(new Date(assignment.assignedAt))
  };
}

export const assignmentsService = {
  /**
   * Create a new assignment
   */
  async createAssignment(request: CreateAssignmentRequest, memberName: string, teamName: string): Promise<ServiceAssignment> {
    try {
      // First check if member already has an assignment for this service
      const existingAssignments = await this.getMemberServiceAssignments(request.serviceId, request.memberId);
      
      // If member already has assignments for this service, remove them first
      if (existingAssignments.length > 0) {
        for (const assignment of existingAssignments) {
          await deleteDoc(doc(db, ASSIGNMENTS_COLLECTION, assignment.id));
        }
      }

      const assignmentData: Omit<ServiceAssignment, 'id'> = {
        serviceId: request.serviceId,
        teamId: request.teamId,
        teamName,
        memberId: request.memberId,
        memberName,
        assignedAt: new Date().toISOString(),
        assignedBy: request.assignedBy
      };

      const docRef = await addDoc(
        collection(db, ASSIGNMENTS_COLLECTION),
        convertAssignmentToFirestore(assignmentData)
      );

      return {
        id: docRef.id,
        ...assignmentData
      };
    } catch (error) {
      console.error('Error creating assignment:', error);
      throw new Error('Failed to create assignment');
    }
  },

  /**
   * Remove an assignment - removes ALL assignments for a member in a service
   */
  async removeAssignment(serviceId: string, _teamId: string, memberId: string): Promise<boolean> {
    try {
      // Get all assignments for this member in this service (not just this team)
      const memberAssignments = await this.getMemberServiceAssignments(serviceId, memberId);
      
      if (memberAssignments.length === 0) {
        return false;
      }

      // Remove all assignments for this member in this service
      for (const assignment of memberAssignments) {
        await deleteDoc(doc(db, ASSIGNMENTS_COLLECTION, assignment.id));
      }
      
      return true;
    } catch (error) {
      console.error('Error removing assignment:', error);
      throw new Error('Failed to remove assignment');
    }
  },

  /**
   * Get all assignments for a service
   */
  async getServiceAssignments(serviceId: string): Promise<ServiceAssignment[]> {
    try {
      const q = query(
        collection(db, ASSIGNMENTS_COLLECTION),
        where('serviceId', '==', serviceId)
      );
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => 
        convertFirestoreToAssignment({ id: doc.id, ...doc.data() } as FirestoreAssignment)
      );
    } catch (error) {
      console.error('Error getting service assignments:', error);
      throw new Error('Failed to fetch service assignments');
    }
  },

  /**
   * Get assignments for a specific team in a service
   */
  async getTeamAssignments(serviceId: string, teamId: string): Promise<ServiceAssignment[]> {
    try {
      const q = query(
        collection(db, ASSIGNMENTS_COLLECTION),
        where('serviceId', '==', serviceId),
        where('teamId', '==', teamId)
      );
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => 
        convertFirestoreToAssignment({ id: doc.id, ...doc.data() } as FirestoreAssignment)
      );
    } catch (error) {
      console.error('Error getting team assignments:', error);
      throw new Error('Failed to fetch team assignments');
    }
  },

  /**
   * Check if a member is assigned to a team for a service
   */
  async isMemberAssigned(serviceId: string, teamId: string, memberId: string): Promise<boolean> {
    try {
      const q = query(
        collection(db, ASSIGNMENTS_COLLECTION),
        where('serviceId', '==', serviceId),
        where('teamId', '==', teamId),
        where('memberId', '==', memberId)
      );
      const querySnapshot = await getDocs(q);

      return !querySnapshot.empty;
    } catch (error) {
      console.error('Error checking member assignment:', error);
      return false;
    }
  },

  /**
   * Get member's assignments for a service
   */
  async getMemberServiceAssignments(serviceId: string, memberId: string): Promise<ServiceAssignment[]> {
    try {
      const q = query(
        collection(db, ASSIGNMENTS_COLLECTION),
        where('serviceId', '==', serviceId),
        where('memberId', '==', memberId)
      );
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => 
        convertFirestoreToAssignment({ id: doc.id, ...doc.data() } as FirestoreAssignment)
      );
    } catch (error) {
      console.error('Error getting member service assignments:', error);
      throw new Error('Failed to fetch member service assignments');
    }
  },

  /**
   * Get all assignments for a team across all services
   */
  async getAllTeamAssignments(teamId: string): Promise<ServiceAssignment[]> {
    try {
      const q = query(
        collection(db, ASSIGNMENTS_COLLECTION),
        where('teamId', '==', teamId)
      );
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc =>
        convertFirestoreToAssignment({ id: doc.id, ...doc.data() } as FirestoreAssignment)
      );
    } catch (error) {
      console.error('Error getting all team assignments:', error);
      throw new Error('Failed to fetch all team assignments');
    }
  },

  /**
   * Get all assignments for a member across all services
   */
  async getAllMemberAssignments(memberId: string): Promise<ServiceAssignment[]> {
    try {
      const q = query(
        collection(db, ASSIGNMENTS_COLLECTION),
        where('memberId', '==', memberId)
      );
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc =>
        convertFirestoreToAssignment({ id: doc.id, ...doc.data() } as FirestoreAssignment)
      );
    } catch (error) {
      console.error('Error getting all member assignments:', error);
      throw new Error('Failed to fetch all member assignments');
    }
  }
};