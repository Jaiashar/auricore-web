// app/components/sections/LenderBenefitsSection.tsx
import React from 'react';
import { DollarSign, Shield, Lock } from 'lucide-react';

export const LenderBenefitsSection: React.FC = () => {
  // Benefits data
  const lenderBenefits = [
    {
      title: "8-10% Annual Returns",
      description: "Earn industry-leading returns that outperform most traditional investments",
      icon: <DollarSign className="h-10 w-10 text-blue-600" />
    },
    {
      title: "Asset-Backed Security",
      description: "Every investment is secured by authenticated luxury assets with GPS tracking",
      icon: <Shield className="h-10 w-10 text-blue-600" />
    },
    {
      title: "Low Risk Investment",
      description: "Our advanced valuation tech and default protection minimize your exposure",
      icon: <Lock className="h-10 w-10 text-blue-600" />
    }
  ];

  return (
    <section className="py-16 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-semibold text-gray-900 mb-4">Apply to Become an Auricore Lender</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Join our exclusive community of investors and start earning returns backed by authenticated luxury assets
          </p>
        </div>
        
        {/* Benefits Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {lenderBenefits.map((benefit, idx) => (
            <div key={idx} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all flex flex-col items-center text-center">
              <div className="bg-blue-50 p-4 rounded-full mb-4">
                {benefit.icon}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{benefit.title}</h3>
              <p className="text-gray-800">{benefit.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};