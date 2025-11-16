'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function RedirectInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const bookingId = searchParams.get('booking_id');
    const qs = bookingId ? `?highlight=${encodeURIComponent(bookingId)}` : '';
    router.replace(`/my-bookings${qs}`);
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
        <p className="text-gray-500 mt-2">Redirecting to My Bookings...</p>
      </div>
    </div>
  );
}

export default function BookingSuccess() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div>Redirecting...</div></div>}>
      <RedirectInner />
    </Suspense>
  );
}
