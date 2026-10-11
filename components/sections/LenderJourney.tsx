// app/components/sections/LenderJourney.tsx
import React, { useState } from 'react';
import { UserPlus, Search, DollarSign, BarChart4, Lock, FileCheck, Coins } from 'lucide-react';
import { Check } from 'lucide-react';

interface LenderStep {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  details: string[];
}

export const LenderJourney: React.FC = () => {
  const [activeStep, setActiveStep] = useState(1);

  // Steps data
  const lenderSteps: LenderStep[] = [
    {
      id: 1,
      title: 'Create Account',
      description: 'Sign up and complete our identity verification process to join our exclusive investor community.',
      icon: <UserPlus className="w-8 h-8 text-blue-600" />,
      details: [
        'Simple 2-minute sign-up process',
        'Secure identity verification',
        'KYC/AML compliance',
        'Password-protected dashboard'
      ]
    },
    {
      id: 2,
      title: 'Browse Opportunities',
      description: 'Explore our curated investment opportunities, categorized by asset type, value, and expected returns.',
      icon: <Search className="w-8 h-8 text-blue-600" />,
      details: [
        'Filter by asset type',
        'Sort by expected returns',
        'View detailed asset descriptions',
        'Access authentication reports'
      ]
    },
    {
      id: 3,
      title: 'Select Investments',
      description: 'Choose from our range of authenticated luxury assets to build your diversified investment portfolio.',
      icon: <FileCheck className="w-8 h-8 text-blue-600" />,
      details: [
        'Minimum $500 investment',
        'Multiple asset categories',
        'Detailed risk assessments',
        'Transparent fee structure'
      ]
    },
    {
      id: 4,
      title: 'Fund Your Account',
      description: 'Transfer funds securely to begin your investment journey with Auricore.',
      icon: <DollarSign className="w-8 h-8 text-blue-600" />,
      details: [
        'ACH or wire transfer options',
        'Instant confirmation',
        'No hidden fees',
        'Secure transaction processing'
      ]
    },
    {
      id: 5,
      title: 'Track Performance',
      description: 'Monitor your investment performance through our comprehensive dashboard.',
      icon: <BarChart4 className="w-8 h-8 text-blue-600" />,
      details: [
        'Real-time portfolio valuation',
        'Asset status monitoring',
        'Performance analytics',
        'Investment history'
      ]
    },
    {
      id: 6,
      title: 'Security Measures',
      description: 'Rest easy knowing your investments are protected by our multi-layered security system.',
      icon: <Lock className="w-8 h-8 text-blue-600" />,
      details: [
        'Smart box technology',
        'GPS and tamper detection',
        'Authenticated assets',
        'Default protection with acquisition options'
      ]
    },
    {
      id: 7,
      title: 'Receive Returns',
      description: 'Enjoy consistent monthly distributions with competitive annual returns.',
      icon: <Coins className="w-8 h-8 text-blue-600" />,
      details: [
        '8-10% annual returns',
        'Monthly distributions',
        'Automatic or manual reinvestment',
        'Flexible withdrawal options'
      ]
    }
  ];

  return (
    <section id="lender-process" className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-3">The Lender's Journey</h2>
          <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto">
            Our streamlined investment process is designed to provide you with secure, consistent returns
          </p>
        </div>
        
        {/* Desktop Steps Nav */}
        <div className="hidden md:block relative mb-12">
          <div className="absolute inset-x-0 top-14 h-1 bg-gray-200"></div>
          <div className="grid grid-cols-7 gap-6">
            {lenderSteps.map((step) => (
              <div key={step.id} className="relative" onClick={() => setActiveStep(step.id)}>
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 mx-auto z-10 relative border-4 border-white transition-all duration-300 cursor-pointer ${
                    activeStep === step.id ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
                  } hover:bg-blue-500 hover:text-white`}
                >
                  {step.id}
                </div>
                <h3
                  className={`text-sm font-medium text-center ${
                    activeStep === step.id ? 'text-blue-600' : 'text-gray-600'
                  }`}
                >
                  {step.title}
                </h3>
              </div>
            ))}
          </div>
        </div>
        
        {/* Mobile Steps Nav */}
        <div className="md:hidden overflow-x-auto pb-4 mb-6">
          <div className="flex space-x-4 px-2 min-w-max">
            {lenderSteps.map((step) => (
              <button
                key={step.id}
                onClick={() => setActiveStep(step.id)}
                className={`px-5 py-2 rounded-full text-sm whitespace-nowrap transition-all ${
                  activeStep === step.id
                    ? 'bg-blue-600 text-white font-medium shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {step.id}. {step.title}
              </button>
            ))}
          </div>
        </div>
        
        {/* Step Details */}
        <div className="bg-white p-6 sm:p-8 rounded-xl shadow-md border border-gray-100">
          {lenderSteps.map((step) =>
            activeStep === step.id ? (
              <div key={step.id} className="flex flex-col md:flex-row gap-8">
                <div className="md:w-64 flex flex-col items-center md:items-start">
                  <div className="bg-blue-50 p-4 rounded-2xl mb-4">{step.icon}</div>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-2">{step.title}</h3>
                </div>
                <div className="flex-1">
                  <p className="text-lg text-gray-600 mb-6">{step.description}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {step.details.map((d, i) => (
                      <div key={i} className="flex items-start">
                        <div className="bg-blue-50 p-1 rounded-full mr-3 mt-1">
                          <Check className="w-4 h-4 text-blue-600" />
                        </div>
                        <span className="text-gray-700">{d}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null
          )}
          <div className="flex justify-between mt-8">
            <button
              onClick={() => setActiveStep((s) => Math.max(s - 1, 1))}
              disabled={activeStep === 1}
              className={`px-4 py-2 rounded-lg transition-all ${
                activeStep > 1 ? 'bg-gray-100 hover:bg-gray-200 text-gray-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              Previous
            </button>
            <button
              onClick={() => setActiveStep((s) => Math.min(s + 1, lenderSteps.length))}
              disabled={activeStep === lenderSteps.length}
              className={`px-4 py-2 rounded-lg transition-all ${
                activeStep < lenderSteps.length
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-blue-300 text-white cursor-not-allowed'
              }`}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};