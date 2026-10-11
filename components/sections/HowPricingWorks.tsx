// components/sections/HowPricingWorks.tsx
import React from 'react';
import Image from 'next/image';

export const HowPricingWorks: React.FC = () => {
  const steps = [
    {
      id: 1,
      title: 'Submit Your Item',
      description: 'Take a photo or enter details about your luxury item. Our system will identify and categorize it instantly.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      iconBg: 'bg-blue-600'
    },
    {
      id: 2,
      title: 'AI Analysis',
      description: 'Our advanced AI analyzes your item against thousands of real-time market data points from verified sources.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      iconBg: 'bg-amber-500'
    },
    {
      id: 3,
      title: 'Receive Valuation',
      description: 'Get a detailed valuation breakdown showing your item\'s current market value based on condition and authenticity factors.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
        </svg>
      ),
      iconBg: 'bg-green-600'
    },
    {
      id: 4,
      title: 'Get Your Offer',
      description: 'View your instant cash offer with multiple liquidity options while keeping your item in your possession.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      iconBg: 'bg-purple-600'
    }
  ];

  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-white to-gray-50 overflow-hidden relative">
      {/* Decorative elements */}
      <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-gray-50 to-white"></div>
      <div className="absolute -left-40 -bottom-40 w-80 h-80 rounded-full bg-blue-50 opacity-70"></div>
      <div className="absolute right-0 top-1/4 w-60 h-60 rounded-full bg-amber-50 opacity-70"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">How The Pricing Works</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Our transparent valuation process uses real-time market data to ensure you get the most accurate and competitive offers.
          </p>
        </div>

        <div className="relative">
          {/* Connecting line for desktop */}
          <div className="hidden lg:block absolute top-24 left-0 right-0 h-1 bg-gray-200 z-0"></div>
          
          {/* Steps */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
            {steps.map((step, index) => (
              <div key={step.id} className="relative">
                {/* Step Number */}
                <div className="flex flex-col items-center">
                  {/* Circle with number - positioned on the line for desktop */}
                  <div className="w-12 h-12 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center mb-4 z-10 lg:mb-8">
                    <span className="text-xl font-bold text-gray-900">{step.id}</span>
                  </div>
                  
                  {/* Icon */}
                  <div className={`w-16 h-16 rounded-full ${step.iconBg} flex items-center justify-center mb-6 shadow-lg`}>
                    {step.icon}
                  </div>
                  
                  {/* Content */}
                  <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">{step.title}</h3>
                  <p className="text-gray-600 text-center leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Additional Information Card */}
        <div className="mt-20 bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">The Auricore Advantage</h3>
              <p className="text-gray-600 mb-6">
                Unlike traditional pawnshops or consignment stores, our valuations are based on sophisticated data analysis from hundreds of verified sources.
              </p>
              
              <ul className="space-y-4">
                <li className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-gray-700">Up to 4x higher valuations than traditional pawnshops</span>
                </li>
                <li className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-gray-700">Keep your items with you during the entire term</span>
                </li>
                <li className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-gray-700">Flexible terms with no hidden fees or penalties</span>
                </li>
                <li className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-gray-700">Instant offers with same-day funding available</span>
                </li>
              </ul>
            </div>
            
            <div className="relative h-64 md:h-full">
              {/* This is a placeholder for your actual image */}
              <div className="absolute inset-0 bg-gradient-to-tr from-gray-100 to-blue-50 rounded-xl flex items-center justify-center">
                <div className="text-blue-500 text-opacity-30 text-sm font-medium">
                  AI Pricing Visualization
                </div>
                {/* Uncomment and use your actual image */}
                {/* <Image 
                  src="/images/pricing-comparison.jpg" 
                  alt="Auricore pricing comparison chart showing higher valuation"
                  fill
                  className="object-cover rounded-xl"
                /> */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowPricingWorks;