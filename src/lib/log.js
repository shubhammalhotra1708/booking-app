// Simple structured logging utility for backend routes.
// Extend later with remote sink (e.g., Logtail, Datadog). For now console only.
export function logEvent(event, metadata = {}) {
  const payload = {
    ts: new Date().toISOString(),
    event,
    ...metadata
  };
  // eslint-disable-next-line no-console
  return payload;
}

export function logError(error, context = {}) {
  const payload = {
    ts: new Date().toISOString(),
    level: 'error',
    message: error?.message || String(error),
    stack: error?.stack,
    ...context
  };
  // eslint-disable-next-line no-console
  console.error('[ERROR]', JSON.stringify(payload));
  return payload;
}
