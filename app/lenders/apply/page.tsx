// app/lenders/apply/page.tsx
'use client';

import React from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { LenderApplySection } from '@/components/sections/LenderApplySection';

export default function LenderApplyPage() {
  return (
    <>
      <Header activeTab="lender" />
      
      <main className="pt-16 md:pt-20">
        <LenderApplySection />
      </main>
      
      <Footer />
    </>
  );
}