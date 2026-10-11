// app/lenders/how-it-works/page.tsx
'use client';

import React from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { LenderHowItWorksHero } from '@/components/sections/LenderHowItWorksHero';
import { LenderJourney } from '@/components/sections/LenderJourney';
import { FAQSection } from '@/components/sections/FAQSection';
import { ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';

// JSON-LD for SEO
const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'How Auricore Lending Investment Works',
  description: 'Learn how to invest with Auricore and earn returns from asset-backed lending.',
  step: [
    { '@type': 'HowToStep', name: 'Create Account', text: 'Sign up and complete identity verification to join our investor community.' },
    { '@type': 'HowToStep', name: 'Browse Opportunities', text: 'Explore available investment opportunities categorized by asset type and expected returns.' },
    { '@type': 'HowToStep', name: 'Select Investments', text: 'Choose from a range of verified luxury assets to add to your investment portfolio.' },
    { '@type': 'HowToStep', name: 'Fund Your Account', text: 'Transfer funds to start your investment journey with a minimum of $500.' },
    { '@type': 'HowToStep', name: 'Track Performance', text: 'Monitor your investment returns through our secure dashboard.' },
    { '@type': 'HowToStep', name: 'Receive Distributions', text: 'Earn consistent monthly payments with 8-10% annual returns.' }
  ]
};

// Lender-specific FAQs
const lenderFaqs = [
  {
    question: 'What returns can I expect?',
    answer: 'Our investors earn 8-10% annual returns, distributed monthly. This averages to approximately 0.7% per month, significantly outperforming most traditional investment vehicles.'
  },
  {
    question: 'What is the minimum investment?',
    answer: 'The minimum investment is $500, making our platform accessible to a wide range of investors who want to diversify their portfolio with asset-backed investments.'
  },
  {
    question: 'How are my investments secured?',
    answer: 'Every investment is secured by authenticated luxury assets with GPS tracking and tamper detection through our proprietary smart box technology.'
  },
  {
    question: 'What happens if a borrower defaults?',
    answer: 'When a borrower defaults, you have two options: (1) Choose to acquire the luxury item at up to 70% off its authenticated market value, or (2) Allow us to liquidate the asset and distribute the proceeds to maintain your expected returns. This provides both security and potential upside to your investment.'
  },
  {
    question: 'Can I withdraw my investment early?',
    answer: 'While we encourage minimum commitment periods for stable returns, we offer liquidity options for investors who need early withdrawal, subject to availability and terms.'
  },
  {
    question: 'How are luxury assets valued?',
    answer: 'We use proprietary AI technology combined with human authentication experts to accurately value assets based on current market data, condition, and demand.'
  },
  {
    question: 'Is my investment diversified?',
    answer: 'Yes, your investment is typically spread across multiple assets and borrowers to reduce risk and provide more consistent returns regardless of individual defaults.'
  },
  {
    question: 'Do I get to choose which specific assets back my investment?',
    answer: 'Yes, our platform allows you to browse and select specific luxury assets to back your investment, giving you full transparency and control over your portfolio.'
  }
];

export default function LenderHowItWorksPage() {
  return (
    <>
      {/* SEO JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData)
        }}
      />

      <Header activeTab="lender" />

      <main className="pt-16 md:pt-20">
        <LenderHowItWorksHero />
        <LenderJourney />

        {/* Default Case Section */}
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-3">Default Protection & Opportunities</h2>
              <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto">
                Our unique approach offers both protection and potential upside in default scenarios
              </p>
            </div>
            
            <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
              <div className="grid md:grid-cols-2">
                <div className="p-8 sm:p-10">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6">In the rare case of borrower default:</h3>
                  
                  <div className="space-y-6">
                    <div className="flex">
                      <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-600 mr-4">
                        1
                      </div>
                      <div>
                        <h4 className="text-lg font-medium text-gray-900 mb-1">Option to Acquire</h4>
                        <p className="text-gray-600">Purchase the defaulted luxury asset at up to 70% off its authenticated market value</p>
                      </div>
                    </div>
                    
                    <div className="flex">
                      <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-600 mr-4">
                        2
                      </div>
                      <div>
                        <h4 className="text-lg font-medium text-gray-900 mb-1">Liquidation Distribution</h4>
                        <p className="text-gray-600">Let us liquidate the asset and distribute proceeds to maintain your expected returns</p>
                      </div>
                    </div>
                    
                    <div className="flex">
                      <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-600 mr-4">
                        3
                      </div>
                      <div>
                        <h4 className="text-lg font-medium text-gray-900 mb-1">Protection First</h4>
                        <p className="text-gray-600">Our default rate is less than 10%, and every investment is backed by authenticated, high-value assets</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="relative hidden md:block">
                  <div className="absolute inset-0">
                    <Image 
                      src="/van_cleef_luxury.avif" 
                      alt="Luxury watch"
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-900/40 to-blue-600/10" />
                  </div>
                  <div className="relative h-full flex flex-col justify-center p-8 sm:p-10 text-white">
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                      <h3 className="text-2xl font-semibold mb-2">Potential savings up to 70%</h3>
                      <p className="text-white/90 mb-4">On authenticated luxury assets from defaulted loans</p>
                      <Button 
                        href="/lenders/apply" 
                        variant="primary"
                        className="w-full justify-center"
                      >
                        Start Investing <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <FAQSection 
          title="Lender FAQs"
          subtitle="Get answers to common questions about investing with Auricore"
          tagline="Investment Questions"
          anchorId="lender-faq"
          faqData={lenderFaqs}
        />
        
        {/* CTA Section */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-4">Ready to Start Investing?</h2>
              <p className="text-gray-600 max-w-2xl mx-auto mb-8">
                Join our exclusive community of investors and start earning returns backed by authenticated luxury assets
              </p>
              <Button 
                href="/lenders/apply" 
                variant="primary"
                className="min-w-44"
              >
                Apply Now <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}