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
  Timestamp 
} from 'firebase/firestore';
import { db } from './config';
import { Service, CreateServiceRequest, UpdateServiceRequest } from '@/types/service';

const SERVICES_COLLECTION = 'services';

interface FirestoreService extends Omit<Service, 'createdAt' | 'modifiedAt'> {
  createdAt: Timestamp;
  modifiedAt: Timestamp;
}

function convertFirestoreToService(firestoreService: FirestoreService): Service {
  return {
    ...firestoreService,
    createdAt: firestoreService.createdAt.toDate().toISOString(),
    modifiedAt: firestoreService.modifiedAt.toDate().toISOString()
  };
}

function convertServiceToFirestore(service: Omit<Service, 'id'>): any {
  const result: any = {
    title: service.title,
    date: service.date,
    time: service.time,
    category: service.category,
    isPublished: service.isPublished,
    createdAt: Timestamp.fromDate(new Date(service.createdAt)),
    modifiedAt: Timestamp.fromDate(new Date(service.modifiedAt))
  };

  // Only add optional fields if they are defined
  if (service.endDate !== undefined) {
    result.endDate = service.endDate;
  }

  if (service.endTime !== undefined) {
    result.endTime = service.endTime;
  }

  if (service.availabilityDeadline !== undefined) {
    result.availabilityDeadline = service.availabilityDeadline;
  }

  if (service.teamRequirements !== undefined) {
    result.teamRequirements = service.teamRequirements;
  }

  return result;
}

export const firestoreService = {
  async getAllServices(): Promise<Service[]> {
    try {
      const q = query(collection(db, SERVICES_COLLECTION), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => 
        convertFirestoreToService({ id: doc.id, ...doc.data() } as FirestoreService)
      );
    } catch (error) {
      console.error('Error getting all services:', error);
      throw new Error('Failed to fetch services');
    }
  },

  async getPublishedServices(): Promise<Service[]> {
    try {
      const q = query(
        collection(db, SERVICES_COLLECTION), 
        where('isPublished', '==', true),
        orderBy('date', 'asc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => 
        convertFirestoreToService({ id: doc.id, ...doc.data() } as FirestoreService)
      );
    } catch (error) {
      console.error('Error getting published services:', error);
      throw new Error('Failed to fetch published services');
    }
  },

  async getServiceById(id: string): Promise<Service | null> {
    try {
      const docRef = doc(db, SERVICES_COLLECTION, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return convertFirestoreToService({ id: docSnap.id, ...docSnap.data() } as FirestoreService);
      }
      return null;
    } catch (error) {
      console.error('Error getting service by ID:', error);
      throw new Error('Failed to fetch service');
    }
  },

  async createService(request: CreateServiceRequest): Promise<Service> {
    try {
      const now = new Date().toISOString();
      const serviceData: Omit<Service, 'id'> = {
        ...request,
        createdAt: now,
        modifiedAt: now
      };
      
      const docRef = await addDoc(collection(db, SERVICES_COLLECTION), convertServiceToFirestore(serviceData));
      
      return {
        id: docRef.id,
        ...serviceData
      };
    } catch (error) {
      console.error('Error creating service:', error);
      throw new Error('Failed to create service');
    }
  },

  async updateService(request: UpdateServiceRequest): Promise<Service | null> {
    try {
      const docRef = doc(db, SERVICES_COLLECTION, request.id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }
      
      const existingService = convertFirestoreToService({ id: docSnap.id, ...docSnap.data() } as FirestoreService);
      const updatedService: Service = {
        ...existingService,
        title: request.title,
        date: request.date,
        time: request.time,
        endDate: request.endDate,
        endTime: request.endTime,
        category: request.category,
        isPublished: request.isPublished,
        availabilityDeadline: request.availabilityDeadline,
        teamRequirements: request.teamRequirements,
        modifiedAt: new Date().toISOString()
      };
      
      await updateDoc(docRef, convertServiceToFirestore(updatedService));
      
      return updatedService;
    } catch (error) {
      console.error('Error updating service:', error);
      throw new Error('Failed to update service');
    }
  },

  async deleteService(id: string): Promise<boolean> {
    try {
      const docRef = doc(db, SERVICES_COLLECTION, id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return false;
      }
      
      await deleteDoc(docRef);
      return true;
    } catch (error) {
      console.error('Error deleting service:', error);
      throw new Error('Failed to delete service');
    }
  }
};