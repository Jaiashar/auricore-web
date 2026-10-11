// components/sections/PriceHero.tsx
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export const PriceHero: React.FC = () => {
  return (
    <section className="relative pt-12 pb-16 md:pt-24 md:pb-32 overflow-hidden">
      {/* Background gradient and shape */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-50 to-white z-0"></div>
      <div className="absolute top-0 right-0 w-full md:w-1/2 h-full bg-blue-50 -skew-x-12 transform origin-top-right z-0"></div>
      
      {/* Decorative circles */}
      <div className="absolute top-20 right-10 w-64 h-64 rounded-full bg-blue-100 mix-blend-multiply opacity-70 blur-2xl z-0"></div>
      <div className="absolute -bottom-20 left-0 w-72 h-72 rounded-full bg-blue-100 mix-blend-multiply opacity-60 blur-3xl z-0"></div>
      
      {/* Content container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
          {/* Left content */}
          <div>
            <div className="inline-block px-3 py-1 mb-4 md:mb-6 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
              Free Luxury Item Valuation
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-4 md:mb-6">
              Get an <span className="text-blue-600">Instant Price</span> for Your Luxury Items
            </h1>
            <p className="text-lg text-gray-600 mb-6 md:mb-8 leading-relaxed">
              Receive a free valuation and competitive cash offer for your luxury watches, handbags, jewelry, and more—while keeping your items with you through our sale and leaseback service.
            </p>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <Link 
                href="#options" 
                className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-full shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
              >
                Get Your Free Valuation
              </Link>
              <Link 
                href="/how-it-works" 
                className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-full shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
              >
                How It Works
              </Link>
            </div>
            
            {/* Trust indicators */}
            <div className="mt-8 md:mt-10">
              <div className="flex flex-wrap gap-y-3 gap-x-6 text-sm text-gray-500">
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Free Valuation</span>
                </div>
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Keep Your Items</span>
                </div>
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Up to 70% of Item Value</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right content - Image */}
          <div className="relative mt-6 md:mt-0">
            <div className="aspect-w-4 aspect-h-3 rounded-2xl overflow-hidden shadow-2xl md:translate-x-10">
              {/* This is a placeholder - you should replace with your actual image */}
              <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center">
                {/* Replace this div with your actual image once you have it */}
                <div className="relative w-full h-full">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-blue-500 text-opacity-30 text-sm font-medium">
                      Luxury Item Valuation Image
                    </div>
                  </div>
                  {/* Uncomment this when you have the actual image */}
                  {/* <Image 
                    src="/images/hero/luxury-items.jpg" 
                    alt="Luxury watches, jewelry and handbags arranged elegantly"
                    fill
                    className="object-cover"
                  /> */}
                </div>
              </div>
            </div>
            
            {/* Floating stats card - Updated for sale-leaseback */}
            <div className="absolute -bottom-6 -left-6 md:-left-12 bg-white rounded-xl shadow-xl p-4 w-64">
              <div className="flex items-center space-x-4">
                <div className="rounded-full bg-blue-100 p-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Average Offer</div>
                  <div className="text-xl font-bold text-gray-900">60-70%</div>
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-500">of your item's market value</div>
            </div>
            
            {/* Floating review card */}
            <div className="absolute top-10 -right-6 md:-right-10 bg-white rounded-xl shadow-xl p-4 w-56">
              <div className="flex items-center">
                <div className="flex text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <div className="ml-2 text-sm font-medium text-gray-700">4.9/5</div>
              </div>
              <div className="mt-2 text-xs text-gray-700">"Got cash for my Rolex while still wearing it. Process was seamless."</div>
              <div className="mt-1 text-xs text-gray-500">- Michael T., New York</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};