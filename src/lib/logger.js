/**
 * Simple logger utility that respects NODE_ENV
 * In production, only errors and warnings are logged
 */

const isDev = process.env.NODE_ENV !== 'production';

export const logger = {
  /**
   * Debug logs - only shown in development
   * Use for: flow indicators, lookup results, success messages
   */
  debug: (...args) => {
    if (isDev) {
      console.log(...args);
    }
  },

  /**
   * Info logs - only shown in development
   * Use for: important state changes, major operations
   */
  info: (...args) => {
    if (isDev) {
      console.info(...args);
    }
  },

  /**
   * Warning logs - always shown
   * Use for: recoverable errors, fallback scenarios
   */
  warn: (...args) => {
    console.warn(...args);
  },

  /**
   * Error logs - always shown
   * Use for: failures that affect user experience
   */
  error: (...args) => {
    console.error(...args);
  },

  /**
   * Group logs - only in development
   * Use for: organizing related debug logs
   */
  group: (label, fn) => {
    if (isDev) {
      console.group(label);
      fn();
      console.groupEnd();
    }
  }
};

// Convenience exports for common patterns
export const debugLog = logger.debug;
export const errorLog = logger.error;
export const warnLog = logger.warn;
