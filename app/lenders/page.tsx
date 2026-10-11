// app/lenders/page.tsx
'use client';

import React from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { EnhancedHeroSection } from '@/components/sections/FeatureSections';
import { LenderComparisonSection } from '@/components/sections/ComparisonSections';
import { RevisedHowItWorksSection } from '@/components/sections/FeatureSections';
import { LenderBenefitsSection } from '@/components/sections/LenderBenefitsSection';
import { CTASection } from '@/components/sections/CTASection';

export default function LendersPage() {
  return (
    <>
      <Header activeTab="lender" />
      
      <main className="overflow-hidden pt-16 md:pt-20">
        {/* Hero Section */}
        <EnhancedHeroSection activeTab="lender" />

        {/* Lender Benefits */}
        <LenderBenefitsSection />

        {/* Competitive Comparison */}
        <LenderComparisonSection />

        {/* How It Works with Learn More button */}
        <RevisedHowItWorksSection 
          activeTab="lender" 
          showLearnMoreButton={true} 
        />

      </main>

      <Footer />
    </>
  );
}