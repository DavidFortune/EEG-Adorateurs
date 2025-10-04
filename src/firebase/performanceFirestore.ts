/**
 * Firestore operations with performance tracking
 * Wrappers around common Firestore operations to automatically track performance
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  DocumentReference,
  CollectionReference,
  Query,
  DocumentData,
  UpdateData,
  WithFieldValue
} from 'firebase/firestore';
import { performanceService } from '@/services/performanceService';

/**
 * Get a single document with performance tracking
 */
export async function getDocWithPerformance<T = DocumentData>(
  docRef: DocumentReference<T>
): Promise<T | undefined> {
  const collectionPath = docRef.path.split('/').slice(0, -1).join('/');
  return performanceService.trackFirestoreOperation(
    'getDoc',
    collectionPath,
    async () => {
      const snapshot = await getDoc(docRef);
      return snapshot.data();
    }
  );
}

/**
 * Get multiple documents with performance tracking
 */
export async function getDocsWithPerformance<T = DocumentData>(
  queryOrCollection: Query<T> | CollectionReference<T>
): Promise<T[]> {
  let collectionPath: string;

  // Extract collection path from query or collection reference
  if ('type' in queryOrCollection && queryOrCollection.type === 'query') {
    // It's a query
    const q = queryOrCollection as Query<T>;
    collectionPath = (q as any)._query?.path?.segments?.join('/') || 'unknown';
  } else {
    // It's a collection reference
    const collRef = queryOrCollection as CollectionReference<T>;
    collectionPath = collRef.path;
  }

  return performanceService.trackFirestoreOperation(
    'getDocs',
    collectionPath,
    async () => {
      const snapshot = await getDocs(queryOrCollection);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
    }
  );
}

/**
 * Add a document with performance tracking
 */
export async function addDocWithPerformance<T = DocumentData>(
  collectionRef: CollectionReference<T>,
  data: WithFieldValue<T>
): Promise<DocumentReference<T>> {
  return performanceService.trackFirestoreOperation(
    'addDoc',
    collectionRef.path,
    async () => {
      return await addDoc(collectionRef, data);
    }
  );
}

/**
 * Update a document with performance tracking
 */
export async function updateDocWithPerformance<T = DocumentData>(
  docRef: DocumentReference<T>,
  data: UpdateData<T>
): Promise<void> {
  const collectionPath = docRef.path.split('/').slice(0, -1).join('/');
  return performanceService.trackFirestoreOperation(
    'updateDoc',
    collectionPath,
    async () => {
      await updateDoc(docRef, data as any);
    }
  );
}

/**
 * Delete a document with performance tracking
 */
export async function deleteDocWithPerformance<T = DocumentData>(
  docRef: DocumentReference<T>
): Promise<void> {
  const collectionPath = docRef.path.split('/').slice(0, -1).join('/');
  return performanceService.trackFirestoreOperation(
    'deleteDoc',
    collectionPath,
    async () => {
      await deleteDoc(docRef);
    }
  );
}

/**
 * Query documents with performance tracking
 */
export async function queryWithPerformance<T = DocumentData>(
  collectionRef: CollectionReference<T>,
  ...queryConstraints: any[]
): Promise<T[]> {
  return performanceService.trackFirestoreOperation(
    'query',
    collectionRef.path,
    async () => {
      const q = query(collectionRef, ...queryConstraints);
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
    }
  );
}
