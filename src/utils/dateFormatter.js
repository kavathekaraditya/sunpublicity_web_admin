/**
 * Centralized date formatting utilities
 */

/**
 * Format a date to locale date string
 * @param {Date|string} date - Date object or string
 * @returns {string} Formatted date string
 */
export const formatDate = (date) => {
    if (!date) return 'N/A';

    try {
        const dateObj = date instanceof Date ? date : new Date(date);
        return dateObj.toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    } catch (error) {
        console.error('Error formatting date:', error);
        return 'Invalid Date';
    }
};

/**
 * Format a date to locale date-time string
 * @param {Date|string} date - Date object or string
 * @returns {string} Formatted date-time string
 */
export const formatDateTime = (date) => {
    if (!date) return 'N/A';

    try {
        const dateObj = date instanceof Date ? date : new Date(date);
        return dateObj.toLocaleString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch (error) {
        console.error('Error formatting date-time:', error);
        return 'Invalid Date';
    }
};

/**
 * Format a date to relative time (e.g., "2 days ago")
 * @param {Date|string} date - Date object or string
 * @returns {string} Relative time string
 */
export const formatRelativeTime = (date) => {
    if (!date) return 'N/A';

    try {
        const dateObj = date instanceof Date ? date : new Date(date);
        const now = new Date();
        const diffMs = now - dateObj;
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHour = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHour / 24);
        const diffWeek = Math.floor(diffDay / 7);
        const diffMonth = Math.floor(diffDay / 30);
        const diffYear = Math.floor(diffDay / 365);

        if (diffSec < 60) return 'Just now';
        if (diffMin < 60) return `${diffMin} ${diffMin === 1 ? 'minute' : 'minutes'} ago`;
        if (diffHour < 24) return `${diffHour} ${diffHour === 1 ? 'hour' : 'hours'} ago`;
        if (diffDay < 7) return `${diffDay} ${diffDay === 1 ? 'day' : 'days'} ago`;
        if (diffWeek < 4) return `${diffWeek} ${diffWeek === 1 ? 'week' : 'weeks'} ago`;
        if (diffMonth < 12) return `${diffMonth} ${diffMonth === 1 ? 'month' : 'months'} ago`;
        return `${diffYear} ${diffYear === 1 ? 'year' : 'years'} ago`;
    } catch (error) {
        console.error('Error formatting relative time:', error);
        return 'Invalid Date';
    }
};

/**
 * Check if a date is expired (in the past)
 * @param {Date|string} date - Date object or string
 * @returns {boolean} True if date is in the past
 */
export const isExpired = (date) => {
    if (!date) return true;

    try {
        const dateObj = date instanceof Date ? date : new Date(date);
        return dateObj < new Date();
    } catch (error) {
        console.error('Error checking expiration:', error);
        return true;
    }
};

/**
 * Format Firestore timestamp to date
 * @param {Object} timestamp - Firestore timestamp object
 * @returns {Date|null} Date object or null
 */
export const firestoreTimestampToDate = (timestamp) => {
    if (!timestamp) return null;

    try {
        if (timestamp.toDate && typeof timestamp.toDate === 'function') {
            return timestamp.toDate();
        }
        return new Date(timestamp);
    } catch (error) {
        console.error('Error converting Firestore timestamp:', error);
        return null;
    }
};
