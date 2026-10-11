// app/how-it-works/page.tsx
'use client';

import React from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { HowItWorksHero } from '@/components/sections/HowItWorksHero';
import { BorrowerJourney } from '@/components/sections/BorrowerJourney';
import { SecurityFeatures } from '@/components/sections/SecurityFeatures';
import { FAQSection } from '@/components/sections/FAQSection';
import { CTASection } from '@/components/sections/CTASection';

// JSON-LD for SEO
const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'How Auricore Asset-Backed Lending Works',
  description: 'Learn how Auricore turns your luxury assets into liquidity while keeping them in your possession.',
  step: [
    { '@type': 'HowToStep', name: 'Apply Online', text: 'Upload photos and details of your luxury items. Our AI instantly estimates their value.' },
    { '@type': 'HowToStep', name: 'Credit Check', text: 'We perform a soft credit check to ensure you meet our baseline requirements.' },
    { '@type': 'HowToStep', name: 'Authentication & Smart Box', text: 'We send an authenticator with our smart box to complete your onboarding in just one day.' },
    { '@type': 'HowToStep', name: 'Sign Agreements', text: 'After reviewing terms, sign our 3-part agreement: Sale, Lease, and Option to Reacquire.' },
    { '@type': 'HowToStep', name: 'Get Funded', text: 'Receive funds directly to your bank account as soon as you sign the agreements.' },
    { '@type': 'HowToStep', name: 'Use & Maintain', text: 'Keep your item at home during the lease period with simple monthly check-ins.' },
    { '@type': 'HowToStep', name: 'Lease Options', text: 'Enjoy flexibility with multiple options at the end of your lease term.' }
  ]
};

export default function HowItWorksPage() {
  return (
    <>
      {/* SEO JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData)
        }}
      />

      <Header />

      <main className="pt-16 md:pt-20">
        <HowItWorksHero />
        <BorrowerJourney />
        <SecurityFeatures />
        <FAQSection />
        <CTASection />
      </main>

      <Footer />
    </>
  );
}