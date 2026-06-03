/**
 * Centralized logging utility for the application
 * Provides consistent logging with environment-aware behavior
 */

const isDevelopment = import.meta.env.MODE === 'development';

/**
 * Log levels
 */
export const LogLevel = {
    ERROR: 'error',
    WARN: 'warn',
    INFO: 'info',
    DEBUG: 'debug',
};

/**
 * Logger class for centralized logging
 */
class Logger {
    /**
     * Log an error message
     * @param {string} message - Error message
     * @param {Error|Object} [error] - Error object or additional context
     */
    error(message, error) {
        if (isDevelopment) {
            console.error(`[ERROR] ${message}`, error || '');
        }
        // In production, you could send to error tracking service like Sentry
        // this.sendToErrorTracking(message, error);
    }

    /**
     * Log a warning message
     * @param {string} message - Warning message
     * @param {Object} [context] - Additional context
     */
    warn(message, context) {
        if (isDevelopment) {
            console.warn(`[WARN] ${message}`, context || '');
        }
    }

    /**
     * Log an info message (development only)
     * @param {string} message - Info message
     * @param {Object} [data] - Additional data
     */
    info(message, data) {
        if (isDevelopment) {
            console.log(`[INFO] ${message}`, data || '');
        }
    }

    /**
     * Log a debug message (development only)
     * @param {string} message - Debug message
     * @param {Object} [data] - Additional data
     */
    debug(message, data) {
        if (isDevelopment) {
            console.debug(`[DEBUG] ${message}`, data || '');
        }
    }

    /**
     * Log Firebase errors with user-friendly messages
     * @param {Error} error - Firebase error
     * @param {string} context - Context where error occurred
     * @returns {string} User-friendly error message
     */
    handleFirebaseError(error, context = 'Operation') {
        const errorCode = error?.code || '';
        let userMessage = '';

        switch (errorCode) {
            case 'auth/user-not-found':
                userMessage = 'User does not exist. Please sign up first.';
                break;
            case 'auth/wrong-password':
            case 'auth/invalid-credential':
                userMessage = 'Invalid email or password.';
                break;
            case 'auth/email-already-in-use':
                userMessage = 'Email is already in use. Please login instead.';
                break;
            case 'auth/weak-password':
                userMessage = 'Password should be at least 6 characters.';
                break;
            case 'auth/invalid-email':
                userMessage = 'Please enter a valid email address.';
                break;
            case 'auth/too-many-requests':
                userMessage = 'Too many failed attempts. Please try again later.';
                break;
            case 'permission-denied':
                userMessage = 'You do not have permission to perform this action.';
                break;
            case 'not-found':
                userMessage = 'The requested resource was not found.';
                break;
            default:
                userMessage = error?.message || `${context} failed. Please try again.`;
        }

        this.error(`${context} failed`, { code: errorCode, message: error?.message });
        return userMessage;
    }

    /**
     * Future: Send errors to tracking service
     * @private
     */
    // sendToErrorTracking(message, error) {
    //   // Implement Sentry, LogRocket, or other error tracking
    // }
}

// Export singleton instance
export const logger = new Logger();

// Export default
export default logger;
