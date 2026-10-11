// app/components/sections/SecurityFeatures.tsx
import React from 'react';
import Image from 'next/image';
import { Lock, Shield, Home } from 'lucide-react';

interface SecurityFeature {
  title: string;
  description: string;
  icon: React.ReactNode;
}

export const SecurityFeatures: React.FC = () => {
  const features: SecurityFeature[] = [
    {
      title: 'GPS-Tracked Smart Box',
      description: 'Alerts us if moved or tampered with via GPS and tamper circuits.',
      icon: <Lock className="w-6 h-6 text-blue-600" />
    },
    {
      title: 'NFC Check-Ins',
      description: 'Quick monthly check-ins via your phone for continuous security.',
      icon: <Shield className="w-6 h-6 text-blue-600" />
    },
    {
      title: 'Geofencing Technology',
      description: 'Ensures your item stays in your approved location.',
      icon: <Home className="w-6 h-6 text-blue-600" />
    }
  ];

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-block px-3 py-1 mb-4 bg-blue-100 text-blue-800 rounded-full text-xs sm:text-sm">
              Advanced Security
            </div>
            <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-6">Security That Sets Us Apart</h2>
            <p className="text-gray-600 mb-8">
              Our smart box technology and security protocols provide peace of mind for both you and our lenders.
            </p>
            <div className="space-y-6">
              {features.map((feature, idx) => (
                <div key={idx} className="flex items-start">
                  <div className="bg-blue-100 p-3 rounded-2xl mr-4">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 mb-1">{feature.title}</h3>
                    <p className="text-gray-600">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="relative mt-8 md:mt-0">
            <div className="bg-white p-8 rounded-xl shadow-md border border-gray-100 relative z-10 transform hover:scale-105 transition-all duration-500">
              <div className="relative aspect-square w-full overflow-hidden rounded-lg">
                <Image
                  src="/secure_box_new.png"
                  alt="Smart Box with GPS Technology"
                  fill
                  className="object-contain"
                />
              </div>
              <div className="text-center mt-4">
                <h3 className="text-lg font-semibold text-gray-900">Smart Box Technology</h3>
                <p className="text-sm text-gray-600">Advanced security features protect your valuable items</p>
              </div>
            </div>
            {/* Decorative backgrounds */}
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-200 rounded-full filter blur-3xl opacity-50 z-0" />
          </div>
        </div>
      </div>
    </section>
  );
};