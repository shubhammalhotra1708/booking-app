'use client';

import { useEffect } from 'react';

export default function Error({ error, reset }) {
  useEffect(() => {
    // Log to monitoring here (Sentry, etc.)
    if (process.env.NODE_ENV !== 'production') {
      console.error('App error:', error);
    }
  }, [error]);

  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-2xl font-semibold text-gray-900">Something went wrong</h1>
      <p className="mt-2 text-gray-600">Please try again. If the problem persists, contact support.</p>
      <div className="mt-4 flex gap-3">
        <button
          onClick={() => reset()}
          className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
        >
          Try again
        </button>
        <a href="/" className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50">Go home</a>
      </div>
    </div>
  );
}
