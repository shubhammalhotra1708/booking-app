// Performance monitoring and optimization utilities

// Performance timing utilities
export class PerformanceTracker {
  constructor() {
    this.timings = new Map();
  }

  start(label) {
    this.timings.set(label, performance.now());
  }

  end(label) {
    const startTime = this.timings.get(label);
    if (startTime) {
      const duration = performance.now() - startTime;
      this.timings.delete(label);
      
      // Log slow operations in development
      if (process.env.NODE_ENV === 'development' && duration > 100) {
        console.warn(`⚠️ Slow operation: ${label} took ${duration.toFixed(2)}ms`);
      }
      
      return duration;
    }
    return null;
  }

  measure(label, fn) {
    this.start(label);
    const result = fn();
    this.end(label);
    return result;
  }

  async measureAsync(label, fn) {
    this.start(label);
    const result = await fn();
    this.end(label);
    return result;
  }
}

// Global performance tracker instance
export const perf = new PerformanceTracker();

// Image optimization utilities
export function getOptimizedImageUrl(url, width = 400, quality = 80) {
  if (!url) return null;
  
  // If it's already a Next.js optimized image, return as is
  if (url.includes('/_next/image')) return url;
  
  // For external images, you could integrate with a service like Cloudinary
  // For now, return the original URL with cache busting
  return url;
}

// Debounce utility for search and input handling
export function debounce(func, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

// Throttle utility for scroll and resize events
export function throttle(func, limit) {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Lazy loading intersection observer
export function createIntersectionObserver(callback, options = {}) {
  const defaultOptions = {
    root: null,
    rootMargin: '50px',
    threshold: 0.1,
    ...options
  };

  if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
    return new IntersectionObserver(callback, defaultOptions);
  }
  
  return null;
}

// Memory usage monitoring (development only)
export function logMemoryUsage(label = 'Memory Usage') {
  if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
    if ('memory' in performance) {
      const memory = performance.memory;
      console.log(`📊 ${label}:`, {
        used: `${Math.round(memory.usedJSHeapSize / 1048576)}MB`,
        total: `${Math.round(memory.totalJSHeapSize / 1048576)}MB`,
        limit: `${Math.round(memory.jsHeapSizeLimit / 1048576)}MB`
      });
    }
  }
}

// Bundle size analysis helper
export function analyzeBundleSize() {
  if (process.env.NODE_ENV === 'development') {
    console.log('📦 To analyze bundle size, run: npm run build && npm run analyze');
  }
}

// Critical resource hints
export function preloadCriticalResources() {
  if (typeof window !== 'undefined') {
    // Preload critical fonts
    const fontLink = document.createElement('link');
    fontLink.rel = 'preload';
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap';
    fontLink.as = 'style';
    document.head.appendChild(fontLink);

    // Preconnect to external domains
    const domains = ['https://api.example.com', 'https://images.example.com'];
    domains.forEach(domain => {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = domain;
      document.head.appendChild(link);
    });
  }
}

// API response caching
class SimpleCache {
  constructor(maxAge = 5 * 60 * 1000) { // 5 minutes default
    this.cache = new Map();
    this.maxAge = maxAge;
  }

  set(key, value) {
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > this.maxAge) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  clear() {
    this.cache.clear();
  }

  size() {
    return this.cache.size;
  }
}

export const apiCache = new SimpleCache();

// Optimized fetch with caching
export async function optimizedFetch(url, options = {}) {
  const cacheKey = `${url}:${JSON.stringify(options)}`;
  
  // Check cache for GET requests
  if (!options.method || options.method === 'GET') {
    const cached = apiCache.get(cacheKey);
    if (cached) {
      return cached;
    }
  }

  try {
    const response = await perf.measureAsync(`API: ${url}`, () => 
      fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      })
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Cache successful GET requests
    if (!options.method || options.method === 'GET') {
      apiCache.set(cacheKey, data);
    }

    return data;
  } catch (error) {
    console.error(`API Error (${url}):`, error);
    throw error;
  }
}

// Component performance monitoring hook
export function usePerformanceMonitor(componentName) {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    const startTime = performance.now();
    
    return () => {
      const renderTime = performance.now() - startTime;
      if (renderTime > 16) { // Slower than 60fps
        console.warn(`⚠️ Slow render: ${componentName} took ${renderTime.toFixed(2)}ms`);
      }
    };
  }
  
  return () => {};
}

// Critical CSS inlining helper
export function inlineCriticalCSS() {
  if (typeof window !== 'undefined') {
    // This would be handled by build tools in production
    console.log('💡 Critical CSS should be inlined during build process');
  }
}

// Service Worker registration for caching
export function registerServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('✅ Service Worker registered:', registration);
        })
        .catch(error => {
          console.log('❌ Service Worker registration failed:', error);
        });
    });
  }
}

// Performance metrics reporting
export function reportWebVitals(metric) {
  if (process.env.NODE_ENV === 'production') {
    // In production, you might want to send these to an analytics service
    console.log('📈 Web Vital:', metric);
    
    // Example: Send to analytics
    // gtag('event', metric.name, {
    //   value: Math.round(metric.value),
    //   event_category: 'Web Vitals',
    //   non_interaction: true,
    // });
  }
}