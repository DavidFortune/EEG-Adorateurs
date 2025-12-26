import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import DisponibilitesPage from '@/views/disponibilites/DisponibilitesPage.vue';
import { membersService } from '@/firebase/members';
import { serviceService } from '@/services/serviceService';
import { getDocs } from 'firebase/firestore';
import type { Member } from '@/types/member';
import type { Service } from '@/types/service';

// Mock Ionic components
vi.mock('@ionic/vue', () => ({
  IonPage: { template: '<div><slot /></div>' },
  IonHeader: { template: '<div><slot /></div>' },
  IonToolbar: { template: '<div><slot /></div>' },
  IonTitle: { template: '<div><slot /></div>' },
  IonContent: { template: '<div><slot /></div>' },
  IonButton: { template: '<button @click="$emit(\'click\')"><slot /></button>' },
  IonIcon: { template: '<i />' },
  IonRefresher: { template: '<div><slot /></div>' },
  IonRefresherContent: { template: '<div />' },
  IonLoading: { template: '<div />' },
  IonLabel: { template: '<span><slot /></span>' },
  IonChip: { template: '<div><slot /></div>' },
  IonSegment: { template: '<div><slot /></div>' },
  IonSegmentButton: { template: '<div><slot /></div>' },
  toastController: {
    create: vi.fn(() => Promise.resolve({ present: vi.fn() }))
  }
}));

// Mock icons
vi.mock('ionicons/icons', () => ({
  thumbsUpOutline: 'thumb-up',
  thumbsDownOutline: 'thumb-down',
  calendarOutline: 'calendar',
  checkmarkCircleOutline: 'checkmark'
}));

// Mock Firebase
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  getDocs: vi.fn(),
  query: vi.fn(),
  where: vi.fn()
}));

vi.mock('@/firebase/config', () => ({
  db: {}
}));

// Mock composables
const mockMember = ref<Member | null>(null);
vi.mock('@/composables/useUser', () => ({
  useUser: () => ({
    member: mockMember
  })
}));

// Mock services
vi.mock('@/firebase/members');
vi.mock('@/services/serviceService');

import { ref } from 'vue';

describe('DisponibilitesPage - Availability Management', () => {
  const mockServiceId1 = 'service-001';
  const mockServiceId2 = 'service-002';
  const mockServiceId3 = 'service-003';
  const mockServiceOct26 = 'service-oct-26';

  const createMockMember = (availabilities = {}): Member => ({
    id: 'member-123',
    firebaseUserId: 'firebase-user-123',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    fullName: 'Test User',
    ministries: ['ministry1'],
    availabilities: availabilities,
    isOnboardingCompleted: true,
    isAdmin: false,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  });

  const createMockService = (id: string, title: string): Service => ({
    id,
    title,
    date: '2024-12-01',
    time: '10:00',
    location: 'Church',
    type: 'worship',
    description: 'Service description',
    teams: [],
    isPublished: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  });

  const mockServices: Service[] = [
    createMockService(mockServiceId1, 'Service 1'),
    createMockService(mockServiceId2, 'Service 2'),
    createMockService(mockServiceId3, 'Service 3'),
    createMockService(mockServiceOct26, 'Culte du dimanche 26 octobre')
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockMember.value = null;

    // Mock service service to return services
    vi.mocked(serviceService.getPublishedServices).mockResolvedValue(mockServices);

    // Mock getDocs for assignments
    vi.mocked(getDocs).mockResolvedValue({
      docs: [],
      empty: true
    } as any);
  });

  describe('Availability state management', () => {
    it('should load member availabilities correctly', async () => {
      const existingAvailabilities = {
        [mockServiceId1]: 'available' as const,
        [mockServiceId2]: 'unavailable' as const
      };

      mockMember.value = createMockMember(existingAvailabilities);

      const wrapper = mount(DisponibilitesPage);
      await wrapper.vm.$nextTick();

      // Check that availabilities are loaded
      const currentAvailabilities = (wrapper.vm as any).currentAvailabilities;
      expect(currentAvailabilities[mockServiceId1]).toBe('available');
      expect(currentAvailabilities[mockServiceId2]).toBe('unavailable');
    });

    it('should handle null availabilities safely', async () => {
      mockMember.value = createMockMember(null as any);

      const wrapper = mount(DisponibilitesPage);
      await wrapper.vm.$nextTick();

      const currentAvailabilities = (wrapper.vm as any).currentAvailabilities;
      expect(currentAvailabilities).toEqual({});
    });

    it('should handle undefined availabilities safely', async () => {
      mockMember.value = createMockMember(undefined as any);

      const wrapper = mount(DisponibilitesPage);
      await wrapper.vm.$nextTick();

      const currentAvailabilities = (wrapper.vm as any).currentAvailabilities;
      expect(currentAvailabilities).toEqual({});
    });
  });

  describe('Availability updates - October 26 service bug', () => {
    it('should not lose other availabilities when updating October 26 service', async () => {
      const existingAvailabilities = {
        [mockServiceId1]: 'available' as const,
        [mockServiceId2]: 'unavailable' as const,
        [mockServiceId3]: 'available' as const
      };

      mockMember.value = createMockMember(existingAvailabilities);

      const updatedMember = createMockMember({
        ...existingAvailabilities,
        [mockServiceOct26]: 'available' as const
      });

      vi.mocked(membersService.updateMember).mockResolvedValue(updatedMember);

      const wrapper = mount(DisponibilitesPage);
      await wrapper.vm.$nextTick();

      // Update availability for October 26 service
      await (wrapper.vm as any).setAvailability(mockServiceOct26, 'available');

      // Verify updateMember was called with all availabilities preserved
      expect(membersService.updateMember).toHaveBeenCalledWith('member-123', {
        availabilities: {
          [mockServiceId1]: 'available',
          [mockServiceId2]: 'unavailable',
          [mockServiceId3]: 'available',
          [mockServiceOct26]: 'available'
        }
      });

      // Verify local state is updated correctly
      const currentAvailabilities = (wrapper.vm as any).currentAvailabilities;
      expect(currentAvailabilities[mockServiceId1]).toBe('available');
      expect(currentAvailabilities[mockServiceId2]).toBe('unavailable');
      expect(currentAvailabilities[mockServiceId3]).toBe('available');
      expect(currentAvailabilities[mockServiceOct26]).toBe('available');
    });

    it('should toggle availability correctly for October 26 service', async () => {
      const existingAvailabilities = {
        [mockServiceOct26]: 'available' as const
      };

      mockMember.value = createMockMember(existingAvailabilities);

      const updatedMember = createMockMember({});

      vi.mocked(membersService.updateMember).mockResolvedValue(updatedMember);

      const wrapper = mount(DisponibilitesPage);
      await wrapper.vm.$nextTick();

      // Toggle off availability (available -> null)
      await (wrapper.vm as any).setAvailability(mockServiceOct26, 'available');

      expect(membersService.updateMember).toHaveBeenCalledWith('member-123', {
        availabilities: {}
      });
    });

    it('should handle multiple rapid updates without data loss', async () => {
      const existingAvailabilities = {
        [mockServiceId1]: 'available' as const
      };

      mockMember.value = createMockMember(existingAvailabilities);

      const wrapper = mount(DisponibilitesPage);
      await wrapper.vm.$nextTick();

      // Update 1
      vi.mocked(membersService.updateMember).mockResolvedValue(
        createMockMember({
          ...existingAvailabilities,
          [mockServiceId2]: 'unavailable'
        })
      );
      await (wrapper.vm as any).setAvailability(mockServiceId2, 'unavailable');

      // Update 2
      vi.mocked(membersService.updateMember).mockResolvedValue(
        createMockMember({
          ...existingAvailabilities,
          [mockServiceId2]: 'unavailable',
          [mockServiceId3]: 'available'
        })
      );
      await (wrapper.vm as any).setAvailability(mockServiceId3, 'available');

      // Update 3 - October 26
      vi.mocked(membersService.updateMember).mockResolvedValue(
        createMockMember({
          ...existingAvailabilities,
          [mockServiceId2]: 'unavailable',
          [mockServiceId3]: 'available',
          [mockServiceOct26]: 'available'
        })
      );
      await (wrapper.vm as any).setAvailability(mockServiceOct26, 'available');

      // Verify all updates preserved previous data
      const calls = vi.mocked(membersService.updateMember).mock.calls;
      expect(calls[0][1].availabilities).toHaveProperty(mockServiceId1);
      expect(calls[1][1].availabilities).toHaveProperty(mockServiceId1);
      expect(calls[2][1].availabilities).toHaveProperty(mockServiceId1);
      expect(calls[2][1].availabilities).toHaveProperty(mockServiceId2);
      expect(calls[2][1].availabilities).toHaveProperty(mockServiceId3);
    });
  });

  describe('Error handling and recovery', () => {
    it('should revert local state on update error', async () => {
      const existingAvailabilities = {
        [mockServiceId1]: 'available' as const
      };

      mockMember.value = createMockMember(existingAvailabilities);

      vi.mocked(membersService.updateMember).mockRejectedValue(new Error('Update failed'));

      const wrapper = mount(DisponibilitesPage);
      await wrapper.vm.$nextTick();

      // Try to update availability (will fail)
      await (wrapper.vm as any).setAvailability(mockServiceId2, 'available');

      // Verify state reverted to original
      const currentAvailabilities = (wrapper.vm as any).currentAvailabilities;
      expect(currentAvailabilities[mockServiceId1]).toBe('available');
      expect(currentAvailabilities[mockServiceId2]).toBeUndefined();
    });

    it('should handle member data reload correctly', async () => {
      const initialAvailabilities = {
        [mockServiceId1]: 'available' as const
      };

      mockMember.value = createMockMember(initialAvailabilities);

      const wrapper = mount(DisponibilitesPage);
      await wrapper.vm.$nextTick();

      // Update member data externally
      const updatedAvailabilities = {
        [mockServiceId1]: 'unavailable' as const,
        [mockServiceId2]: 'available' as const
      };
      mockMember.value = createMockMember(updatedAvailabilities);

      // Trigger reload
      (wrapper.vm as any).loadMemberAvailabilities();

      const currentAvailabilities = (wrapper.vm as any).currentAvailabilities;
      expect(currentAvailabilities).toEqual(updatedAvailabilities);
    });
  });

  describe('UI state synchronization', () => {
    it('should update UI immediately on availability change', async () => {
      mockMember.value = createMockMember({});

      const wrapper = mount(DisponibilitesPage);
      await wrapper.vm.$nextTick();

      // Mock successful update
      vi.mocked(membersService.updateMember).mockResolvedValue(
        createMockMember({ [mockServiceId1]: 'available' })
      );

      // Update availability
      await (wrapper.vm as any).setAvailability(mockServiceId1, 'available');

      // Check immediate UI update
      const currentAvailabilities = (wrapper.vm as any).currentAvailabilities;
      expect(currentAvailabilities[mockServiceId1]).toBe('available');
    });

    it('should sync originalAvailabilities after successful save', async () => {
      mockMember.value = createMockMember({});

      const wrapper = mount(DisponibilitesPage);
      await wrapper.vm.$nextTick();

      const updatedMember = createMockMember({ [mockServiceId1]: 'available' });
      vi.mocked(membersService.updateMember).mockResolvedValue(updatedMember);

      await (wrapper.vm as any).setAvailability(mockServiceId1, 'available');

      const originalAvailabilities = (wrapper.vm as any).originalAvailabilities;
      expect(originalAvailabilities[mockServiceId1]).toBe('available');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty string values gracefully', async () => {
      const invalidAvailabilities = {
        [mockServiceId1]: '' as any,
        [mockServiceId2]: 'available'
      };

      mockMember.value = createMockMember(invalidAvailabilities);

      const wrapper = mount(DisponibilitesPage);
      await wrapper.vm.$nextTick();

      const currentAvailabilities = (wrapper.vm as any).currentAvailabilities;
      expect(currentAvailabilities[mockServiceId1]).toBe('');
      expect(currentAvailabilities[mockServiceId2]).toBe('available');
    });

    it('should handle very long service IDs', async () => {
      const longServiceId = 'service-' + 'x'.repeat(100);
      const availabilities = {
        [longServiceId]: 'available' as const
      };

      mockMember.value = createMockMember(availabilities);

      const wrapper = mount(DisponibilitesPage);
      await wrapper.vm.$nextTick();

      const currentAvailabilities = (wrapper.vm as any).currentAvailabilities;
      expect(currentAvailabilities[longServiceId]).toBe('available');
    });
  });
});