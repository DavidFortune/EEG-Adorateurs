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
import type { 
  MemberAvailability, 
  ServiceAvailabilityRequest,
  ServiceAvailabilityResponse 
} from '@/types/availability';

const AVAILABILITY_COLLECTION = 'availability';

interface FirestoreAvailability extends Omit<MemberAvailability, 'submittedAt' | 'updatedAt'> {
  submittedAt: Timestamp;
  updatedAt: Timestamp;
}

function convertFirestoreToAvailability(firestoreAvailability: FirestoreAvailability): MemberAvailability {
  return {
    ...firestoreAvailability,
    submittedAt: firestoreAvailability.submittedAt.toDate().toISOString(),
    updatedAt: firestoreAvailability.updatedAt.toDate().toISOString()
  };
}

function convertAvailabilityToFirestore(availability: Omit<MemberAvailability, 'id'>): Omit<FirestoreAvailability, 'id'> {
  return {
    ...availability,
    submittedAt: Timestamp.fromDate(new Date(availability.submittedAt)),
    updatedAt: Timestamp.fromDate(new Date(availability.updatedAt))
  };
}

export const availabilityService = {
  /**
   * Submit or update member availability for a service
   */
  async submitAvailability(request: ServiceAvailabilityRequest): Promise<MemberAvailability> {
    try {
      // Check if availability already exists
      const q = query(
        collection(db, AVAILABILITY_COLLECTION),
        where('serviceId', '==', request.serviceId),
        where('memberId', '==', request.memberId)
      );
      const querySnapshot = await getDocs(q);

      const now = new Date().toISOString();

      if (!querySnapshot.empty) {
        // Update existing availability
        const existingDoc = querySnapshot.docs[0];
        const updatedAvailability: MemberAvailability = {
          id: existingDoc.id,
          serviceId: request.serviceId,
          memberId: request.memberId,
          status: request.status,
          comment: request.comment,
          submittedAt: convertFirestoreToAvailability(existingDoc.data() as FirestoreAvailability).submittedAt,
          updatedAt: now
        };

        await updateDoc(
          doc(db, AVAILABILITY_COLLECTION, existingDoc.id),
          convertAvailabilityToFirestore(updatedAvailability)
        );

        return updatedAvailability;
      } else {
        // Create new availability
        const newAvailability: Omit<MemberAvailability, 'id'> = {
          serviceId: request.serviceId,
          memberId: request.memberId,
          status: request.status,
          comment: request.comment,
          submittedAt: now,
          updatedAt: now
        };

        const docRef = await addDoc(
          collection(db, AVAILABILITY_COLLECTION),
          convertAvailabilityToFirestore(newAvailability)
        );

        return {
          id: docRef.id,
          ...newAvailability
        };
      }
    } catch (error) {
      console.error('Error submitting availability:', error);
      throw new Error('Failed to submit availability');
    }
  },

  /**
   * Get availability for a specific service
   */
  async getServiceAvailability(serviceId: string): Promise<ServiceAvailabilityResponse> {
    try {
      const q = query(
        collection(db, AVAILABILITY_COLLECTION),
        where('serviceId', '==', serviceId)
      );
      const querySnapshot = await getDocs(q);
      
      const submissions = querySnapshot.docs.map(doc => 
        convertFirestoreToAvailability({ id: doc.id, ...doc.data() } as FirestoreAvailability)
      );

      const totalResponses = submissions.length;
      const availableCount = submissions.filter(s => s.status === 'available').length;
      const unavailableCount = submissions.filter(s => s.status === 'unavailable').length;
      const maybeCount = submissions.filter(s => s.status === 'maybe').length;

      return {
        serviceId,
        submissions,
        totalResponses,
        availableCount,
        unavailableCount,
        maybeCount,
        noResponseCount: 0 // This would need to be calculated based on total team members
      };
    } catch (error) {
      console.error('Error getting service availability:', error);
      throw new Error('Failed to fetch service availability');
    }
  },

  /**
   * Get member's availability for a specific service
   */
  async getMemberAvailability(serviceId: string, memberId: string): Promise<MemberAvailability | null> {
    try {
      const q = query(
        collection(db, AVAILABILITY_COLLECTION),
        where('serviceId', '==', serviceId),
        where('memberId', '==', memberId)
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return null;
      }

      const doc = querySnapshot.docs[0];
      return convertFirestoreToAvailability({ id: doc.id, ...doc.data() } as FirestoreAvailability);
    } catch (error) {
      console.error('Error getting member availability:', error);
      throw new Error('Failed to fetch member availability');
    }
  },

  /**
   * Get all availability submissions for a member
   */
  async getMemberAvailabilities(memberId: string): Promise<MemberAvailability[]> {
    try {
      const q = query(
        collection(db, AVAILABILITY_COLLECTION),
        where('memberId', '==', memberId)
      );
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => 
        convertFirestoreToAvailability({ id: doc.id, ...doc.data() } as FirestoreAvailability)
      );
    } catch (error) {
      console.error('Error getting member availabilities:', error);
      throw new Error('Failed to fetch member availabilities');
    }
  },

  /**
   * Delete availability submission
   */
  async deleteAvailability(availabilityId: string): Promise<boolean> {
    try {
      await deleteDoc(doc(db, AVAILABILITY_COLLECTION, availabilityId));
      return true;
    } catch (error) {
      console.error('Error deleting availability:', error);
      throw new Error('Failed to delete availability');
    }
  }
};