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
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-gray-600">Redirecting to My Bookings...</div>
    </div>
  );
}

export default function BookingStatusPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div>Redirecting...</div></div>}>
      <RedirectInner />
    </Suspense>
  );
}

