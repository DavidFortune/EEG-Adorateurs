const TIMEZONE = 'America/Toronto';

export const timezoneUtils = {
  /**
   * Get current date in Toronto timezone formatted as YYYY-MM-DD
   */
  getCurrentDate(): string {
    return new Date().toLocaleDateString('en-CA', {
      timeZone: TIMEZONE
    });
  },

  /**
   * Get current time in Toronto timezone formatted as HH:MM
   */
  getCurrentTime(): string {
    return new Date().toLocaleTimeString('en-CA', {
      timeZone: TIMEZONE,
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  /**
   * Format a date string with weekday for display in French Canadian (America/Toronto timezone)
   */
  formatDateForDisplay(dateStr: string): string {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('fr-CA', {
      timeZone: TIMEZONE,
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  },

  /**
   * Format date and time with weekday for display in French Canadian (America/Toronto timezone)
   */
  formatDateTimeForDisplay(dateStr: string, timeStr: string): string {
    const datetime = new Date(`${dateStr}T${timeStr}:00`);
    return datetime.toLocaleDateString('fr-CA', {
      timeZone: TIMEZONE,
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }) + ' à ' + timeStr;
  },

  /**
   * Get ISO string for a date/time in Toronto timezone for storage
   */
  getISOStringForStorage(dateStr: string, timeStr: string): string {
    // Create date in Toronto timezone
    const datetime = new Date(`${dateStr}T${timeStr}:00`);
    
    // Get timezone offset for Toronto at this specific date
    const torontoTime = new Date(datetime.toLocaleString('en-US', { timeZone: TIMEZONE }));
    const utcTime = new Date(datetime.toLocaleString('en-US', { timeZone: 'UTC' }));
    const offset = utcTime.getTime() - torontoTime.getTime();
    
    // Adjust the date by the offset to get the correct UTC time
    return new Date(datetime.getTime() + offset).toISOString();
  },

  /**
   * Convert ISO string to Toronto date
   */
  isoToTorontoDate(isoString: string): string {
    return new Date(isoString).toLocaleDateString('en-CA', {
      timeZone: TIMEZONE
    });
  },

  /**
   * Convert ISO string to Toronto time
   */
  isoToTorontoTime(isoString: string): string {
    return new Date(isoString).toLocaleTimeString('en-CA', {
      timeZone: TIMEZONE,
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  /**
   * Get minimum date (today) in Toronto timezone
   */
  getMinDate(): string {
    return this.getCurrentDate();
  }
};