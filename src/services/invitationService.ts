import { Share } from '@capacitor/share';
import type { Service } from '@/types/service';

const BASE_URL = 'https://adorateurs.eglisegalilee.com';
const REDIRECT_KEY = 'postLoginRedirect';

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
  }
};
