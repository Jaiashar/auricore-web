// components/sections/TrustBadges.tsx
import React from 'react';
import Image from 'next/image';

export const TrustBadges: React.FC = () => {
  // Premium brand logos
  const brandLogos = [
    { name: 'Rolex', path: '/rolex_logo.png' },
    { name: 'Louis Vuitton', path: '/lv_logo.png' },
    { name: 'Hermes', path: '/hermes_logo.png' },
    { name: 'Cartier', path: '/cartier_logo.png' },
    { name: 'Jordan', path: '/jordan_logo.png' },
  ];

  // Marketplace logos
  const marketplaceLogos = [
    { name: 'StockX', path: '/stockx_logo.png' },
    { name: 'GOAT', path: '/goat_logo.png' },
    { name: 'The RealReal', path: '/therealreal_logo.png' },
    { name: 'Fashionphile', path: '/fashionpile_logo.png' },
    { name: 'Chrono24', path: '/chrono24_logo.png' },
  ];

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
            Trusted Pricing Sources
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Our valuations are based on real-time data from verified luxury marketplaces and official brand sources.
          </p>
        </div>

        <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100 shadow-sm">
          {/* Trust indicators */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {/* Verified data */}
            <div className="flex items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Verified Market Data</h3>
                <p className="text-sm text-gray-600">Pricing based on real transactions</p>
              </div>
            </div>
            
            {/* Real-time */}
            <div className="flex items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Real-Time Pricing</h3>
                <p className="text-sm text-gray-600">Up-to-date market valuations</p>
              </div>
            </div>
            
            {/* Authenticated */}
            <div className="flex items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Authentication Expertise</h3>
                <p className="text-sm text-gray-600">Verified by industry specialists</p>
              </div>
            </div>
          </div>

          {/* Brand logos */}
          <div className="mb-10">
            <h3 className="text-sm uppercase tracking-wider text-gray-500 text-center mb-6">Premium Brands We Value</h3>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-6 items-center justify-items-center">
              {brandLogos.map((logo, index) => (
                <div key={index} className="h-12 flex items-center">
                  <div className="relative w-24 h-12">
                    <Image 
                      src={logo.path} 
                      alt={`${logo.name} logo`}
                      fill
                      className="object-contain"
                      sizes="(max-width: 768px) 80px, 120px"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Marketplace logos */}
          <div>
            <h3 className="text-sm uppercase tracking-wider text-gray-500 text-center mb-6">Verified Marketplace Data</h3>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-6 items-center justify-items-center">
              {marketplaceLogos.map((logo, index) => (
                <div key={index} className="h-12 flex items-center">
                  <div className="relative w-24 h-12">
                    <Image 
                      src={logo.path} 
                      alt={`${logo.name} logo`}
                      fill
                      className="object-contain"
                      sizes="(max-width: 768px) 80px, 120px"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Security badge */}
          <div className="mt-10 pt-10 border-t border-gray-200">
            <div className="flex flex-col md:flex-row items-center justify-center text-center md:text-left md:justify-start">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mr-0 md:mr-6 mb-4 md:mb-0 flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Bank-Level Security & Data Protection</h3>
                <p className="text-gray-600">
                  Your information is protected with enterprise-grade encryption. We never sell your data and maintain strict privacy controls.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustBadges;