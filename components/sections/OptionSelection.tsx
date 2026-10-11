// components/sections/OptionSelection.tsx
'use client'

import React from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface OptionSelectionProps {
  id?: string;
}

export const OptionSelection: React.FC<OptionSelectionProps> = ({ id }) => {
  const router = useRouter();

  const handleOptionClick = (option: 'photo' | 'manual') => {
    if (option === 'photo') {
      router.push('/price/photo');
    } else {
      router.push('/price/manual');
    }
  };

  return (
    <section id={id} className="py-12 md:py-16 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 md:mb-12">
          <div className="inline-block px-3 py-1 mb-3 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
            Free Valuation Service
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">Choose Your Preferred Method</h2>
          <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto">
            Get a free instant valuation for your luxury item. We offer a sale and leaseback service for up to 70% of your item's value — keep using your items while accessing their cash value.
          </p>
        </div>

        <div className="flex flex-col md:grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Photo Option - Improved for mobile */}
          <div 
            onClick={() => handleOptionClick('photo')}
            className="bg-white rounded-xl shadow-lg overflow-hidden transition-all hover:shadow-xl cursor-pointer border border-gray-200 hover:border-blue-300 flex flex-col h-full"
          >
            <div className="h-36 md:h-48 bg-blue-100 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-20">
                <div className="relative w-full h-full">
                  <Image 
                    src="/images/pricing/camera-background.jpg"
                    alt="Camera background"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 400px"
                  />
                </div>
              </div>
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-blue-500 flex items-center justify-center relative z-10">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-10 w-10 md:h-12 md:w-12 text-white" 
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
              </div>
            </div>
            <div className="p-5 md:p-6 flex-grow flex flex-col">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Take a Photo</h3>
              <p className="text-gray-600 mb-4 text-sm md:text-base">
                Simply capture a photo of your item for an instant AI-powered price estimation and leaseback offer.
              </p>
              <div className="flex items-center text-blue-600 font-medium mt-auto">
                <span>Get started</span>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-5 w-5 ml-2" 
                  viewBox="0 0 20 20" 
                  fill="currentColor"
                >
                  <path 
                    fillRule="evenodd" 
                    d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" 
                    clipRule="evenodd" 
                  />
                </svg>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Fast
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Free
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  Instant
                </span>
              </div>
            </div>
          </div>

          {/* Manual Entry Option - Improved for mobile */}
          <div 
            onClick={() => handleOptionClick('manual')}
            className="bg-white rounded-xl shadow-lg overflow-hidden transition-all hover:shadow-xl cursor-pointer border border-gray-200 hover:border-amber-300 flex flex-col h-full"
          >
            <div className="h-36 md:h-48 bg-amber-50 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-20">
                <div className="relative w-full h-full">
                  <Image 
                    src="/images/pricing/form-background.jpg"
                    alt="Form background"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 400px"
                  />
                </div>
              </div>
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-amber-500 flex items-center justify-center relative z-10">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-10 w-10 md:h-12 md:w-12 text-white" 
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
              </div>
            </div>
            <div className="p-5 md:p-6 flex-grow flex flex-col">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Enter Item Details</h3>
              <p className="text-gray-600 mb-4 text-sm md:text-base">
                Fill in specific details about your luxury item for a precise valuation and sale-leaseback offer.
              </p>
              <div className="flex items-center text-amber-600 font-medium mt-auto">
                <span>Get started</span>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-5 w-5 ml-2" 
                  viewBox="0 0 20 20" 
                  fill="currentColor"
                >
                  <path 
                    fillRule="evenodd" 
                    d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" 
                    clipRule="evenodd" 
                  />
                </svg>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                  Detailed
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Free
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                  Accurate
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Additional benefits section - Improved messaging */}
        <div className="mt-12 md:mt-16 bg-white rounded-xl shadow-sm border border-gray-200 p-5 md:p-6">
          <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-4 md:mb-6 text-center">
            Benefits of Our Sale-Leaseback Service
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 md:w-14 md:h-14 bg-blue-100 rounded-full flex items-center justify-center mb-3 md:mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:h-7 md:w-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="font-medium text-gray-900 mb-1 md:mb-2 text-sm md:text-base">Free Valuation</h4>
              <p className="text-xs md:text-sm text-gray-600">
                Instant, no-obligation pricing
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 md:w-14 md:h-14 bg-green-100 rounded-full flex items-center justify-center mb-3 md:mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:h-7 md:w-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="font-medium text-gray-900 mb-1 md:mb-2 text-sm md:text-base">Keep Your Item</h4>
              <p className="text-xs md:text-sm text-gray-600">
                Continue using while accessing value
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 md:w-14 md:h-14 bg-purple-100 rounded-full flex items-center justify-center mb-3 md:mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:h-7 md:w-7 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h4 className="font-medium text-gray-900 mb-1 md:mb-2 text-sm md:text-base">Market Value</h4>
              <p className="text-xs md:text-sm text-gray-600">
                Up to 70% of authenticated value
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 md:w-14 md:h-14 bg-amber-100 rounded-full flex items-center justify-center mb-3 md:mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:h-7 md:w-7 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h4 className="font-medium text-gray-900 mb-1 md:mb-2 text-sm md:text-base">Fast Funding</h4>
              <p className="text-xs md:text-sm text-gray-600">
                Get cash as soon as 24 hours
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default OptionSelection;