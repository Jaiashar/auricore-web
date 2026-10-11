// app/price/page.tsx
'use client';

import React from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { PriceHero } from '@/components/sections/PriceHero';
import { OptionSelection } from '@/components/sections/OptionSelection';
import { TrustBadges } from '@/components/sections/TrustBadges';
import { HowPricingWorks } from '@/components/sections/HowPricingWorks';
import { CTASection } from '@/components/sections/CTASection';

// JSON-LD for SEO
const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Free Luxury Item Valuation & Sale-Leaseback Service | Auricore',
  description: 'Get a 100% free valuation and sale-leaseback offer for your luxury watches, handbags, jewelry. Access up to 70% of your item\'s value while keeping it.',
  mainEntity: {
    '@type': 'Service',
    name: 'Free Luxury Item Valuation',
    description: '100% free valuation service with sale-leaseback options up to 70% of market value',
    provider: {
      '@type': 'Organization',
      name: 'Auricore',
      url: 'https://auricore.com'
    },
    offers: {
      '@type': 'Offer',
      description: 'Free valuation with no obligation'
    }
  }
};

export default function PricePage() {
  return (
    <>
      {/* SEO JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData)
        }}
      />

      <Header activeTab="borrower" />

      <main className="overflow-hidden pt-16 md:pt-20">
        {/* FREE Pricing Banner */}
        <div className="bg-green-600 text-white py-3 px-4 text-center">
          <div className="max-w-6xl mx-auto flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <p className="font-medium">Our pricing valuation service is 100% FREE with absolutely no obligation</p>
          </div>
        </div>

        <PriceHero />
        
        {/* Quick Option Buttons - Added for even faster access */}
        <div className="bg-white py-6 border-b border-gray-200 sticky top-16 z-20 shadow-sm">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Get Your Free Price Now:</h2>
              </div>
              <div className="flex flex-wrap gap-3">
                <button 
                  onClick={() => window.location.href = '/price/photo'}
                  className="inline-flex items-center justify-center px-5 py-2 border border-transparent text-sm font-medium rounded-full shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-4 w-4 mr-2" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" 
                    />
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" 
                    />
                  </svg>
                  Take a Photo
                </button>
                <button 
                  onClick={() => window.location.href = '/price/manual'}
                  className="inline-flex items-center justify-center px-5 py-2 border border-gray-300 text-sm font-medium rounded-full shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-all"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-4 w-4 mr-2 text-amber-600" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" 
                    />
                  </svg>
                  Enter Details
                </button>
              </div>
            </div>
          </div>
        </div>

        <OptionSelection id="options" />
        <TrustBadges />
        <HowPricingWorks />
        <CTASection 
          title="Ready to Get Your Free Valuation?" 
          subtitle="Choose your preferred method and get an instant valuation for your luxury items. Access up to 70% of your item's value with our sale-leaseback service while keeping your items."
          primaryButtonText="Get Your Free Valuation"
          primaryButtonLink="#options"
          secondaryButtonText="Learn More"
          secondaryButtonLink="/how-it-works"
          showBullets={true}
        />
      </main>

      <Footer />
    </>
  );
}