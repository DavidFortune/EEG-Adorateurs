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

describe('Members Service - Availability Updates', () => {
  const mockMemberId = 'test-member-123';
  const mockServiceId1 = 'service-001';
  const mockServiceId2 = 'service-002';
  const mockServiceId3 = 'service-003';

  const createMockMember = (availabilities = {}): Member => ({
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

  describe('updateMember - availability preservation', () => {
    it('should preserve existing availabilities when updating other fields', async () => {
      const existingAvailabilities = {
        [mockServiceId1]: 'available' as const,
        [mockServiceId2]: 'unavailable' as const
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

      // Update only the phone number
      const result = await membersService.updateMember(mockMemberId, {
        phone: '9876543210'
      });

      // Verify availabilities are preserved
      expect(result?.availabilities).toEqual(existingAvailabilities);
      expect(result?.phone).toBe('9876543210');
    });

    it('should not lose availabilities when updating with undefined availabilities', async () => {
      const existingAvailabilities = {
        [mockServiceId1]: 'available' as const,
        [mockServiceId2]: 'unavailable' as const,
        [mockServiceId3]: 'available' as const
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

      // Update with undefined availabilities
      const result = await membersService.updateMember(mockMemberId, {
        fullName: 'Updated Name',
        availabilities: undefined
      });

      // Verify all existing availabilities are preserved
      expect(result?.availabilities).toEqual(existingAvailabilities);
      expect(Object.keys(result?.availabilities || {})).toHaveLength(3);
    });

    it('should properly update availabilities when explicitly provided', async () => {
      const existingAvailabilities = {
        [mockServiceId1]: 'available' as const,
        [mockServiceId2]: 'unavailable' as const
      };

      const newAvailabilities = {
        [mockServiceId1]: 'unavailable' as const, // Changed
        [mockServiceId2]: 'available' as const,   // Changed
        [mockServiceId3]: 'available' as const    // Added
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
        availabilities: newAvailabilities
      });

      // Verify availabilities are updated correctly
      expect(result?.availabilities).toEqual(newAvailabilities);
      expect(Object.keys(result?.availabilities || {})).toHaveLength(3);
    });

    it('should handle empty availabilities object correctly', async () => {
      const existingAvailabilities = {
        [mockServiceId1]: 'available' as const,
        [mockServiceId2]: 'unavailable' as const
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

      // Explicitly clear all availabilities
      const result = await membersService.updateMember(mockMemberId, {
        availabilities: {}
      });

      // Verify availabilities are cleared
      expect(result?.availabilities).toEqual({});
      expect(Object.keys(result?.availabilities || {})).toHaveLength(0);
    });

    it('should handle member with null availabilities', async () => {
      const mockMember = createMockMember(null as any);
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
        [mockServiceId1]: 'available' as const
      };

      const result = await membersService.updateMember(mockMemberId, {
        availabilities: newAvailabilities
      });

      // Verify availabilities are set correctly
      expect(result?.availabilities).toEqual(newAvailabilities);
    });

    it('should add single availability without affecting others', async () => {
      const existingAvailabilities = {
        [mockServiceId1]: 'available' as const,
        [mockServiceId2]: 'unavailable' as const
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

      // Add new availability
      const updatedAvailabilities = {
        ...existingAvailabilities,
        [mockServiceId3]: 'available' as const
      };

      const result = await membersService.updateMember(mockMemberId, {
        availabilities: updatedAvailabilities
      });

      // Verify all availabilities are present
      expect(result?.availabilities).toEqual(updatedAvailabilities);
      expect(result?.availabilities[mockServiceId1]).toBe('available');
      expect(result?.availabilities[mockServiceId2]).toBe('unavailable');
      expect(result?.availabilities[mockServiceId3]).toBe('available');
    });

    it('should remove single availability without affecting others', async () => {
      const existingAvailabilities = {
        [mockServiceId1]: 'available' as const,
        [mockServiceId2]: 'unavailable' as const,
        [mockServiceId3]: 'available' as const
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

      // Remove one availability
      const { [mockServiceId2]: removed, ...remainingAvailabilities } = existingAvailabilities;

      const result = await membersService.updateMember(mockMemberId, {
        availabilities: remainingAvailabilities
      });

      // Verify correct availability was removed and others remain
      expect(result?.availabilities).toEqual(remainingAvailabilities);
      expect(result?.availabilities[mockServiceId1]).toBe('available');
      expect(result?.availabilities[mockServiceId2]).toBeUndefined();
      expect(result?.availabilities[mockServiceId3]).toBe('available');
    });

    it('should handle concurrent updates correctly', async () => {
      const existingAvailabilities = {
        [mockServiceId1]: 'available' as const
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

      // Simulate multiple updates
      const update1 = {
        ...existingAvailabilities,
        [mockServiceId2]: 'available' as const
      };

      const update2 = {
        ...update1,
        [mockServiceId3]: 'unavailable' as const
      };

      const result1 = await membersService.updateMember(mockMemberId, {
        availabilities: update1
      });

      // Mock the updated state for second call
      mockDocSnap.data = () => ({
        ...mockMember,
        availabilities: update1,
        createdAt: { toDate: () => new Date(mockMember.createdAt) },
        updatedAt: { toDate: () => new Date(mockMember.updatedAt) }
      });

      const result2 = await membersService.updateMember(mockMemberId, {
        availabilities: update2
      });

      expect(result1?.availabilities).toEqual(update1);
      expect(result2?.availabilities).toEqual(update2);
      expect(Object.keys(result2?.availabilities || {})).toHaveLength(3);
    });
  });

  describe('Error handling', () => {
    it('should throw error when member does not exist', async () => {
      const mockDocSnap = {
        exists: () => false
      };

      vi.mocked(getDoc).mockResolvedValue(mockDocSnap as any);

      const result = await membersService.updateMember(mockMemberId, {
        availabilities: { [mockServiceId1]: 'available' }
      });

      expect(result).toBeNull();
    });

    it('should handle Firestore errors gracefully', async () => {
      vi.mocked(getDoc).mockRejectedValue(new Error('Firestore error'));

      await expect(membersService.updateMember(mockMemberId, {
        availabilities: { [mockServiceId1]: 'available' }
      })).rejects.toThrow('Failed to update member');
    });
  });
});