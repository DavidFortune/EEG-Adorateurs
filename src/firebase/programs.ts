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
  onSnapshot,
  serverTimestamp,
  Timestamp,
  runTransaction,
  type Unsubscribe
} from 'firebase/firestore';
import { db } from './config';
import type { ServiceProgram, ProgramItem, EditLock, ProgramStatus } from '@/types/program';

export interface FirestoreProgram extends Omit<ServiceProgram, 'createdAt' | 'updatedAt' | 'publishedAt'> {
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
  updatedBy: string;
  publishedAt?: Timestamp;
  // Legacy field — read for migration, never written
  isDraft?: boolean;
}

const PROGRAMS_COLLECTION = 'programs';

/**
 * Read-time migration: promote legacy sub-items to grouped items,
 * convert Section-type items to group headers.
 * Idempotent — safe to call on already-migrated data.
 */
const migrateProgram = (items: any[]): ProgramItem[] => {
  const migrated: ProgramItem[] = [];

  for (const item of items) {
    // Convert Section-type items to group headers
    const isSection = item.type === 'Section';
    const hasSubItems = Array.isArray(item.subItems) && item.subItems.length > 0;

    const migratedItem: ProgramItem = {
      ...item,
      isGroup: item.isGroup || isSection || hasSubItems || undefined,
    };

    // Remove subItems from the migrated item (promoted below)
    delete migratedItem.subItems;

    // Clean up: don't set isGroup to false/undefined noise
    if (!migratedItem.isGroup) delete migratedItem.isGroup;

    migrated.push(migratedItem);

    // Promote sub-items to top-level items within the group
    if (hasSubItems) {
      const baseOrder = migratedItem.order;
      for (let i = 0; i < item.subItems.length; i++) {
        const sub = item.subItems[i];
        const promotedItem: ProgramItem = {
          id: sub.id,
          order: baseOrder + 0.001 * (i + 1), // Place after parent, before next item
          title: sub.title,
          subtitle: sub.subtitle,
          notes: sub.notes,
          participants: sub.participants,
          duration: sub.duration,
          resourceId: sub.resourceId,
          scriptureReference: sub.scriptureReference,
          scriptureText: sub.scriptureText,
          scriptureVersion: sub.scriptureVersion,
          groupId: item.id,
          type: sub.type, // Preserve legacy type
        };
        // Clean undefined values
        Object.keys(promotedItem).forEach(key => {
          if ((promotedItem as any)[key] === undefined) {
            delete (promotedItem as any)[key];
          }
        });
        migrated.push(promotedItem);
      }
    }
  }

  // Re-sort by order and re-index
  migrated.sort((a, b) => a.order - b.order);
  migrated.forEach((item, index) => { item.order = index; });

  return migrated;
};

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

    const editLockData = (data as any).editLock;
    const editLock: EditLock | null = editLockData ? {
      userId: editLockData.userId,
      userName: editLockData.userName,
      lockedAt: editLockData.lockedAt?.toDate() || new Date(),
      expiresAt: editLockData.expiresAt?.toDate() || new Date()
    } : null;

    return {
      ...data,
      id: doc.id,
      items: migrateProgram(data.items || []),
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
      // Migration: derive status from legacy isDraft if status field is absent
      status: (data.status as ProgramStatus) ?? (data.isDraft === true ? 'draft' : 'published'),
      draftViewerIds: data.draftViewerIds ?? [],
      publishedAt: data.publishedAt?.toDate(),
      editLock
    };
  } catch (error) {
    console.error('Error fetching program:', error);
    throw error;
  }
};

/**
 * Subscribe to program by service ID for real-time updates
 */
export const subscribeToProgramByServiceId = (
  serviceId: string,
  onUpdate: (program: ServiceProgram | null) => void,
  onError?: (error: Error) => void
): Unsubscribe => {
  const q = query(
    collection(db, PROGRAMS_COLLECTION),
    where('serviceId', '==', serviceId)
  );

  return onSnapshot(
    q,
    (querySnapshot) => {
      if (querySnapshot.empty) {
        onUpdate(null);
        return;
      }

      const docSnapshot = querySnapshot.docs[0];
      const data = docSnapshot.data() as FirestoreProgram;

      const editLockData = (data as any).editLock;
      const editLock: EditLock | null = editLockData ? {
        userId: editLockData.userId,
        userName: editLockData.userName,
        lockedAt: editLockData.lockedAt?.toDate() || new Date(),
        expiresAt: editLockData.expiresAt?.toDate() || new Date()
      } : null;

      const program: ServiceProgram = {
        ...data,
        id: docSnapshot.id,
        items: migrateProgram(data.items || []),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        // Migration: derive status from legacy isDraft if status field is absent
        status: (data.status as ProgramStatus) ?? (data.isDraft === true ? 'draft' : 'published'),
        draftViewerIds: data.draftViewerIds ?? [],
        publishedAt: data.publishedAt?.toDate(),
        editLock
      };

      onUpdate(program);
    },
    (error) => {
      console.error('Error in program subscription:', error);
      if (onError) {
        onError(error);
      }
    }
  );
};

/**
 * Create a new program
 */
export const createProgram = async (
  program: Omit<ServiceProgram, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'draftViewerIds' | 'publishedAt' | 'publishedBy'>,
  userId: string
): Promise<ServiceProgram> => {
  console.log('Firebase createProgram called with:', { program, userId });

  try {
    const programRef = doc(collection(db, PROGRAMS_COLLECTION));
    const now = serverTimestamp();

    console.log('Program ref created:', programRef.id);

    // Generate IDs for items
    const itemsWithIds = (program.items || []).map(item => ({
      ...item,
      id: item.id || `item_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
    }));

    const programData: any = {
      ...program,
      items: itemsWithIds,
      sections: [], // Legacy field, kept empty for backward compatibility
      status: 'draft' as ProgramStatus, // New programs are drafts by default
      draftViewerIds: [userId], // Creator can always view their own draft
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
      updatedAt: createdData.updatedAt.toDate(),
      publishedAt: createdData.publishedAt?.toDate()
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

    // Create new item and remove undefined values (Firestore doesn't accept them)
    const newItem: ProgramItem = {
      ...item,
      id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
    };

    // Remove undefined values
    Object.keys(newItem).forEach(key => {
      if ((newItem as any)[key] === undefined) {
        delete (newItem as any)[key];
      }
    });

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
    const updatedItems = programData.items.map(item => {
      if (item.id === itemId) {
        const updated = { ...item, ...updates };
        // Remove undefined values (Firestore doesn't accept them)
        Object.keys(updated).forEach(key => {
          if ((updated as any)[key] === undefined) {
            delete (updated as any)[key];
          }
        });
        return updated;
      }
      return item;
    });
    
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
    const deletedItem = programData.items.find(item => item.id === itemId);

    let updatedItems = programData.items.filter(item => item.id !== itemId);

    // If deleting a group, ungroup its children (remove groupId)
    if (deletedItem?.isGroup) {
      updatedItems = updatedItems.map(item =>
        item.groupId === itemId ? { ...item, groupId: undefined } : item
      );
      // Clean undefined groupId values for Firestore
      updatedItems.forEach(item => {
        if (item.groupId === undefined) delete (item as any).groupId;
      });
    }

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
  items: ProgramItem[],
  userId: string
): Promise<void> => {
  try {
    const programRef = doc(db, PROGRAMS_COLLECTION, programId);

    await updateDoc(programRef, {
      items,
      updatedAt: serverTimestamp(),
      updatedBy: userId
    });
  } catch (error) {
    console.error('Error updating program order:', error);
    throw error;
  }
};

/**
 * Create a group header item
 */
export const createGroupItem = async (
  programId: string,
  title: string,
  order: number,
  userId: string
): Promise<ProgramItem> => {
  try {
    const programRef = doc(db, PROGRAMS_COLLECTION, programId);
    const programDoc = await getDoc(programRef);

    if (!programDoc.exists()) {
      throw new Error('Program not found');
    }

    const programData = programDoc.data() as FirestoreProgram;
    const newGroup: ProgramItem = {
      id: `group_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      order,
      title,
      isGroup: true,
    };

    const updatedItems = [...programData.items, newGroup];

    await updateDoc(programRef, {
      items: updatedItems,
      updatedAt: serverTimestamp(),
      updatedBy: userId
    });

    return newGroup;
  } catch (error) {
    console.error('Error creating group:', error);
    throw error;
  }
};

/**
 * Publish a program (one-way operation, cannot be undone)
 * Once published, the program is visible to all service participants
 */
export const publishProgram = async (
  programId: string,
  userId: string
): Promise<void> => {
  try {
    const programRef = doc(db, PROGRAMS_COLLECTION, programId);
    const programDoc = await getDoc(programRef);

    if (!programDoc.exists()) {
      throw new Error('Program not found');
    }

    const programData = programDoc.data() as FirestoreProgram;

    // Prevent re-publishing already published programs
    const currentStatus = (programData as any).status ?? (programData.isDraft === true ? 'draft' : 'published');
    if (currentStatus !== 'draft') {
      throw new Error('Program is already published');
    }

    await updateDoc(programRef, {
      status: 'published' as ProgramStatus,
      publishedAt: serverTimestamp(),
      publishedBy: userId,
      updatedAt: serverTimestamp(),
      updatedBy: userId
    });
  } catch (error) {
    console.error('Error publishing program:', error);
    throw error;
  }
};

/**
 * Update the list of members who can view a draft program
 * Only applicable when program is in draft mode
 */
export const updateDraftViewers = async (
  programId: string,
  viewerIds: string[],
  userId: string
): Promise<void> => {
  try {
    const programRef = doc(db, PROGRAMS_COLLECTION, programId);

    await updateDoc(programRef, {
      draftViewerIds: viewerIds,
      updatedAt: serverTimestamp(),
      updatedBy: userId
    });
  } catch (error) {
    console.error('Error updating draft viewers:', error);
    throw error;
  }
};

/**
 * Check if a user can view a program based on draft status and permissions
 * @returns true if user can view, false otherwise
 */
export const canUserViewProgram = (
  program: ServiceProgram | null,
  firebaseUid: string | undefined,
  isAdmin: boolean
): boolean => {
  if (!program) return false;

  // Published programs are visible to everyone
  if (program.status === 'published') return true;

  // Admins can always view drafts
  if (isAdmin) return true;

  // Check if user is in the draft viewers list
  if (firebaseUid && program.draftViewerIds.includes(firebaseUid)) {
    return true;
  }

  return false;
};

const LOCK_TTL_MS = 10 * 60 * 1000; // 10 minutes

export interface AcquireLockResult {
  success: boolean;
  holder?: { userName: string; expiresAt: Date };
}

/**
 * Acquire edit lock on a program using a Firestore transaction.
 * Succeeds only if the lock is null or expired.
 */
export const acquireEditLock = async (
  programId: string,
  userId: string,
  userName: string
): Promise<AcquireLockResult> => {
  const programRef = doc(db, PROGRAMS_COLLECTION, programId);

  return runTransaction(db, async (transaction) => {
    const programDoc = await transaction.get(programRef);
    if (!programDoc.exists()) throw new Error('Program not found');

    const data = programDoc.data();
    const currentLock = data.editLock;
    const now = Date.now();

    // Check if lock is held by another user and not expired
    if (currentLock && currentLock.userId !== userId) {
      const expiresAt = currentLock.expiresAt?.toDate?.() || new Date(0);
      if (expiresAt.getTime() > now) {
        return {
          success: false,
          holder: { userName: currentLock.userName, expiresAt }
        };
      }
    }

    const lockedAt = new Date(now);
    const expiresAt = new Date(now + LOCK_TTL_MS);

    transaction.update(programRef, {
      editLock: {
        userId,
        userName,
        lockedAt: Timestamp.fromDate(lockedAt),
        expiresAt: Timestamp.fromDate(expiresAt)
      }
    });

    return { success: true };
  });
};

/**
 * Release edit lock on a program. Only succeeds if the current user holds the lock.
 */
export const releaseEditLock = async (
  programId: string,
  userId: string
): Promise<void> => {
  const programRef = doc(db, PROGRAMS_COLLECTION, programId);

  return runTransaction(db, async (transaction) => {
    const programDoc = await transaction.get(programRef);
    if (!programDoc.exists()) return;

    const data = programDoc.data();
    const currentLock = data.editLock;

    // Only release if current user holds the lock
    if (currentLock && currentLock.userId === userId) {
      transaction.update(programRef, { editLock: null });
    }
  });
};

export interface ForceAcquireLockResult {
  previousHolder?: { userName: string } | null;
}

/**
 * Force-acquire edit lock, displacing any current holder.
 * Returns previous holder info so the UI can notify the displaced editor.
 */
export const forceAcquireEditLock = async (
  programId: string,
  userId: string,
  userName: string
): Promise<ForceAcquireLockResult> => {
  const programRef = doc(db, PROGRAMS_COLLECTION, programId);

  return runTransaction(db, async (transaction) => {
    const programDoc = await transaction.get(programRef);
    if (!programDoc.exists()) throw new Error('Program not found');

    const data = programDoc.data();
    const currentLock = data.editLock;
    const previousHolder = currentLock && currentLock.userId !== userId
      ? { userName: currentLock.userName }
      : null;

    const now = Date.now();
    transaction.update(programRef, {
      editLock: {
        userId,
        userName,
        lockedAt: Timestamp.fromDate(new Date(now)),
        expiresAt: Timestamp.fromDate(new Date(now + LOCK_TTL_MS))
      }
    });

    return { previousHolder };
  });
};