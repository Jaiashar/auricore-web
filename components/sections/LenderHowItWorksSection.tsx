// app/components/sections/LenderHowItWorksSection.tsx
import React from 'react';
import { ArrowRight, Clock, DollarSign, Shield } from 'lucide-react';
import { Button } from '../ui/Button';

export const LenderHowItWorksSection: React.FC = () => {
  return (
    <section className="py-16 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-semibold text-gray-900 mb-4">How It Works for Lenders</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            This page will contain detailed information about how the lending process works.
          </p>
        </div>
        
        {/* Placeholder content */}
        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 mb-10">
          <div className="text-center">
            <p className="text-gray-600 mb-6">
              This section is currently under development. We're working to provide you with comprehensive information about our lending process, investment opportunities, and the technology that secures your investments.
            </p>
            <div className="inline-flex flex-wrap justify-center gap-4 mb-8">
              <div className="flex items-center bg-blue-50 px-4 py-2 rounded-full">
                <Shield className="h-5 w-5 text-blue-600 mr-2" />
                <span className="text-sm text-gray-700">Asset-Backed Security</span>
              </div>
              <div className="flex items-center bg-blue-50 px-4 py-2 rounded-full">
                <DollarSign className="h-5 w-5 text-blue-600 mr-2" />
                <span className="text-sm text-gray-700">8-10% Returns</span>
              </div>
              <div className="flex items-center bg-blue-50 px-4 py-2 rounded-full">
                <Clock className="h-5 w-5 text-blue-600 mr-2" />
                <span className="text-sm text-gray-700">Monthly Distributions</span>
              </div>
            </div>
            <Button
              href="/lenders/apply"
              variant="primary"
              className="mx-auto"
            >
              Apply to Become a Lender <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};