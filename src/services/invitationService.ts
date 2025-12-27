import { Share } from '@capacitor/share';
import type { Service } from '@/types/service';
import { serviceService } from '@/services/serviceService';
import { teamsService } from '@/firebase/teams';

const BASE_URL = 'https://adorateurs.eglisegalilee.com';
const REDIRECT_KEY = 'postLoginRedirect';
const INVITED_SERVICE_KEY = 'invitedServiceId';

/**
 * Format service date and time for sharing
 */
function formatServiceDateTime(date: string, time: string): string {
  const [year, month, day] = date.split('-').map(Number);
  const [hours, minutes] = time.split(':').map(Number);

  const dateObj = new Date(year, month - 1, day, hours, minutes);

  const dayNames = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  const monthNames = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin',
                      'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

  const dayName = dayNames[dateObj.getDay()];
  const dayNum = day;
  const monthName = monthNames[month - 1];
  const yearNum = year;
  const timeStr = `${hours}h${minutes.toString().padStart(2, '0')}`;

  return `${dayName} ${dayNum} ${monthName} ${yearNum} à ${timeStr}`;
}

export const invitationService = {
  /**
   * Generate shareable invitation link for a service
   */
  generateInviteLink(serviceId: string): string {
    return `${BASE_URL}/invite/${serviceId}`;
  },

  /**
   * Share service invitation via native share sheet
   */
  async shareServiceInvite(service: Service): Promise<void> {
    const link = this.generateInviteLink(service.id);
    const formattedDate = formatServiceDateTime(service.date, service.time);

    await Share.share({
      title: `Invitation: ${service.title}`,
      text: `Tu es invité(e) au service "${service.title}" le ${formattedDate}. Rejoins-nous!`,
      url: link,
      dialogTitle: 'Partager l\'invitation'
    });
  },

  /**
   * Store redirect URL for after login/onboarding
   */
  setPostLoginRedirect(path: string): void {
    localStorage.setItem(REDIRECT_KEY, path);
  },

  /**
   * Get and clear redirect URL (returns null if none set)
   */
  getAndClearPostLoginRedirect(): string | null {
    const path = localStorage.getItem(REDIRECT_KEY);
    localStorage.removeItem(REDIRECT_KEY);
    return path;
  },

  /**
   * Check if there's a pending redirect without clearing it
   */
  hasPendingRedirect(): boolean {
    return localStorage.getItem(REDIRECT_KEY) !== null;
  },

  /**
   * Store the service ID that the user was invited to
   */
  setInvitedServiceId(serviceId: string): void {
    localStorage.setItem(INVITED_SERVICE_KEY, serviceId);
  },

  /**
   * Get and clear the invited service ID
   */
  getAndClearInvitedServiceId(): string | null {
    const serviceId = localStorage.getItem(INVITED_SERVICE_KEY);
    localStorage.removeItem(INVITED_SERVICE_KEY);
    return serviceId;
  },

  /**
   * Add a member as a guest to a service (if not already a guest or team member)
   */
  async addMemberAsGuest(serviceId: string, memberId: string): Promise<boolean> {
    try {
      const service = await serviceService.getServiceById(serviceId);
      if (!service) {
        console.error('Service not found:', serviceId);
        return false;
      }

      // Check if member is already a guest
      const currentGuests = service.guestMemberIds || [];
      if (currentGuests.includes(memberId)) {
        // Already a guest, no need to add
        return true;
      }

      // Check if member is already part of a team required for this service
      if (service.teamRequirements && service.teamRequirements.length > 0) {
        const memberTeams = await teamsService.getMemberTeams(memberId);
        const memberTeamNames = memberTeams
          .filter(team => {
            const membership = team.members.find(m => m.memberId === memberId);
            return membership && (membership.status === 'approved' || !membership.status);
          })
          .map(team => team.name);

        const activeServiceTeamNames = service.teamRequirements
          .filter(req => req.isActive)
          .map(req => req.teamName);

        // If member is in any of the required teams, don't add as guest
        const isTeamMember = activeServiceTeamNames.some(teamName =>
          memberTeamNames.includes(teamName)
        );

        if (isTeamMember) {
          // Member already has access via team membership
          return true;
        }
      }

      // Add member to guest list
      await serviceService.updateService({
        ...service,
        guestMemberIds: [...currentGuests, memberId]
      });

      return true;
    } catch (error) {
      console.error('Error adding member as guest:', error);
      return false;
    }
  }
};
