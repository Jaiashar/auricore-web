// /app/confirmation/page.tsx (or similar)
'use client';

import React, { Suspense } from 'react';
import ConfirmationClient from './ConfirmationClient';

export default function ConfirmationPage() {
    return (
        <Suspense fallback={<div>Loading confirmation...</div>}>
            <ConfirmationClient />
        </Suspense>
    );
}
