'use client';

import { Suspense } from 'react';
import VerifyOtpInner from './VerifyOtpInner';

export const dynamic = 'force-dynamic'; // Prevents pre-rendering to avoid useSearchParams crash

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<div className="text-center py-10">Loading OTP page...</div>}>
      <VerifyOtpInner />
    </Suspense>
  );
}
