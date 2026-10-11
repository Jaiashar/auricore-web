// components/sections/CTASection.tsx
import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button';
import Image from 'next/image';
import Link from 'next/link';

interface CTASectionProps {
  title?: string;
  subtitle?: string;
  primaryButtonText?: string;
  primaryButtonLink?: string;
  secondaryButtonText?: string;
  secondaryButtonLink?: string;
  bgColor?: 'white' | 'gray' | 'blue';
  showImage?: boolean;
  showBullets?: boolean;
}

export const CTASection: React.FC<CTASectionProps> = ({
  title = "Ready to Get Started?",
  subtitle = "Apply now and start your journey toward accessing the value of your luxury assets without giving them up.",
  primaryButtonText = "Apply Now",
  primaryButtonLink = "/#quick-price",
  secondaryButtonText,
  secondaryButtonLink,
  bgColor = 'gray',
  showImage = true,
  showBullets = true,
}) => {
  const getBgColorClass = () => {
    switch (bgColor) {
      case 'white': return 'bg-white';
      case 'blue': return 'bg-blue-600';
      case 'gray':
      default: return 'bg-gray-50';
    }
  };

  const getTextColorClass = () => {
    return bgColor === 'blue' ? 'text-white' : 'text-gray-900';
  };

  const getSubtitleColorClass = () => {
    switch (bgColor) {
      case 'blue': return 'text-blue-100';
      default: return 'text-gray-600';
    }
  };

  const getContainerClass = () => {
    return bgColor === 'blue' 
      ? 'bg-blue-700 border-blue-500'
      : 'bg-white border-gray-100';
  };

  return (
    <section className={`py-12 md:py-16 ${getBgColorClass()}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        {bgColor !== 'blue' ? (
          <div className={`${getContainerClass()} rounded-xl shadow-md overflow-hidden border`}>
            <div className="grid md:grid-cols-2">
              <div className="p-6 md:p-10 flex flex-col justify-center">
                <div className="inline-block px-3 py-1 mb-3 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  Free Valuation Service
                </div>
                <h2 className={`text-2xl md:text-3xl font-semibold ${getTextColorClass()} mb-3 md:mb-4`}>{title}</h2>
                <p className={`${getSubtitleColorClass()} mb-6 md:mb-8 max-w-md text-sm md:text-base`}>
                  {subtitle}
                </p>
                {showBullets && (
                  <div className="space-y-3 md:space-y-4 text-sm md:text-base">
                    <div className="flex items-center">
                      <div className="bg-blue-100 rounded-full p-1 mr-3">
                        <ArrowRight className="w-4 h-4 text-blue-600" />
                      </div>
                      <span className="text-gray-700">Free valuation service</span>
                    </div>
                    <div className="flex items-center">
                      <div className="bg-blue-100 rounded-full p-1 mr-3">
                        <ArrowRight className="w-4 h-4 text-blue-600" />
                      </div>
                      <span className="text-gray-700">Keep your items with you</span>
                    </div>
                    <div className="flex items-center">
                      <div className="bg-blue-100 rounded-full p-1 mr-3">
                        <ArrowRight className="w-4 h-4 text-blue-600" />
                      </div>
                      <span className="text-gray-700">Get up to 70% of your item's value</span>
                    </div>
                  </div>
                )}
                <div className="mt-6 md:mt-8 flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                  <Button href={primaryButtonLink} variant="primary">
                    {primaryButtonText} <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  
                  {secondaryButtonText && secondaryButtonLink && (
                    <Button href={secondaryButtonLink} variant="outline">
                      {secondaryButtonText}
                    </Button>
                  )}
                </div>
              </div>
              
              {showImage && (
                <div className="relative hidden md:block">
                  <div className="absolute inset-0">
                    <Image
                      src="/watch_authentication.jpg"
                      alt="Luxury items valuation"
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-blue-900/40" />
                  </div>
                  <div className="relative p-12 flex flex-col justify-center h-full text-white">
                    <div className="bg-white/10 backdrop-blur-sm p-6 rounded-lg">
                      <h3 className="text-2xl font-semibold mb-2">Sale & Leaseback</h3>
                      <p className="text-white/90">
                        Get up to 70% of your item's market value with our sale and leaseback service
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          // Blue version with centered content - simpler design
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-block px-3 py-1 mb-3 bg-blue-500 text-white rounded-full text-sm font-medium">
              Free Luxury Item Valuation
            </div>
            <h2 className={`text-2xl md:text-3xl font-bold ${getTextColorClass()} mb-4`}>{title}</h2>
            <p className={`${getSubtitleColorClass()} mb-8 text-base md:text-lg`}>
              {subtitle}
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-6">
              <Link
                href={primaryButtonLink}
                className="px-6 py-3 rounded-lg font-medium bg-white text-blue-600 hover:bg-blue-50 transition-all shadow-lg text-sm md:text-base"
              >
                {primaryButtonText}
              </Link>
              
              {secondaryButtonText && secondaryButtonLink && (
                <Link
                  href={secondaryButtonLink}
                  className="px-6 py-3 rounded-lg font-medium bg-blue-700 text-white border border-blue-400 hover:bg-blue-800 transition-all text-sm md:text-base"
                >
                  {secondaryButtonText}
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default CTASection;