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
   * Remove an assignment
   */
  async removeAssignment(serviceId: string, teamId: string, memberId: string): Promise<boolean> {
    try {
      const q = query(
        collection(db, ASSIGNMENTS_COLLECTION),
        where('serviceId', '==', serviceId),
        where('teamId', '==', teamId),
        where('memberId', '==', memberId)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const assignmentDoc = querySnapshot.docs[0];
        await deleteDoc(doc(db, ASSIGNMENTS_COLLECTION, assignmentDoc.id));
        return true;
      }
      return false;
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
  }
};