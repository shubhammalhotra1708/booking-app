// Central CORS helper. Allows dynamic origins without hardcoding localhost.
// ALLOWED_ORIGINS env can be a comma-separated list. If absent, we fall back to production domains.
const DEFAULT_ORIGINS = [
  'https://booking-app-six-ruby.vercel.app',
  'https://admin-app-topaz-sigma.vercel.app'
];

export function getAllowedOrigins() {
  const raw = process.env.ALLOWED_ORIGINS || '';
  const list = raw
    .split(',')
    .map(o => o.trim())
    .filter(Boolean);
  return list.length ? list : DEFAULT_ORIGINS;
}

export function getCorsHeaders(requestOrigin) {
  const allowed = getAllowedOrigins();
  const originToUse = requestOrigin && allowed.includes(requestOrigin)
    ? requestOrigin
    : allowed[0];
  return {
    'Access-Control-Allow-Origin': originToUse,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };
}
