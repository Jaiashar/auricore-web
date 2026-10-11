// app/item‐details/page.tsx
import React, { Suspense } from 'react';
import LoadingOverlay from '@/components/LoadingOverlay';
import ItemDetailsClient from './ItemDetailsClient';

export const dynamic = 'force-dynamic';

export default function Page() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <LoadingOverlay message="Loading item details…" />
      </div>
    }>
      <ItemDetailsClient />
    </Suspense>
  );
}
