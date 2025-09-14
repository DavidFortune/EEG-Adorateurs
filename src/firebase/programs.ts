import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  getDocs,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db } from './config';
import type { ServiceProgram, ProgramSection, ProgramItem } from '@/types/program';

export interface FirestoreProgram extends Omit<ServiceProgram, 'createdAt' | 'updatedAt'> {
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
  updatedBy: string;
}

const PROGRAMS_COLLECTION = 'programs';

/**
 * Get program by service ID
 */
export const getProgramByServiceId = async (serviceId: string): Promise<ServiceProgram | null> => {
  try {
    const q = query(
      collection(db, PROGRAMS_COLLECTION), 
      where('serviceId', '==', serviceId)
    );
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const doc = querySnapshot.docs[0];
    const data = doc.data() as FirestoreProgram;
    
    return {
      ...data,
      id: doc.id,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate()
    };
  } catch (error) {
    console.error('Error fetching program:', error);
    throw error;
  }
};

/**
 * Create a new program
 */
export const createProgram = async (
  program: Omit<ServiceProgram, 'id' | 'createdAt' | 'updatedAt'>, 
  userId: string
): Promise<ServiceProgram> => {
  console.log('Firebase createProgram called with:', { program, userId });
  
  try {
    const programRef = doc(collection(db, PROGRAMS_COLLECTION));
    const now = serverTimestamp();
    
    console.log('Program ref created:', programRef.id);
    console.log('Program sections:', program.sections);
    
    // Generate IDs for sections that don't have them
    const sectionsWithIds = (program.sections || []).map(section => ({
      ...section,
      id: section.id || `section_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
    }));
    
    console.log('Sections with IDs:', sectionsWithIds);
    
    const programData: any = {
      ...program,
      sections: sectionsWithIds,
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
      updatedBy: userId
    };
    
    console.log('Program data to save:', programData);
    
    await setDoc(programRef, programData);
    console.log('Document saved successfully');
    
    // Get the created document to return with proper timestamps
    const createdDoc = await getDoc(programRef);
    console.log('Document retrieved, exists:', createdDoc.exists());
    
    if (!createdDoc.exists()) {
      throw new Error('Program document was not created');
    }
    
    const createdData = createdDoc.data() as FirestoreProgram;
    console.log('Created data:', createdData);
    
    return {
      ...createdData,
      id: programRef.id,
      createdAt: createdData.createdAt.toDate(),
      updatedAt: createdData.updatedAt.toDate()
    };
  } catch (error) {
    console.error('Error creating program:', error);
    throw error;
  }
};

/**
 * Update an existing program
 */
export const updateProgram = async (
  programId: string, 
  updates: Partial<Omit<ServiceProgram, 'id' | 'createdAt' | 'updatedAt'>>,
  userId: string
): Promise<void> => {
  try {
    const programRef = doc(db, PROGRAMS_COLLECTION, programId);
    
    await updateDoc(programRef, {
      ...updates,
      updatedAt: serverTimestamp(),
      updatedBy: userId
    });
  } catch (error) {
    console.error('Error updating program:', error);
    throw error;
  }
};

/**
 * Delete a program
 */
export const deleteProgram = async (programId: string): Promise<void> => {
  try {
    const programRef = doc(db, PROGRAMS_COLLECTION, programId);
    await deleteDoc(programRef);
  } catch (error) {
    console.error('Error deleting program:', error);
    throw error;
  }
};

/**
 * Add section to program
 */
export const addSectionToProgram = async (
  programId: string, 
  section: Omit<ProgramSection, 'id'>, 
  userId: string
): Promise<ProgramSection> => {
  try {
    const programRef = doc(db, PROGRAMS_COLLECTION, programId);
    const programDoc = await getDoc(programRef);
    
    if (!programDoc.exists()) {
      throw new Error('Program not found');
    }
    
    const programData = programDoc.data() as FirestoreProgram;
    const newSection: ProgramSection = {
      ...section,
      id: `section_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
    };
    
    const updatedSections = [...programData.sections, newSection];
    
    await updateDoc(programRef, {
      sections: updatedSections,
      updatedAt: serverTimestamp(),
      updatedBy: userId
    });
    
    return newSection;
  } catch (error) {
    console.error('Error adding section:', error);
    throw error;
  }
};

/**
 * Update section in program
 */
export const updateSectionInProgram = async (
  programId: string, 
  sectionId: string, 
  updates: Partial<Omit<ProgramSection, 'id'>>,
  userId: string
): Promise<void> => {
  try {
    const programRef = doc(db, PROGRAMS_COLLECTION, programId);
    const programDoc = await getDoc(programRef);
    
    if (!programDoc.exists()) {
      throw new Error('Program not found');
    }
    
    const programData = programDoc.data() as FirestoreProgram;
    const updatedSections = programData.sections.map(section => 
      section.id === sectionId 
        ? { ...section, ...updates }
        : section
    );
    
    await updateDoc(programRef, {
      sections: updatedSections,
      updatedAt: serverTimestamp(),
      updatedBy: userId
    });
  } catch (error) {
    console.error('Error updating section:', error);
    throw error;
  }
};

/**
 * Delete section from program
 */
export const deleteSectionFromProgram = async (
  programId: string, 
  sectionId: string, 
  userId: string
): Promise<void> => {
  try {
    const programRef = doc(db, PROGRAMS_COLLECTION, programId);
    const programDoc = await getDoc(programRef);
    
    if (!programDoc.exists()) {
      throw new Error('Program not found');
    }
    
    const programData = programDoc.data() as FirestoreProgram;
    const updatedSections = programData.sections.filter(section => section.id !== sectionId);
    // Also remove all items from this section
    const updatedItems = programData.items.filter(item => item.sectionId !== sectionId);
    
    await updateDoc(programRef, {
      sections: updatedSections,
      items: updatedItems,
      updatedAt: serverTimestamp(),
      updatedBy: userId
    });
  } catch (error) {
    console.error('Error deleting section:', error);
    throw error;
  }
};

/**
 * Add item to program
 */
export const addItemToProgram = async (
  programId: string, 
  item: Omit<ProgramItem, 'id'>, 
  userId: string
): Promise<ProgramItem> => {
  try {
    const programRef = doc(db, PROGRAMS_COLLECTION, programId);
    const programDoc = await getDoc(programRef);
    
    if (!programDoc.exists()) {
      throw new Error('Program not found');
    }
    
    const programData = programDoc.data() as FirestoreProgram;
    const newItem: ProgramItem = {
      ...item,
      id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
    };
    
    const updatedItems = [...programData.items, newItem];
    
    await updateDoc(programRef, {
      items: updatedItems,
      updatedAt: serverTimestamp(),
      updatedBy: userId
    });
    
    return newItem;
  } catch (error) {
    console.error('Error adding item:', error);
    throw error;
  }
};

/**
 * Update item in program
 */
export const updateItemInProgram = async (
  programId: string, 
  itemId: string, 
  updates: Partial<Omit<ProgramItem, 'id'>>,
  userId: string
): Promise<void> => {
  try {
    const programRef = doc(db, PROGRAMS_COLLECTION, programId);
    const programDoc = await getDoc(programRef);
    
    if (!programDoc.exists()) {
      throw new Error('Program not found');
    }
    
    const programData = programDoc.data() as FirestoreProgram;
    const updatedItems = programData.items.map(item => 
      item.id === itemId 
        ? { ...item, ...updates }
        : item
    );
    
    await updateDoc(programRef, {
      items: updatedItems,
      updatedAt: serverTimestamp(),
      updatedBy: userId
    });
  } catch (error) {
    console.error('Error updating item:', error);
    throw error;
  }
};

/**
 * Delete item from program
 */
export const deleteItemFromProgram = async (
  programId: string, 
  itemId: string, 
  userId: string
): Promise<void> => {
  try {
    const programRef = doc(db, PROGRAMS_COLLECTION, programId);
    const programDoc = await getDoc(programRef);
    
    if (!programDoc.exists()) {
      throw new Error('Program not found');
    }
    
    const programData = programDoc.data() as FirestoreProgram;
    const updatedItems = programData.items.filter(item => item.id !== itemId);
    
    await updateDoc(programRef, {
      items: updatedItems,
      updatedAt: serverTimestamp(),
      updatedBy: userId
    });
  } catch (error) {
    console.error('Error deleting item:', error);
    throw error;
  }
};

/**
 * Update program sections and items order
 */
export const updateProgramOrder = async (
  programId: string,
  sections: ProgramSection[],
  items: ProgramItem[],
  userId: string
): Promise<void> => {
  try {
    const programRef = doc(db, PROGRAMS_COLLECTION, programId);
    
    await updateDoc(programRef, {
      sections,
      items,
      updatedAt: serverTimestamp(),
      updatedBy: userId
    });
  } catch (error) {
    console.error('Error updating program order:', error);
    throw error;
  }
};