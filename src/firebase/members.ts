import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  query, 
  where,
  Timestamp 
} from 'firebase/firestore';
import { db } from './config';
import type { Member, OnboardingFormData } from '@/types/member';

const MEMBERS_COLLECTION = 'members';

interface FirestoreMember extends Omit<Member, 'createdAt' | 'updatedAt'> {
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

function convertFirestoreToMember(firestoreMember: FirestoreMember): Member {
  return {
    ...firestoreMember,
    createdAt: firestoreMember.createdAt.toDate().toISOString(),
    updatedAt: firestoreMember.updatedAt.toDate().toISOString()
  };
}

function convertMemberToFirestore(member: Omit<Member, 'id'>): Omit<FirestoreMember, 'id'> {
  return {
    ...member,
    createdAt: Timestamp.fromDate(new Date(member.createdAt)),
    updatedAt: Timestamp.fromDate(new Date(member.updatedAt))
  };
}

export const membersService = {
  /**
   * Get member by Firebase user ID
   */
  async getMemberByFirebaseUserId(firebaseUserId: string): Promise<Member | null> {
    try {
      const q = query(
        collection(db, MEMBERS_COLLECTION), 
        where('firebaseUserId', '==', firebaseUserId)
      );
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }
      
      const doc = querySnapshot.docs[0];
      return convertFirestoreToMember({ id: doc.id, ...doc.data() } as FirestoreMember);
    } catch (error) {
      console.error('Error getting member by Firebase user ID:', error);
      throw new Error('Failed to fetch member');
    }
  },

  /**
   * Create a new member from onboarding data
   */
  async createMember(
    firebaseUserId: string, 
    email: string, 
    avatar: string | undefined,
    onboardingData: OnboardingFormData
  ): Promise<Member> {
    try {
      const now = new Date().toISOString();
      
      // Combine regular teams with custom team if provided
      const allTeams = [...onboardingData.teams];
      if (onboardingData.customTeam.trim()) {
        allTeams.push(onboardingData.customTeam.trim());
      }
      
      const memberData: Omit<Member, 'id'> = {
        firebaseUserId,
        email,
        avatar,
        firstName: onboardingData.firstName,
        lastName: onboardingData.lastName,
        fullName: `${onboardingData.firstName} ${onboardingData.lastName}`,
        teams: allTeams,
        availabilities: onboardingData.availabilities,
        isOnboardingCompleted: true,
        isAdmin: false, // Default to false, admin rights can be granted manually
        createdAt: now,
        updatedAt: now
      };
      
      const docRef = await addDoc(collection(db, MEMBERS_COLLECTION), convertMemberToFirestore(memberData));
      
      return {
        id: docRef.id,
        ...memberData
      };
    } catch (error) {
      console.error('Error creating member:', error);
      throw new Error('Failed to create member');
    }
  },

  /**
   * Update member information
   */
  async updateMember(memberId: string, updates: Partial<Omit<Member, 'id' | 'createdAt'>>): Promise<Member | null> {
    try {
      const docRef = doc(db, MEMBERS_COLLECTION, memberId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }
      
      const existingMember = convertFirestoreToMember({ id: docSnap.id, ...docSnap.data() } as FirestoreMember);
      const updatedMember: Member = {
        ...existingMember,
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      await updateDoc(docRef, convertMemberToFirestore(updatedMember));
      
      return updatedMember;
    } catch (error) {
      console.error('Error updating member:', error);
      throw new Error('Failed to update member');
    }
  },

  /**
   * Mark onboarding as completed for a member
   */
  async completeOnboarding(memberId: string): Promise<void> {
    try {
      await this.updateMember(memberId, { 
        isOnboardingCompleted: true,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error completing onboarding:', error);
      throw new Error('Failed to complete onboarding');
    }
  },

  /**
   * Check if user has completed onboarding
   */
  async hasCompletedOnboarding(firebaseUserId: string): Promise<boolean> {
    try {
      const member = await this.getMemberByFirebaseUserId(firebaseUserId);
      return member !== null && member.isOnboardingCompleted;
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      return false;
    }
  },

  /**
   * Get all members
   */
  async getAllMembers(): Promise<Member[]> {
    try {
      const querySnapshot = await getDocs(collection(db, MEMBERS_COLLECTION));
      return querySnapshot.docs.map(doc => 
        convertFirestoreToMember({ id: doc.id, ...doc.data() } as FirestoreMember)
      );
    } catch (error) {
      console.error('Error getting all members:', error);
      throw new Error('Failed to fetch members');
    }
  }
};