import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query, 
  orderBy,
  where,
  Timestamp 
} from 'firebase/firestore';
import { db } from './config';
import type { Ministry } from '@/types/member';

const MINISTRIES_COLLECTION = 'ministries';

interface FirestoreMinistry extends Omit<Ministry, 'createdAt' | 'updatedAt'> {
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

function convertFirestoreToMinistry(firestoreMinistry: FirestoreMinistry): Ministry {
  return {
    ...firestoreMinistry,
    createdAt: firestoreMinistry.createdAt.toDate().toISOString(),
    updatedAt: firestoreMinistry.updatedAt.toDate().toISOString()
  };
}

function convertMinistryToFirestore(ministry: Omit<Ministry, 'id'>): Omit<FirestoreMinistry, 'id'> {
  return {
    ...ministry,
    createdAt: Timestamp.fromDate(new Date(ministry.createdAt)),
    updatedAt: Timestamp.fromDate(new Date(ministry.updatedAt))
  };
}

export const ministriesService = {
  /**
   * Get all active ministries ordered by order field
   */
  async getActiveMinistries(): Promise<Ministry[]> {
    try {
      const q = query(
        collection(db, MINISTRIES_COLLECTION), 
        where('isActive', '==', true),
        orderBy('order', 'asc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => 
        convertFirestoreToMinistry({ id: doc.id, ...doc.data() } as FirestoreMinistry)
      );
    } catch (error) {
      console.error('Error getting active ministries:', error);
      throw new Error('Failed to fetch ministries');
    }
  },

  /**
   * Get all ministries (active and inactive)
   */
  async getAllMinistries(): Promise<Ministry[]> {
    try {
      const q = query(
        collection(db, MINISTRIES_COLLECTION),
        orderBy('order', 'asc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => 
        convertFirestoreToMinistry({ id: doc.id, ...doc.data() } as FirestoreMinistry)
      );
    } catch (error) {
      console.error('Error getting all ministries:', error);
      throw new Error('Failed to fetch ministries');
    }
  },

  /**
   * Create a new ministry
   */
  async createMinistry(
    name: string, 
    description: string = '', 
    order: number = 0
  ): Promise<Ministry> {
    try {
      const now = new Date().toISOString();
      
      const ministryData: Omit<Ministry, 'id'> = {
        name,
        description,
        isActive: true,
        order,
        createdAt: now,
        updatedAt: now
      };
      
      const docRef = await addDoc(collection(db, MINISTRIES_COLLECTION), convertMinistryToFirestore(ministryData));
      
      return {
        id: docRef.id,
        ...ministryData
      };
    } catch (error) {
      console.error('Error creating ministry:', error);
      throw new Error('Failed to create ministry');
    }
  },

  /**
   * Update ministry information
   */
  async updateMinistry(ministryId: string, updates: Partial<Omit<Ministry, 'id' | 'createdAt'>>): Promise<Ministry | null> {
    try {
      const docRef = doc(db, MINISTRIES_COLLECTION, ministryId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }
      
      const existingMinistry = convertFirestoreToMinistry({ id: docSnap.id, ...docSnap.data() } as FirestoreMinistry);
      const updatedMinistry: Ministry = {
        ...existingMinistry,
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      await updateDoc(docRef, convertMinistryToFirestore(updatedMinistry));
      
      return updatedMinistry;
    } catch (error) {
      console.error('Error updating ministry:', error);
      throw new Error('Failed to update ministry');
    }
  },

  /**
   * Delete a ministry
   */
  async deleteMinistry(ministryId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, MINISTRIES_COLLECTION, ministryId));
    } catch (error) {
      console.error('Error deleting ministry:', error);
      throw new Error('Failed to delete ministry');
    }
  },

  /**
   * Get ministry by name
   */
  async getMinistryByName(name: string): Promise<Ministry | null> {
    try {
      const q = query(
        collection(db, MINISTRIES_COLLECTION), 
        where('name', '==', name)
      );
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }
      
      const doc = querySnapshot.docs[0];
      return convertFirestoreToMinistry({ id: doc.id, ...doc.data() } as FirestoreMinistry);
    } catch (error) {
      console.error('Error getting ministry by name:', error);
      throw new Error('Failed to fetch ministry');
    }
  },

  /**
   * Create ministry if it doesn't exist
   */
  async createMinistryIfNotExists(name: string): Promise<Ministry> {
    try {
      // Check if ministry already exists
      const existingMinistry = await this.getMinistryByName(name);
      if (existingMinistry) {
        return existingMinistry;
      }

      // Get the highest order number to append new ministry at the end
      const allMinistries = await this.getAllMinistries();
      const maxOrder = allMinistries.reduce((max, ministry) => Math.max(max, ministry.order), 0);

      // Create new ministry
      return await this.createMinistry(name, '', maxOrder + 1);
    } catch (error) {
      console.error('Error creating ministry if not exists:', error);
      throw new Error('Failed to create ministry');
    }
  },

  /**
   * Ensure all ministries exist in the collection
   */
  async ensureMinistriesExist(ministryNames: string[]): Promise<Ministry[]> {
    try {
      const promises = ministryNames.map(name => this.createMinistryIfNotExists(name));
      return await Promise.all(promises);
    } catch (error) {
      console.error('Error ensuring ministries exist:', error);
      throw new Error('Failed to ensure ministries exist');
    }
  },

  /**
   * Initialize default ministries (call once to populate the collection)
   */
  async initializeDefaultMinistries(): Promise<void> {
    try {
      const defaultMinistries = [
        { name: 'Accueil', order: 1 },
        { name: 'Audiovisuel', order: 2 },
        { name: 'Diacre', order: 3 },
        { name: 'Dirigeant', order: 4 },
        { name: 'Louange', order: 5 },
        { name: 'Musicien', order: 6 },
        { name: 'Prédicateur', order: 7 },
        { name: 'Sécurité', order: 8 }
      ];

      // Check if ministries already exist
      const existingMinistries = await this.getAllMinistries();
      if (existingMinistries.length > 0) {
        console.log('Ministries already initialized');
        return;
      }

      // Create all default ministries
      const promises = defaultMinistries.map(ministry => 
        this.createMinistry(ministry.name, '', ministry.order)
      );
      
      await Promise.all(promises);
      console.log('Default ministries initialized successfully');
    } catch (error) {
      console.error('Error initializing default ministries:', error);
      throw new Error('Failed to initialize ministries');
    }
  }
};