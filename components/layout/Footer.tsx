// app/components/layout/Footer.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export const Footer: React.FC = () => {
  const pathname = usePathname();
  
  // Check if we're on any lender page or subpage
  const isLenderSection = pathname?.includes('/lenders');
  
  // Set links based on current section
  const howItWorksLink = isLenderSection ? '/lenders/how-it-works' : '/how-it-works';
  const faqLink = isLenderSection ? '/lenders/how-it-works#lender-faq' : '/how-it-works#faq';
  const applyLink = isLenderSection ? '/lenders/apply' : '/apply';

  return (
    <footer className="bg-gray-50 text-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-8 text-center">
        <nav className="flex flex-wrap justify-center gap-4 sm:gap-8 mb-4">
          <Link href={howItWorksLink} className="text-sm sm:text-base hover:text-blue-600">How It Works</Link>
          <Link href={faqLink} className="text-sm sm:text-base hover:text-blue-600">FAQ</Link>
          <Link href={applyLink} className="text-sm sm:text-base hover:text-blue-600">Apply</Link>
        </nav>
        <p className="text-xs sm:text-sm text-gray-500">© 2025 Auricore. All rights reserved.</p>
      </div>
    </footer>
  );
};