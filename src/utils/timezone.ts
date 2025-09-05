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
    const formattedDate = date.toLocaleDateString('fr-CA', {
      timeZone: TIMEZONE,
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    // Capitalize the first letter (weekday)
    return formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
  },

  /**
   * Format date and time with weekday for display in French Canadian (America/Toronto timezone)
   */
  formatDateTimeForDisplay(dateStr: string, timeStr: string): string {
    const datetime = new Date(`${dateStr}T${timeStr}:00`);
    const formattedDate = datetime.toLocaleDateString('fr-CA', {
      timeZone: TIMEZONE,
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    // Capitalize the first letter (weekday)
    const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
    
    return capitalizedDate + ' à ' + timeStr;
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
  },

  /**
   * Format date and time for Team section display (e.g., "Dim 7 sept 2025 à 11:00")
   */
  formatTeamDateTime(dateStr: string, timeStr: string): string {
    const datetime = new Date(`${dateStr}T${timeStr}:00`);
    const options: Intl.DateTimeFormatOptions = {
      timeZone: TIMEZONE,
      weekday: 'short',
      day: 'numeric', 
      month: 'short',
      year: 'numeric'
    };
    
    const formattedDate = datetime.toLocaleDateString('fr-CA', options);
    // Capitalize the first letter (weekday)
    const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
    
    return `${capitalizedDate} à ${timeStr}`;
  },

  /**
   * Format date and time in separate components for 3-line layout
   */
  formatTeamDateTimeSegments(dateStr: string, timeStr: string): { weekday: string, date: string, time: string } {
    const datetime = new Date(`${dateStr}T${timeStr}:00`);
    
    const weekday = datetime.toLocaleDateString('fr-CA', {
      timeZone: TIMEZONE,
      weekday: 'short'
    });
    
    const dateOnly = datetime.toLocaleDateString('fr-CA', {
      timeZone: TIMEZONE,
      day: 'numeric',
      month: 'short'
    });
    
    return {
      weekday: weekday.charAt(0).toUpperCase() + weekday.slice(1),
      date: dateOnly,
      time: timeStr
    };
  }
};