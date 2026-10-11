// app/components/sections/BorrowerJourney.tsx
import React, { useState } from 'react';
import { Camera, Shield, Package, Check, DollarSign, Home, RefreshCw } from 'lucide-react';

interface BorrowerStep {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  details: string[];
}

export const BorrowerJourney: React.FC = () => {
  const [activeStep, setActiveStep] = useState(1);

  // Steps data
  const borrowerSteps: BorrowerStep[] = [
    {
      id: 1,
      title: 'Apply Online',
      description: 'Upload photos and details of your luxury items. Our AI instantly estimates their value.',
      icon: <Camera className="w-8 h-8 text-blue-600" />,
      details: [
        'Take clear photos from multiple angles',
        'Provide any authentication papers',
        'Complete a simple form',
        'Get an initial valuation within minutes'
      ]
    },
    {
      id: 2,
      title: 'Credit Check',
      description: 'We perform a soft credit check to ensure you meet our baseline requirements.',
      icon: <Shield className="w-8 h-8 text-blue-600" />,
      details: [
        'Soft check—no score impact',
        'Baseline security requirements',
        'Score does not affect your rate',
        'Completed in minutes'
      ]
    },
    {
      id: 3,
      title: 'Authentication & Smart Box',
      description: 'We send an authenticator with our smart box to complete your onboarding in just one day.',
      icon: <Package className="w-8 h-8 text-blue-600" />,
      details: [
        'In-person item authentication',
        'Smart box setup',
        'GPS tracking activation',
        'One-day onboarding'
      ]
    },
    {
      id: 4,
      title: 'Sign Agreements',
      description: 'After reviewing terms, sign our 3-part agreement: Sale, Lease, and Option to Reacquire.',
      icon: <Check className="w-8 h-8 text-blue-600" />,
      details: [
        'Bill of Sale',
        'Lease Agreement',
        'Option to Reacquire',
        'Secure e-signatures'
      ]
    },
    {
      id: 5,
      title: 'Get Funded',
      description: 'Receive funds directly to your bank account as soon as you sign the agreements.',
      icon: <DollarSign className="w-8 h-8 text-blue-600" />,
      details: [
        'Up to 70% of item value',
        'ACH or wire transfer',
        '3% processing fee',
        '1–2 days to complete'
      ]
    },
    {
      id: 6,
      title: 'Use & Maintain',
      description: 'Keep your item at home with simple monthly check-ins.',
      icon: <Home className="w-8 h-8 text-blue-600" />,
      details: [
        'Item stays in smart box',
        'Monthly NFC check-ins',
        'Extra checks if moved',
        'Lowest industry rates'
      ]
    },
    {
      id: 7,
      title: 'Lease Options',
      description: 'Enjoy flexibility at the end of your lease term.',
      icon: <RefreshCw className="w-8 h-8 text-blue-600" />,
      details: [
        'Repurchase any time',
        'Extend lease',
        'Break lease early',
        'No credit impact on return'
      ]
    }
  ];

  return (
    <section id="process" className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-3">The Borrower's Journey</h2>
          <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto">
            Our streamlined process is designed to get you the liquidity you need quickly and securely
          </p>
        </div>
        
        {/* Desktop Steps Nav */}
        <div className="hidden md:block relative mb-12">
          <div className="absolute inset-x-0 top-14 h-1 bg-gray-200"></div>
          <div className="grid grid-cols-7 gap-6">
            {borrowerSteps.map((step) => (
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
            {borrowerSteps.map((step) => (
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
          {borrowerSteps.map((step) =>
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
              onClick={() => setActiveStep((s) => Math.min(s + 1, borrowerSteps.length))}
              disabled={activeStep === borrowerSteps.length}
              className={`px-4 py-2 rounded-lg transition-all ${
                activeStep < borrowerSteps.length
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