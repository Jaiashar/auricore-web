// app/components/sections/LenderHowItWorksHero.tsx
import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button';
import Image from 'next/image';

export const LenderHowItWorksHero: React.FC = () => {
  return (
    <section className="pt-4 sm:pt-6 md:pt-8 bg-gradient-to-b from-gray-50 to-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="text-center md:text-left">
            <div className="inline-block px-3 py-1 mb-4 sm:mb-6 bg-blue-100 text-blue-800 rounded-full text-xs sm:text-sm">
              Investment Process
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-gray-900 mb-4 sm:mb-6">
              How <span className="text-blue-600">Lending</span> Works
            </h1>
            <p className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-8 max-w-xl">
              Our lending process is transparent, secure, and designed to help you earn strong, consistent returns backed by valuable assets.
            </p>
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 justify-center md:justify-start">
              <Button href="/lenders/apply" variant="primary">
                Start Investing <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button href="#lender-faq" variant="outline">
                View FAQs
              </Button>
            </div>
          </div>
          
          <div className="relative mt-8 md:mt-0">
            <div className="rounded-lg shadow-xl overflow-hidden relative z-10 transform hover:scale-105 transition-all duration-500">
              <div className="relative aspect-[4/3] w-full">
                <Image
                  src="/asset_backed_security.png"
                  alt="Investment portfolio dashboard"
                  fill
                  className="object-cover object-top"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/30 to-transparent mix-blend-overlay" />
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 bg-gradient-to-t from-gray-900/90 to-transparent">
                <h3 className="text-xl font-bold text-white mb-2">
                  Asset-Backed Security
                </h3>
                <p className="text-white/90 text-sm">
                  Earn 8-10% annual returns with investments secured by authenticated luxury assets
                </p>
              </div>
            </div>
            {/* Decorative backgrounds */}
            <div className="absolute -top-16 -right-16 w-48 sm:w-72 h-48 sm:h-72 bg-blue-200 rounded-full filter blur-3xl opacity-60 z-0" />
            <div className="absolute -bottom-16 -left-16 w-40 sm:w-56 h-40 sm:h-56 bg-indigo-200 rounded-full filter blur-3xl opacity-60 z-0" />
          </div>
        </div>
      </div>
    </section>
  );
};