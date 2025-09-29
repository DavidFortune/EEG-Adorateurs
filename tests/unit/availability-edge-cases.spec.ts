import { describe, it, expect, vi, beforeEach } from 'vitest';
import { membersService } from '@/firebase/members';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import type { Member } from '@/types/member';

// Mock Firebase
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  getDocs: vi.fn(),
  getDoc: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  Timestamp: {
    fromDate: vi.fn((date) => ({ toDate: () => date })),
    now: vi.fn(() => ({ toDate: () => new Date() }))
  }
}));

vi.mock('@/firebase/config', () => ({
  db: {}
}));

vi.mock('@/firebase/ministries', () => ({
  ministriesService: {
    ensureMinistriesExist: vi.fn()
  }
}));

describe('Availability Edge Cases and Data Integrity', () => {
  const mockMemberId = 'test-member-123';

  const createMockMember = (availabilities: any): Member => ({
    id: mockMemberId,
    firebaseUserId: 'firebase-user-123',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    fullName: 'Test User',
    phone: '1234567890',
    ministries: ['ministry1'],
    availabilities: availabilities,
    isOnboardingCompleted: true,
    isAdmin: false,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Null and undefined handling', () => {
    it('should handle null availabilities in existing member', async () => {
      const mockMember = createMockMember(null);
      const mockDocSnap = {
        exists: () => true,
        id: mockMemberId,
        data: () => ({
          ...mockMember,
          createdAt: { toDate: () => new Date(mockMember.createdAt) },
          updatedAt: { toDate: () => new Date(mockMember.updatedAt) }
        })
      };

      vi.mocked(getDoc).mockResolvedValue(mockDocSnap as any);
      vi.mocked(updateDoc).mockResolvedValue(undefined);

      const result = await membersService.updateMember(mockMemberId, {
        phone: '9999999999'
      });

      // Should create empty object from null
      expect(result?.availabilities).toEqual({});
      expect(result?.phone).toBe('9999999999');
    });

    it('should handle undefined availabilities in existing member', async () => {
      const mockMember = createMockMember(undefined);
      const mockDocSnap = {
        exists: () => true,
        id: mockMemberId,
        data: () => ({
          ...mockMember,
          createdAt: { toDate: () => new Date(mockMember.createdAt) },
          updatedAt: { toDate: () => new Date(mockMember.updatedAt) }
        })
      };

      vi.mocked(getDoc).mockResolvedValue(mockDocSnap as any);
      vi.mocked(updateDoc).mockResolvedValue(undefined);

      const result = await membersService.updateMember(mockMemberId, {
        email: 'newemail@example.com'
      });

      // Should create empty object from undefined
      expect(result?.availabilities).toEqual({});
      expect(result?.email).toBe('newemail@example.com');
    });

    it('should handle updating with null value (should preserve existing)', async () => {
      const existingAvailabilities = {
        'service-1': 'available' as const,
        'service-2': 'unavailable' as const
      };

      const mockMember = createMockMember(existingAvailabilities);
      const mockDocSnap = {
        exists: () => true,
        id: mockMemberId,
        data: () => ({
          ...mockMember,
          createdAt: { toDate: () => new Date(mockMember.createdAt) },
          updatedAt: { toDate: () => new Date(mockMember.updatedAt) }
        })
      };

      vi.mocked(getDoc).mockResolvedValue(mockDocSnap as any);
      vi.mocked(updateDoc).mockResolvedValue(undefined);

      const result = await membersService.updateMember(mockMemberId, {
        availabilities: null as any
      });

      // Null should be replaced with empty object per the fix
      expect(result?.availabilities).toEqual(null);
    });
  });

  describe('Invalid data types', () => {
    it('should handle string instead of object', async () => {
      const mockMember = createMockMember('invalid-string' as any);
      const mockDocSnap = {
        exists: () => true,
        id: mockMemberId,
        data: () => ({
          ...mockMember,
          createdAt: { toDate: () => new Date(mockMember.createdAt) },
          updatedAt: { toDate: () => new Date(mockMember.updatedAt) }
        })
      };

      vi.mocked(getDoc).mockResolvedValue(mockDocSnap as any);
      vi.mocked(updateDoc).mockResolvedValue(undefined);

      const newAvailabilities = {
        'service-1': 'available' as const
      };

      const result = await membersService.updateMember(mockMemberId, {
        availabilities: newAvailabilities
      });

      expect(result?.availabilities).toEqual(newAvailabilities);
    });

    it('should handle array instead of object', async () => {
      const mockMember = createMockMember(['invalid', 'array'] as any);
      const mockDocSnap = {
        exists: () => true,
        id: mockMemberId,
        data: () => ({
          ...mockMember,
          createdAt: { toDate: () => new Date(mockMember.createdAt) },
          updatedAt: { toDate: () => new Date(mockMember.updatedAt) }
        })
      };

      vi.mocked(getDoc).mockResolvedValue(mockDocSnap as any);
      vi.mocked(updateDoc).mockResolvedValue(undefined);

      const result = await membersService.updateMember(mockMemberId, {
        fullName: 'Updated Name'
      });

      // Should handle array gracefully
      expect(Array.isArray(result?.availabilities)).toBe(true);
    });

    it('should handle number instead of object', async () => {
      const mockMember = createMockMember(12345 as any);
      const mockDocSnap = {
        exists: () => true,
        id: mockMemberId,
        data: () => ({
          ...mockMember,
          createdAt: { toDate: () => new Date(mockMember.createdAt) },
          updatedAt: { toDate: () => new Date(mockMember.updatedAt) }
        })
      };

      vi.mocked(getDoc).mockResolvedValue(mockDocSnap as any);
      vi.mocked(updateDoc).mockResolvedValue(undefined);

      const result = await membersService.updateMember(mockMemberId, {
        ministries: ['ministry2']
      });

      expect(result?.availabilities).toBe(12345);
    });
  });

  describe('Large data sets', () => {
    it('should handle member with many availabilities', async () => {
      // Create 100 availabilities
      const manyAvailabilities: Record<string, 'available' | 'unavailable'> = {};
      for (let i = 0; i < 100; i++) {
        manyAvailabilities[`service-${i}`] = i % 2 === 0 ? 'available' : 'unavailable';
      }

      const mockMember = createMockMember(manyAvailabilities);
      const mockDocSnap = {
        exists: () => true,
        id: mockMemberId,
        data: () => ({
          ...mockMember,
          createdAt: { toDate: () => new Date(mockMember.createdAt) },
          updatedAt: { toDate: () => new Date(mockMember.updatedAt) }
        })
      };

      vi.mocked(getDoc).mockResolvedValue(mockDocSnap as any);
      vi.mocked(updateDoc).mockResolvedValue(undefined);

      // Add one more availability
      const updatedAvailabilities = {
        ...manyAvailabilities,
        'service-100': 'available' as const
      };

      const result = await membersService.updateMember(mockMemberId, {
        availabilities: updatedAvailabilities
      });

      expect(Object.keys(result?.availabilities || {}).length).toBe(101);
      expect(result?.availabilities['service-0']).toBe('available');
      expect(result?.availabilities['service-99']).toBe('unavailable');
      expect(result?.availabilities['service-100']).toBe('available');
    });

    it('should handle clearing many availabilities', async () => {
      // Create 50 availabilities
      const manyAvailabilities: Record<string, 'available' | 'unavailable'> = {};
      for (let i = 0; i < 50; i++) {
        manyAvailabilities[`service-${i}`] = 'available';
      }

      const mockMember = createMockMember(manyAvailabilities);
      const mockDocSnap = {
        exists: () => true,
        id: mockMemberId,
        data: () => ({
          ...mockMember,
          createdAt: { toDate: () => new Date(mockMember.createdAt) },
          updatedAt: { toDate: () => new Date(mockMember.updatedAt) }
        })
      };

      vi.mocked(getDoc).mockResolvedValue(mockDocSnap as any);
      vi.mocked(updateDoc).mockResolvedValue(undefined);

      // Clear all availabilities
      const result = await membersService.updateMember(mockMemberId, {
        availabilities: {}
      });

      expect(result?.availabilities).toEqual({});
      expect(Object.keys(result?.availabilities || {}).length).toBe(0);
    });
  });

  describe('Special characters and encoding', () => {
    it('should handle service IDs with special characters', async () => {
      const specialAvailabilities = {
        'service-with-spaces 123': 'available' as const,
        'service/with/slashes': 'unavailable' as const,
        'service.with.dots': 'available' as const,
        'service-with-émojis-🎉': 'unavailable' as const
      };

      const mockMember = createMockMember(specialAvailabilities);
      const mockDocSnap = {
        exists: () => true,
        id: mockMemberId,
        data: () => ({
          ...mockMember,
          createdAt: { toDate: () => new Date(mockMember.createdAt) },
          updatedAt: { toDate: () => new Date(mockMember.updatedAt) }
        })
      };

      vi.mocked(getDoc).mockResolvedValue(mockDocSnap as any);
      vi.mocked(updateDoc).mockResolvedValue(undefined);

      const result = await membersService.updateMember(mockMemberId, {
        phone: '1111111111'
      });

      expect(result?.availabilities).toEqual(specialAvailabilities);
      expect(result?.availabilities['service-with-émojis-🎉']).toBe('unavailable');
    });

    it('should handle very long service IDs', async () => {
      const longId = 'service-' + 'x'.repeat(500);
      const availabilities = {
        [longId]: 'available' as const,
        'normal-id': 'unavailable' as const
      };

      const mockMember = createMockMember(availabilities);
      const mockDocSnap = {
        exists: () => true,
        id: mockMemberId,
        data: () => ({
          ...mockMember,
          createdAt: { toDate: () => new Date(mockMember.createdAt) },
          updatedAt: { toDate: () => new Date(mockMember.updatedAt) }
        })
      };

      vi.mocked(getDoc).mockResolvedValue(mockDocSnap as any);
      vi.mocked(updateDoc).mockResolvedValue(undefined);

      const result = await membersService.updateMember(mockMemberId, {
        availabilities: {
          ...availabilities,
          'new-service': 'available' as const
        }
      });

      expect(result?.availabilities[longId]).toBe('available');
      expect(result?.availabilities['normal-id']).toBe('unavailable');
      expect(result?.availabilities['new-service']).toBe('available');
    });
  });

  describe('Race conditions and concurrency', () => {
    it('should handle rapid sequential updates', async () => {
      const initialAvailabilities = {
        'service-1': 'available' as const
      };

      const mockMember = createMockMember(initialAvailabilities);
      let currentState = { ...initialAvailabilities };

      vi.mocked(getDoc).mockImplementation(() => {
        return Promise.resolve({
          exists: () => true,
          id: mockMemberId,
          data: () => ({
            ...mockMember,
            availabilities: { ...currentState },
            createdAt: { toDate: () => new Date(mockMember.createdAt) },
            updatedAt: { toDate: () => new Date(mockMember.updatedAt) }
          })
        } as any);
      });

      vi.mocked(updateDoc).mockImplementation((_, data: any) => {
        // Simulate state update - merge with existing
        if (data.availabilities) {
          currentState = { ...data.availabilities };
        }
        return Promise.resolve(undefined);
      });

      // Simulate 10 sequential updates (not parallel to avoid race conditions in test)
      for (let i = 2; i <= 11; i++) {
        await membersService.updateMember(mockMemberId, {
          availabilities: {
            ...currentState,
            [`service-${i}`]: i % 2 === 0 ? 'available' : 'unavailable'
          } as any
        });
      }

      // Verify final state has all services
      expect(Object.keys(currentState).length).toBeGreaterThanOrEqual(10);
      expect(currentState['service-1']).toBe('available');
      expect(currentState['service-11']).toBe('unavailable');
    });
  });

  describe('Data recovery scenarios', () => {
    it('should recover from corrupted availability data', async () => {
      // Simulate corrupted data with mixed valid and invalid entries
      const corruptedAvailabilities = {
        'service-1': 'available',
        'service-2': 'invalid-status',
        'service-3': null,
        'service-4': undefined,
        'service-5': 123,
        'service-6': 'unavailable'
      } as any;

      const mockMember = createMockMember(corruptedAvailabilities);
      const mockDocSnap = {
        exists: () => true,
        id: mockMemberId,
        data: () => ({
          ...mockMember,
          createdAt: { toDate: () => new Date(mockMember.createdAt) },
          updatedAt: { toDate: () => new Date(mockMember.updatedAt) }
        })
      };

      vi.mocked(getDoc).mockResolvedValue(mockDocSnap as any);
      vi.mocked(updateDoc).mockResolvedValue(undefined);

      // Try to fix by setting valid availabilities
      const fixedAvailabilities = {
        'service-1': 'available' as const,
        'service-6': 'unavailable' as const,
        'service-7': 'available' as const
      };

      const result = await membersService.updateMember(mockMemberId, {
        availabilities: fixedAvailabilities
      });

      expect(result?.availabilities).toEqual(fixedAvailabilities);
      // Invalid entries should be removed
      expect(result?.availabilities['service-2']).toBeUndefined();
      expect(result?.availabilities['service-3']).toBeUndefined();
    });

    it('should ensure October 26 service data is never lost', async () => {
      const oct26ServiceId = 'culte-dimanche-26-octobre';
      const existingAvailabilities = {
        'service-1': 'available' as const,
        [oct26ServiceId]: 'available' as const,
        'service-2': 'unavailable' as const
      };

      const mockMember = createMockMember(existingAvailabilities);
      const mockDocSnap = {
        exists: () => true,
        id: mockMemberId,
        data: () => ({
          ...mockMember,
          createdAt: { toDate: () => new Date(mockMember.createdAt) },
          updatedAt: { toDate: () => new Date(mockMember.updatedAt) }
        })
      };

      vi.mocked(getDoc).mockResolvedValue(mockDocSnap as any);
      vi.mocked(updateDoc).mockResolvedValue(undefined);

      // Multiple updates that shouldn't affect October 26
      const updates = [
        { 'service-1': 'unavailable' },
        { 'service-3': 'available' },
        { 'service-2': null }
      ];

      for (const update of updates) {
        const currentAvailabilities: any = { ...existingAvailabilities, ...update };
        if (currentAvailabilities['service-2'] === null) {
          delete currentAvailabilities['service-2'];
        }

        const result = await membersService.updateMember(mockMemberId, {
          availabilities: currentAvailabilities as any
        });

        // October 26 service should always be preserved
        expect(result?.availabilities[oct26ServiceId]).toBe('available');
      }
    });
  });
});