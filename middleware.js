import { NextResponse } from 'next/server';

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map();

// Security headers
const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self)',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
};

// Rate limiting configuration
const rateLimitConfig = {
  '/api/bookings': { windowMs: 60000, maxRequests: 10 }, // 10 bookings per minute
  '/api/availability': { windowMs: 60000, maxRequests: 30 }, // 30 checks per minute
  '/api/shops': { windowMs: 60000, maxRequests: 100 }, // 100 requests per minute
  '/api/services': { windowMs: 60000, maxRequests: 100 },
  '/api/upload': { windowMs: 60000, maxRequests: 5 }, // 5 uploads per minute
  'default': { windowMs: 60000, maxRequests: 50 } // Default rate limit
};

function getRateLimitKey(request) {
  // Use IP address (in production, consider user ID for authenticated requests)
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';
  return ip;
}

function isRateLimited(pathname, clientKey) {
  const config = rateLimitConfig[pathname] || rateLimitConfig.default;
  const key = `${clientKey}:${pathname}`;
  const now = Date.now();
  
  if (!rateLimitStore.has(key)) {
    rateLimitStore.set(key, { count: 1, resetTime: now + config.windowMs });
    return false;
  }
  
  const data = rateLimitStore.get(key);
  
  if (now > data.resetTime) {
    // Reset the window
    rateLimitStore.set(key, { count: 1, resetTime: now + config.windowMs });
    return false;
  }
  
  if (data.count >= config.maxRequests) {
    return true;
  }
  
  data.count++;
  rateLimitStore.set(key, data);
  return false;
}

export function middleware(request) {
  const response = NextResponse.next();
  
  // Add security headers to all responses
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  // Apply rate limiting to API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const clientKey = getRateLimitKey(request);
    const isLimited = isRateLimited(request.nextUrl.pathname, clientKey);
    
    if (isLimited) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: 'Too many requests. Please try again later.',
          code: 'RATE_LIMIT_EXCEEDED'
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '60',
            ...securityHeaders
          }
        }
      );
    }
    
    // Add rate limit headers
    const config = rateLimitConfig[request.nextUrl.pathname] || rateLimitConfig.default;
    const key = `${clientKey}:${request.nextUrl.pathname}`;
    const data = rateLimitStore.get(key);
    
    if (data) {
      response.headers.set('X-RateLimit-Limit', config.maxRequests.toString());
      response.headers.set('X-RateLimit-Remaining', Math.max(0, config.maxRequests - data.count).toString());
      response.headers.set('X-RateLimit-Reset', Math.ceil(data.resetTime / 1000).toString());
    }
  }
  
  // Content Security Policy for HTML responses
  if (request.nextUrl.pathname !== '/api/' && !request.nextUrl.pathname.startsWith('/api/')) {
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https:",
      "connect-src 'self' https: wss:",
      "frame-ancestors 'none'"
    ].join('; ');
    
    response.headers.set('Content-Security-Policy', csp);
  }
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};