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
  orderBy, 
  limit,
  QueryConstraint,
  serverTimestamp,
  increment
} from 'firebase/firestore';
import { db } from './config';
import { Resource, ResourceCollection, ResourceFilter, ResourceType, SortOption } from '@/types/resource';

const RESOURCES_COLLECTION = 'resources';
const COLLECTIONS_COLLECTION = 'resource_collections';

// Predefined color palette for collections
export const COLLECTION_COLORS = [
  '#b5121b', '#ffcdd2', '#c8e6c9', '#bbdefb', '#ffecb3',
  '#d1c4e9', '#ffccbc', '#b2dfdb', '#f8bbd9', '#dcedc8',
  '#b39ddb', '#ffe0b2', '#80deea', '#f48fb1', '#c5e1a5',
  '#e1bee7', '#f5f5f5'
];

export const getRandomColor = (): string => {
  return COLLECTION_COLORS[Math.floor(Math.random() * COLLECTION_COLORS.length)];
};

// Symbol generation and validation
export const generateSymbolFromName = (name: string): string => {
  if (!name || name.trim().length === 0) return '';
  
  const cleanName = name.trim().toUpperCase();
  
  // Try to generate a meaningful abbreviation
  const words = cleanName.split(/[\s\-_]+/).filter(word => word.length > 0);
  
  if (words.length >= 2) {
    // Multiple words: take first letter of each word (up to 3)
    return words.slice(0, 3).map(word => word[0]).join('');
  } else if (words.length === 1) {
    const word = words[0];
    if (word.length <= 3) {
      return word;
    } else {
      // Single long word: take first 2-3 letters, prioritizing consonants
      const consonants = word.replace(/[AEIOU]/g, '');
      if (consonants.length >= 2) {
        return consonants.substring(0, 3);
      } else {
        return word.substring(0, 3);
      }
    }
  }
  
  return cleanName.substring(0, 3);
};

export const isSymbolUnique = async (symbol: string, excludeId?: string): Promise<boolean> => {
  if (!symbol || symbol.trim().length === 0) return false;
  
  try {
    const q = query(
      collection(db, COLLECTIONS_COLLECTION),
      where('symbol', '==', symbol.toUpperCase())
    );
    const snapshot = await getDocs(q);
    
    // If no documents found, symbol is unique
    if (snapshot.empty) return true;
    
    // If excluding an ID (for updates), check if the only match is the excluded one
    if (excludeId) {
      const matches = snapshot.docs.filter(doc => doc.id !== excludeId);
      return matches.length === 0;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking symbol uniqueness:', error);
    return false;
  }
};

export const generateUniqueSymbol = async (name: string, excludeId?: string): Promise<string> => {
  let baseSymbol = generateSymbolFromName(name);
  let symbol = baseSymbol;
  let counter = 1;
  
  // Keep trying until we find a unique symbol
  while (!(await isSymbolUnique(symbol, excludeId))) {
    if (baseSymbol.length === 2) {
      symbol = baseSymbol + counter;
    } else if (baseSymbol.length === 3) {
      symbol = baseSymbol.substring(0, 2) + counter;
    } else {
      symbol = baseSymbol + counter;
    }
    counter++;
    
    // Safety check to prevent infinite loop
    if (counter > 99) break;
  }
  
  return symbol;
};

// Resource Collections Management
export const getResourceCollections = async (): Promise<ResourceCollection[]> => {
  try {
    const q = query(collection(db, COLLECTIONS_COLLECTION), orderBy('name'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ResourceCollection));
  } catch (error) {
    console.error('Error getting resource collections:', error);
    throw error;
  }
};

export const getResourceCollectionById = async (collectionId: string): Promise<ResourceCollection | null> => {
  try {
    const docRef = doc(db, COLLECTIONS_COLLECTION, collectionId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as ResourceCollection;
    }
    return null;
  } catch (error) {
    console.error('Error getting resource collection:', error);
    throw error;
  }
};

export const createResourceCollection = async (collectionData: Omit<ResourceCollection, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    // Recursively filter out undefined fields to prevent Firebase errors
    const cleanData = removeUndefinedFields(collectionData);
    
    const docRef = await addDoc(collection(db, COLLECTIONS_COLLECTION), {
      ...cleanData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating resource collection:', error);
    throw error;
  }
};

export const updateResourceCollection = async (collectionId: string, updates: Partial<ResourceCollection>): Promise<void> => {
  try {
    // Recursively filter out undefined fields to prevent Firebase errors
    const cleanUpdates = removeUndefinedFields(updates);
    
    const docRef = doc(db, COLLECTIONS_COLLECTION, collectionId);
    await updateDoc(docRef, {
      ...cleanUpdates,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating resource collection:', error);
    throw error;
  }
};

export const deleteResourceCollection = async (collectionId: string): Promise<void> => {
  try {
    // First check if any resources are using this collection
    const q = query(
      collection(db, RESOURCES_COLLECTION),
      where('collectionIds', 'array-contains', collectionId)
    );
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      throw new Error('Cannot delete resource collection that contains resources');
    }
    
    await deleteDoc(doc(db, COLLECTIONS_COLLECTION, collectionId));
  } catch (error) {
    console.error('Error deleting resource collection:', error);
    throw error;
  }
};

// Resources Management
export const getResources = async (filter?: ResourceFilter): Promise<Resource[]> => {
  try {
    const constraints: QueryConstraint[] = [];
    
    // Apply collection filter
    if (filter?.collectionIds && filter.collectionIds.length > 0) {
      constraints.push(where('collectionIds', 'array-contains-any', filter.collectionIds));
    }
    
    // Apply sorting (though most sorting is now handled client-side)
    if (filter?.sortBy) {
      switch (filter.sortBy) {
        case SortOption.NEWEST:
          constraints.push(orderBy('createdAt', 'desc'));
          break;
        case SortOption.OLDEST:
          constraints.push(orderBy('createdAt', 'asc'));
          break;
        case SortOption.ALPHABETICAL_ASC:
          constraints.push(orderBy('title', 'asc'));
          break;
        case SortOption.ALPHABETICAL_DESC:
          constraints.push(orderBy('title', 'desc'));
          break;
      }
    } else {
      constraints.push(orderBy('createdAt', 'desc'));
    }
    
    const q = query(collection(db, RESOURCES_COLLECTION), ...constraints);
    const snapshot = await getDocs(q);
    
    let resources = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Resource));
    
    // Apply client-side filters
    if (filter?.resourceTypes && filter.resourceTypes.length > 0) {
      resources = resources.filter(resource => 
        resource.contents.some(content => 
          filter.resourceTypes!.includes(content.type)
        )
      );
    }
    
    // Apply search filter (client-side for now, could be improved with Algolia or similar)
    if (filter?.searchQuery) {
      const searchLower = filter.searchQuery.toLowerCase();
      resources = resources.filter(resource => {
        const searchableText = `${resource.title} ${resource.description || ''} ${resource.tags?.join(' ') || ''}`.toLowerCase();
        return searchableText.includes(searchLower);
      });
    }
    
    return resources;
  } catch (error) {
    console.error('Error getting resources:', error);
    throw error;
  }
};

export const getResourceById = async (resourceId: string): Promise<Resource | null> => {
  try {
    const docRef = doc(db, RESOURCES_COLLECTION, resourceId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      // Increment view count
      await updateDoc(docRef, {
        viewCount: increment(1)
      });
      
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as Resource;
    }
    return null;
  } catch (error) {
    console.error('Error getting resource:', error);
    throw error;
  }
};

// Helper function to recursively remove undefined values from objects
const removeUndefinedFields = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(item => removeUndefinedFields(item));
  } else if (obj !== null && typeof obj === 'object') {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = removeUndefinedFields(value);
      }
    }
    return cleaned;
  }
  return obj;
};

export const createResource = async (resourceData: Omit<Resource, 'id' | 'createdAt' | 'updatedAt' | 'viewCount'>): Promise<string> => {
  try {
    console.log('[Firebase] Creating resource with data:', resourceData);
    
    // Generate search text for better full-text search
    const searchText = `${resourceData.title} ${resourceData.description || ''} ${resourceData.tags?.join(' ') || ''}`.toLowerCase();
    
    // Recursively filter out undefined fields to prevent Firebase errors
    const cleanData = removeUndefinedFields(resourceData);
    console.log('[Firebase] Cleaned data:', cleanData);
    
    const dataToSave = {
      ...cleanData,
      searchText,
      viewCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    console.log('[Firebase] Final data to save:', dataToSave);
    
    const docRef = await addDoc(collection(db, RESOURCES_COLLECTION), dataToSave);
    console.log('[Firebase] Resource created successfully with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('[Firebase] Error creating resource:', error);
    if (error instanceof Error) {
      console.error('[Firebase] Error message:', error.message);
      console.error('[Firebase] Error stack:', error.stack);
    }
    throw error;
  }
};

export const updateResource = async (resourceId: string, updates: Partial<Resource>): Promise<void> => {
  try {
    // Update search text if title, description or tags changed
    let searchText = undefined;
    if (updates.title || updates.description || updates.tags) {
      const existingResource = await getResourceById(resourceId);
      if (existingResource) {
        const title = updates.title || existingResource.title;
        const description = updates.description || existingResource.description || '';
        const tags = updates.tags || existingResource.tags || [];
        searchText = `${title} ${description} ${tags.join(' ')}`.toLowerCase();
      }
    }
    
    // Recursively filter out undefined fields to prevent Firebase errors
    const cleanUpdates = removeUndefinedFields(updates);
    
    const docRef = doc(db, RESOURCES_COLLECTION, resourceId);
    await updateDoc(docRef, {
      ...cleanUpdates,
      ...(searchText && { searchText }),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating resource:', error);
    throw error;
  }
};

export const deleteResource = async (resourceId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, RESOURCES_COLLECTION, resourceId));
  } catch (error) {
    console.error('Error deleting resource:', error);
    throw error;
  }
};

// Search resources by text
export const searchResources = async (searchQuery: string, limit = 20): Promise<Resource[]> => {
  try {
    // For now, we'll do client-side search
    // In production, consider using Algolia or Elasticsearch
    const allResources = await getResources();
    const searchLower = searchQuery.toLowerCase();
    
    return allResources
      .filter(resource => {
        const searchableText = resource.searchText || 
          `${resource.title} ${resource.description || ''} ${resource.tags?.join(' ') || ''}`.toLowerCase();
        return searchableText.includes(searchLower);
      })
      .slice(0, limit);
  } catch (error) {
    console.error('Error searching resources:', error);
    throw error;
  }
};

// Get resources by collection
export const getResourcesByCollection = async (collectionId: string): Promise<Resource[]> => {
  try {
    const q = query(
      collection(db, RESOURCES_COLLECTION),
      where('collectionIds', 'array-contains', collectionId),
      orderBy('title')
    );
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Resource));
  } catch (error) {
    console.error('Error getting resources by collection:', error);
    throw error;
  }
};