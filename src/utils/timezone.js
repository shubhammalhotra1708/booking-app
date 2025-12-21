/**
 * Timezone Utilities for IST (India Standard Time)
 * All dates and times in the app should use IST (UTC+5:30)
 */

// IST is UTC+5:30 (330 minutes ahead of UTC)
export const IST_OFFSET_MINUTES = 330;
export const IST_TIMEZONE = 'Asia/Kolkata';

/**
 * Get current date and time in IST
 * @returns {Date} Current date/time adjusted to IST
 */
export function getNowIST() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: IST_TIMEZONE }));
}

/**
 * Get today's date string in IST (YYYY-MM-DD format)
 * @returns {string} Today's date in IST
 */
export function getTodayIST() {
  const now = getNowIST();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get current time in IST (HH:MM format)
 * @returns {string} Current time in IST
 */
export function getCurrentTimeIST() {
  const now = getNowIST();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Get current time in minutes since midnight (IST)
 * @returns {number} Minutes since midnight
 */
export function getCurrentMinutesIST() {
  const now = getNowIST();
  return now.getHours() * 60 + now.getMinutes();
}

/**
 * Check if a given date string is today in IST
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @returns {boolean} True if date is today in IST
 */
export function isTodayIST(dateString) {
  return dateString === getTodayIST();
}

/**
 * Check if a given date string is in the past (IST)
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @returns {boolean} True if date is in the past
 */
export function isPastDateIST(dateString) {
  const today = getTodayIST();
  return dateString < today;
}

/**
 * Check if a given date string is in the future (IST)
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @returns {boolean} True if date is in the future
 */
export function isFutureDateIST(dateString) {
  const today = getTodayIST();
  return dateString > today;
}

/**
 * Convert time string to minutes since midnight
 * @param {string} timeString - Time in HH:MM format
 * @returns {number} Minutes since midnight
 */
export function timeToMinutes(timeString) {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Check if a time slot has passed today (IST)
 * @param {string} timeString - Time in HH:MM format
 * @param {number} bufferMinutes - Buffer time in minutes (default: 15)
 * @returns {boolean} True if time slot has passed
 */
export function isTimeSlotPastIST(timeString, bufferMinutes = 15) {
  const currentMinutes = getCurrentMinutesIST();
  const slotMinutes = timeToMinutes(timeString);
  return slotMinutes < (currentMinutes + bufferMinutes);
}

/**
 * Format date for display (localized to IST)
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @returns {string} Formatted date string
 */
export function formatDateIST(dateString) {
  const date = new Date(dateString + 'T00:00:00');
  return date.toLocaleDateString('en-IN', {
    timeZone: IST_TIMEZONE,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Get date object for a specific date string in IST
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @returns {Date} Date object in IST timezone
 */
export function getDateIST(dateString) {
  // Create date at midnight IST
  return new Date(new Date(dateString + 'T00:00:00').toLocaleString('en-US', { timeZone: IST_TIMEZONE }));
}

/**
 * Log current IST time (for debugging)
 */
export function logISTTime() {
  // Debug function - no-op in production
  return;
}

