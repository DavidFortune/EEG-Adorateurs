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
import { ministriesService } from './ministries';

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
  // Filter out undefined values and empty strings to prevent Firebase errors
  const cleanMember = Object.fromEntries(
    Object.entries(member).filter(([key, value]) => {
      if (value === undefined) return false;
      if (key === 'avatar' && (value === '' || value === null)) return false;
      return true;
    })
  ) as Omit<Member, 'id'>;
  
  return {
    ...cleanMember,
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
      
      // Combine regular ministries with custom ministry if provided
      const ministries = onboardingData.ministries || [];
      const customMinistry = onboardingData.customMinistry || '';
      const allMinistries = [...ministries];
      if (customMinistry.trim()) {
        allMinistries.push(customMinistry.trim());
      }

      // Create ministries in the collection if they don't exist
      if (allMinistries.length > 0) {
        try {
          await ministriesService.ensureMinistriesExist(allMinistries);
          console.log('Ministries ensured to exist:', allMinistries);
        } catch (error) {
          console.warn('Failed to create ministries in collection:', error);
          // Continue with member creation even if ministry creation fails
        }
      }
      
      // Extract firstName and lastName from fullName
      const nameParts = onboardingData.fullName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      const memberData: Omit<Member, 'id'> = {
        firebaseUserId,
        email,
        ...(avatar && avatar.trim() && { avatar }), // Only include avatar if it exists and is not empty
        firstName,
        lastName,
        fullName: onboardingData.fullName,
        ministries: allMinistries,
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
      
      // If ministries are being updated, ensure they exist in the collection
      if (updates.ministries && updates.ministries.length > 0) {
        try {
          await ministriesService.ensureMinistriesExist(updates.ministries);
          console.log('Ministries ensured to exist:', updates.ministries);
        } catch (error) {
          console.warn('Failed to create ministries in collection:', error);
          // Continue with member update even if ministry creation fails
        }
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