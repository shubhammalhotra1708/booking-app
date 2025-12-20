// Production-safe logging utility
// Only logs in development mode, silent in production

export const devLog = {
  info: (...args) => {
    if (process.env.NODE_ENV === 'development') {
    }
  },
  error: (...args) => {
    // Always log errors, but clean format in production
    if (process.env.NODE_ENV === 'development') {
      console.error('[DEV ERROR]', ...args);
    } else {
      console.error('Error:', args[0]); // Only first argument in production
    }
  },
  warn: (...args) => {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[DEV WARN]', ...args);
    }
  }
};

export const isProduction = process.env.NODE_ENV === 'production';
export const isDevelopment = process.env.NODE_ENV === 'development';