// components/sections/QuickPriceOptions.tsx
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Camera, Edit, Tag, Clock, ArrowRight } from 'lucide-react';

export const QuickPriceOptions: React.FC = () => {
  const router = useRouter();

  const handleOptionClick = (option: 'photo' | 'manual') => {
    if (option === 'photo') {
      router.push('/price/photo');
    } else {
      router.push('/price/manual');
    }
  };

  return (
    <section className="py-12 bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">Choose Your Pricing Method</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Get your FREE instant price now. Our valuation is completely free with no obligation.
          </p>
        </div>

        {/* Direct access options */}
        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {/* Photo Option */}
          <div 
            onClick={() => handleOptionClick('photo')}
            className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all overflow-hidden border border-gray-200 hover:border-blue-300 cursor-pointer relative group"
          >
            <div className="absolute top-4 right-4 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              FREE
            </div>
            <div className="h-44 bg-blue-50 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-blue-400/10" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Camera className="h-16 w-16 text-blue-400 group-hover:scale-110 transition-transform" />
              </div>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2 flex items-center">
                <span>Take a Photo</span>
                <span className="ml-2 text-xs font-normal text-gray-500">(Fastest Method)</span>
              </h3>
              <p className="text-gray-600 mb-4">
                Simply snap a photo of your luxury item for an instant AI-powered valuation.
              </p>
              <div className="flex flex-wrap gap-3 mb-4">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Instant Results
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  No Obligation
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  Most Popular
                </span>
              </div>
              <div className="flex items-center text-blue-600 font-medium">
                <span>Start Now</span>
                <ArrowRight className="ml-2 h-4 w-4" />
              </div>
            </div>
          </div>

          {/* Manual Entry Option */}
          <div 
            onClick={() => handleOptionClick('manual')}
            className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all overflow-hidden border border-gray-200 hover:border-amber-300 cursor-pointer relative group"
          >
            <div className="absolute top-4 right-4 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              FREE
            </div>
            <div className="h-44 bg-amber-50 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-amber-300/10" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Edit className="h-16 w-16 text-amber-400 group-hover:scale-110 transition-transform" />
              </div>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2 flex items-center">
                <span>Enter Details</span>
                <span className="ml-2 text-xs font-normal text-gray-500">(Most Accurate)</span>
              </h3>
              <p className="text-gray-600 mb-4">
                Describe your luxury item for a precise valuation and sale-leaseback offer.
              </p>
              <div className="flex flex-wrap gap-3 mb-4">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                  Detailed
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  No Obligation
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                  High Precision
                </span>
              </div>
              <div className="flex items-center text-amber-600 font-medium">
                <span>Start Now</span>
                <ArrowRight className="ml-2 h-4 w-4" />
              </div>
            </div>
          </div>
        </div>

        {/* Sales points */}
        <div className="mt-12 max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg flex flex-col items-center text-center">
              <Tag className="h-8 w-8 text-blue-500 mb-2" />
              <h4 className="font-medium text-gray-900 text-sm mb-1">Free Service</h4>
              <p className="text-xs text-gray-600">100% free valuation, no hidden fees</p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg flex flex-col items-center text-center">
              <Camera className="h-8 w-8 text-green-500 mb-2" />
              <h4 className="font-medium text-gray-900 text-sm mb-1">Keep Your Item</h4>
              <p className="text-xs text-gray-600">Access value while retaining possession</p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg flex flex-col items-center text-center">
              <Clock className="h-8 w-8 text-purple-500 mb-2" />
              <h4 className="font-medium text-gray-900 text-sm mb-1">Instant Results</h4>
              <p className="text-xs text-gray-600">Get your valuation in seconds</p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg flex flex-col items-center text-center">
              <ArrowRight className="h-8 w-8 text-amber-500 mb-2" />
              <h4 className="font-medium text-gray-900 text-sm mb-1">Up to 70% Value</h4>
              <p className="text-xs text-gray-600">Get up to 70% of authenticated value</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default QuickPriceOptions;