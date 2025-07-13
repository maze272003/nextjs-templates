'use client';

import { Suspense } from 'react';
import ResendOtpInner from './ResendOtpInner';

export const dynamic = 'force-dynamic'; // Avoids prerender crash for useSearchParams()

export default function ResendOtpPage() {
  return (
    <Suspense fallback={<div className="text-center py-10">Loading...</div>}>
      <ResendOtpInner />
    </Suspense>
  );
}
