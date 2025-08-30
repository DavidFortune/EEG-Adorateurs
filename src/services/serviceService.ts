import { Service, CreateServiceRequest, UpdateServiceRequest } from '@/types/service';
import { firestoreService } from '@/firebase/firestore';

export const serviceService = {
  async getAllServices(): Promise<Service[]> {
    return await firestoreService.getAllServices();
  },

  async getPublishedServices(): Promise<Service[]> {
    return await firestoreService.getPublishedServices();
  },

  async getServiceById(id: string): Promise<Service | null> {
    return await firestoreService.getServiceById(id);
  },

  async createService(request: CreateServiceRequest): Promise<Service> {
    return await firestoreService.createService(request);
  },

  async updateService(request: UpdateServiceRequest): Promise<Service | null> {
    return await firestoreService.updateService(request);
  },

  async deleteService(id: string): Promise<boolean> {
    return await firestoreService.deleteService(id);
  }
};