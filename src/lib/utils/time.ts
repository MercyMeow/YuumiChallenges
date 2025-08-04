/**
 * Format a date as relative time (e.g., "5 minutes ago", "2 hours ago")
 */
export function formatRelativeTime(date: Date | string | null | undefined): string {
  if (!date) {
    return 'Never';
  }
  
  const now = new Date();
  const past = new Date(date);
  
  // Check if the date is valid
  if (isNaN(past.getTime())) {
    return 'Never';
  }
  
  const diffMs = now.getTime() - past.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 30) return 'Just now';
  if (diffSec < 60) return `${diffSec} seconds ago`;
  if (diffMin < 60) return diffMin === 1 ? '1 minute ago' : `${diffMin} minutes ago`;
  if (diffHour < 24) return diffHour === 1 ? '1 hour ago' : `${diffHour} hours ago`;
  if (diffDay < 7) return diffDay === 1 ? '1 day ago' : `${diffDay} days ago`;
  
  // For older dates, show absolute date
  return past.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Format time remaining until a future date
 */
export function formatTimeRemaining(date: Date | string | null | undefined): string {
  if (!date) return '0 seconds';
  
  const now = new Date();
  const future = new Date(date);
  
  // Check if the date is valid
  if (isNaN(future.getTime())) {
    return '0 seconds';
  }
  
  const diffMs = future.getTime() - now.getTime();
  
  if (diffMs <= 0) return '0 seconds';
  
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  
  const remainingSec = diffSec % 60;
  const remainingMin = diffMin % 60;

  if (diffHour > 0) {
    return diffHour === 1 ? '1 hour' : `${diffHour} hours`;
  } else if (diffMin > 0) {
    return remainingSec > 0 ? `${remainingMin}m ${remainingSec}s` : `${diffMin}m`;
  } else {
    return diffSec === 1 ? '1 second' : `${diffSec} seconds`;
  }
}

/**
 * Check if a cooldown period has expired
 */
export function isCooldownExpired(lastAction: Date | string | null | undefined, cooldownMinutes: number): boolean {
  if (!lastAction) return true;
  
  const now = new Date();
  const last = new Date(lastAction);
  const diffMs = now.getTime() - last.getTime();
  const cooldownMs = cooldownMinutes * 60 * 1000;
  
  return diffMs >= cooldownMs;
}

/**
 * Get the next available time for an action
 */
export function getNextAvailableTime(lastAction: Date | string | null | undefined, cooldownMinutes: number): Date {
  if (!lastAction) return new Date();
  
  const last = new Date(lastAction);
  return new Date(last.getTime() + (cooldownMinutes * 60 * 1000));
}

// =============================================
// MATCH TIMELINE TIME FORMATTING
// =============================================

/**
 * Convert milliseconds to MM:SS format for match timeline display
 * Enhanced version with better error handling and performance
 * 
 * @param milliseconds - Time in milliseconds
 * @returns Formatted time string (e.g., "1:05", "65:42")
 * 
 * @example
 * ```typescript
 * formatMatchTime(65000) // "1:05"
 * formatMatchTime(125000) // "2:05"
 * formatMatchTime(-1000) // "0:00"
 * formatMatchTime(null) // "0:00"
 * ```
 */
export function formatMatchTime(milliseconds: number | null | undefined): string {
  // Handle edge cases
  if (milliseconds == null || isNaN(milliseconds) || milliseconds < 0) {
    return "0:00";
  }
  
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Convert seconds to MM:SS format for match timeline display
 * 
 * @param seconds - Time in seconds
 * @returns Formatted time string (e.g., "1:05", "65:42")
 * 
 * @example
 * ```typescript
 * formatMatchTimeFromSeconds(65) // "1:05"
 * formatMatchTimeFromSeconds(125) // "2:05"
 * ```
 */
export function formatMatchTimeFromSeconds(seconds: number | null | undefined): string {
  if (seconds == null || isNaN(seconds) || seconds < 0) {
    return "0:00";
  }
  
  const totalSeconds = Math.floor(seconds);
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;
  
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}