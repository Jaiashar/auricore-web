// app/components/sections/FeatureSections.tsx
import React from 'react';
import Image from 'next/image';
import { ArrowRight, Shield, DollarSign, Lock, Clock, Camera, Watch, ShoppingBag, Gem, Package, Coins } from 'lucide-react';
import { Button } from '../ui/Button';

// Enhanced Hero Section
export const EnhancedHeroSection: React.FC<{ activeTab: 'borrower' | 'lender' }> = ({ activeTab }) => (
    <section className="pb-12 md:pb-24 bg-gradient-to-b from-gray-50 to-white">
     <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 grid md:grid-cols-2 gap-8 items-center">
      <div>
        <div className="inline-block px-3 py-1 mb-4 sm:mb-6 bg-blue-100 text-blue-800 rounded-full text-xs sm:text-sm">
          {activeTab === 'borrower' ? 'Asset-Backed Liquidity' : 'P2P Lending Platform'}
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-gray-900 mb-4 sm:mb-6">
          {activeTab === 'borrower'
            ? (
              <>
                The future of<br className="hidden sm:block" />
                <span className="text-blue-600"> asset-backed liquidity</span>
              </>
            )
            : (
              <>
                Made for the<br className="hidden sm:block" />
                <span className="text-blue-600"> peer lending community</span>
              </>
            )}
        </h1>
        <p className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-8 max-w-lg">
          {activeTab === 'borrower'
            ? 'Get immediate cash by selling your luxury items and leasing them back. Our smart box technology ensures you keep your items while accessing their value.'
            : 'Join our community of lenders and earn industry-leading 8-10% annual returns with the security of asset-backed investments.'}
        </p>
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
          <Button
            href={activeTab === 'borrower' ? '#quick-price' : '/lenders/apply'}
            variant="primary"
          >
            {activeTab === 'borrower' ? 'Get a Free Price' : 'Start Investing'}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          {/* Show How It Works button for both borrowers and lenders */}
          <Button 
            href={activeTab === 'borrower' ? '/how-it-works' : '/lenders/how-it-works'} 
            variant="outline"
          >
            How It Works
          </Button>
        </div>
        <div className="mt-8 sm:mt-12 flex flex-wrap items-center gap-4 sm:gap-8">
          <div className="flex items-center">
            <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 mr-2" />
            <span className="text-xs sm:text-sm text-gray-600">Bank-Level Security</span>
          </div>
          <div className="flex items-center">
            <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 mr-2" />
            <span className="text-xs sm:text-sm text-gray-600">Funding in 24hrs</span>
          </div>
          {activeTab === 'borrower' ? (
            <div className="flex items-center">
              <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 mr-2" />
              <span className="text-xs sm:text-sm text-gray-600">Lowest rates guaranteed</span>
              </div>
          ) : (
            <div className="flex items-center">
              <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 mr-2" />
              <span className="text-xs sm:text-sm text-gray-600">8-10% Annual Returns</span>
            </div>
          )}
        </div>
      </div>
  
      <div className="relative">
        <div className="rounded-lg shadow-xl overflow-hidden relative z-10 transform hover:scale-105 transition-all duration-500">
          <div className="relative aspect-[4/3] w-full">
            <Image
              src={
                activeTab === 'borrower'
                  ? '/luxury_watch_smart_tech.jpg'
                  : '/person_smiling.jpg'
              }
              alt={
                activeTab === 'borrower'
                  ? 'Luxury watch with smart technology'
                  : 'Person investing on laptop'
              }
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/30 to-transparent mix-blend-overlay" />
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 bg-gradient-to-t from-gray-900/90 to-transparent">
            <h3 className="text-xl font-bold text-white mb-2">
            {activeTab === 'borrower' ? 'Get Cash Without Giving Up Your Items' : 'Secure, Smart Investing'}
            </h3>
            <p className="text-white/90 text-sm">
            {activeTab === 'borrower'
            ? 'Cash for your luxury items with the lowest rates guaranteed'
            : 'Earn consistent returns backed by high-value assets'}
            </p>
          </div>
        </div>
        {/* Decorative backgrounds */}
        <div className="absolute -top-16 -right-16 w-48 sm:w-72 h-48 sm:h-72 bg-blue-200 rounded-full filter blur-3xl opacity-60 z-0" />
        <div className="absolute -bottom-16 -left-16 w-40 sm:w-56 h-40 sm:h-56 bg-indigo-200 rounded-full filter blur-3xl opacity-60 z-0" />
      </div>
    </div>
  </section>
  );

// Enhanced Assets Section
export const EnhancedAssetsSection: React.FC = () => {
  const assetCategories = [
    {
      name: 'Luxury Watches',
      image: '/luxury_watch_image.webp',
      icon: <Watch className="h-6 w-6 text-blue-500" />,
      bgColor: 'from-blue-600 to-blue-400'
    },
    {
      name: 'Designer Handbags',
      image: '/luxury_bag_image.webp',
      icon: <ShoppingBag className="h-6 w-6 text-pink-500" />,
      bgColor: 'from-pink-500 to-pink-300'
    },
    {
      name: 'Fine Jewelry',
      image: '/luxury_jewelry_image.avif',
      icon: <Gem className="h-6 w-6 text-yellow-500" />,
      bgColor: 'from-yellow-500 to-yellow-300'
    },
    {
      name: 'Collectible Sneakers',
      image: '/luxury_sneakers.jpg',
      icon: <Package className="h-6 w-6 text-gray-700" />,
      bgColor: 'from-gray-700 to-gray-500'
    },
    {
      name: 'Precious Metals',
      image: '/precious_metals_image.jpg',
      icon: <Coins className="h-6 w-6 text-yellow-600" />,
      bgColor: 'from-yellow-600 to-yellow-400'
    }
  ];

  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 text-center">
        <h2 className="text-2xl font-semibold text-gray-900 mb-12">Assets We Value</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 sm:gap-6">
          {assetCategories.map((item, i) => (
            <div
              key={i}
              className="rounded-lg overflow-hidden shadow-md transform transition-all duration-300 hover:scale-105 hover:shadow-lg group relative"
            >
              <div className="relative h-40 sm:h-48 w-full">
                <Image src={item.image} alt={item.name} fill className="object-cover" />
                <div
                  className={`absolute inset-0 bg-gradient-to-t ${item.bgColor} opacity-60 group-hover:opacity-80 transition-opacity`}
                />
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                <div className="bg-white/90 rounded-full p-3 mb-3">{item.icon}</div>
                <p className="text-white font-semibold text-sm sm:text-base drop-shadow-md">{item.name}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Revised How It Works Section
export const RevisedHowItWorksSection: React.FC<{ 
  activeTab: 'borrower' | 'lender';
  showLearnMoreButton?: boolean;
}> = ({ activeTab, showLearnMoreButton = false }) => {
const borrowerSteps = [
    {
      title: 'Get a Price',
      desc: 'Upload photos or enter details of your luxury items. Our AI instantly estimates their value.',
      icon: Camera,
      image: '/person_applying_on_phone.webp',
      alt: 'Uploading item details'
    },
    {
      title: 'Authentication & Smart Box',
      desc: 'We send an authenticator with our smart box to complete your onboarding in just one day.',
      icon: Lock,
      image: '/watch_authentication.jpg',
      alt: 'Smart box delivery'
    },
    {
      title: 'Get Funded',
      desc: 'Receive funds directly to your bank account as soon as you sign the agreements.',
      icon: DollarSign,
      image: '/get_funded_happy_2.jpg',
      alt: 'Receive funds'
    }
];

const lenderSteps = [
    {
      title: 'Create Account',
      desc: 'Sign up and complete identity verification to join our investor community.',
      icon: Shield,
      image: '/business_man_signs_up.webp',
      alt: 'Sign up process'
    },
    {
    title: 'Browse Opportunities',
    desc: 'Explore available investment opportunities categorized by asset type and expected returns.',
    icon: Camera,
    image: '/browse_investments.jpg',
    alt: 'Browse assets'
    },
    {
    title: 'Earn Returns',
    desc: 'Receive consistent monthly payments with 8-10% annual returns.',
    icon: DollarSign,
    image: '/earn_returns.webp',
    alt: 'Earn returns'
    }
];

const steps = activeTab === 'borrower' ? borrowerSteps : lenderSteps;

return (
    <section className="pt-16 pb-8 sm:pt-20 sm:pb-6 bg-white">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 text-center mb-12">
        <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-3">How It Works</h2>
        <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto">
        {activeTab === 'borrower'
            ? 'Get liquidity from your items in 3 simple steps'
            : 'Start earning returns in 3 simple steps'}
        </p>
    </div>
    
    <div className="grid gap-6 sm:gap-8 md:grid-cols-3 max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        {steps.map((item, i) => (
        <div key={i} className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 hover:shadow-lg transition-all h-full">
            <div className="relative w-full h-60 mb-6 rounded-lg overflow-hidden">
            <Image src={item.image} alt={item.alt} fill className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900/20 to-transparent" />
            <div className="absolute top-4 right-4 bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold">
                {i + 1}
            </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
            <p className="text-gray-600 mb-4">{item.desc}</p>
            <div className="w-16 h-16 mx-auto opacity-70 flex items-center justify-center">
            <item.icon className="h-12 w-12 text-blue-300" />
            </div>
        </div>
        ))}
    </div>
    {/* Show "Learn More" button for both borrower and lender pages when required */}
    {showLearnMoreButton && (
        <div className="text-center mt-12">
        <Button 
            href={activeTab === 'borrower' ? '/how-it-works' : '/lenders/how-it-works'} 
            variant="outline"
        >
            Learn More About Our Process
            <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
        </div>
    )}
    </section>
);
};