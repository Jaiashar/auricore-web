// app/components/layout/Header.tsx
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button';

interface HeaderProps {
  activeTab?: 'borrower' | 'lender';
  onTabChange?: (tab: 'borrower' | 'lender') => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  activeTab = 'borrower',
  onTabChange 
}) => {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleTabChange = (tab: 'borrower' | 'lender') => {
    if (onTabChange) {
      onTabChange(tab);
    }
    setMobileMenuOpen(false);
  };

  // Determine current page type
  const isBorrowerHowItWorks = pathname === '/how-it-works';
  const isLenderHowItWorks = pathname === '/lenders/how-it-works';
  const isBorrowerApply = pathname === '/#quick-price';
  const isLenderApply = pathname === '/lenders/apply';
  
  // Determine if we're on a lender or borrower page
  const isLenderPage = pathname.startsWith('/lenders') || activeTab === 'lender';
  const currentActiveTab = isLenderPage ? 'lender' : 'borrower';

  // Determine the "Get Started" URL based on current tab/page
  const getStartedUrl = isLenderPage 
    ? '/lenders/apply'
    : '/#quick-price';
    
  // Determine logo link based on current section
  const logoLink = isLenderPage ? '/lenders' : '/';

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-gray-50 shadow-sm' : 'bg-gradient-to-b from-gray-50 to-gray-50'
      } ${mobileMenuOpen ? 'h-auto' : 'h-16 md:h-20'}`}
    >
      <div className="flex items-center justify-between h-16 md:h-20 px-0 md:px-4">
        {/* Custom logo implementation with strict clickbox */}
        <div className="relative flex items-center">
          {/* Expanded clickable area positioned over the logo */}
          <Link href={logoLink} className="absolute z-10 top-1/2 -translate-y-1/2 left-4 h-10 w-48 overflow-hidden">
            <span className="sr-only">Auricore - Home</span>
          </Link>
          
          {/* Non-interactive logo image (for display only) */}
          <div className="pointer-events-none">
            <Image
              src="/imagelogo.svg"
              alt="Auricore Logo"
              width={400}
              height={112}
              priority
              className="h-auto w-72 md:w-96 -ml-12"
            />
          </div>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6">
          {/* Borrower How It Works Page */}
          {isBorrowerHowItWorks && (
            <>
              <Link
                href="/how-it-works"
                className="font-medium text-sm text-blue-600"
              >
                How It Works
              </Link>
              <Link
                href="/"
                className="font-medium text-sm text-gray-600 hover:text-blue-600"
              >
                For Borrowers
              </Link>
            </>
          )}

          {/* Lender How It Works Page */}
          {isLenderHowItWorks && (
            <>
              <Link
                href="/lenders/how-it-works"
                className="font-medium text-sm text-blue-600"
              >
                How It Works
              </Link>
              <Link
                href="/lenders"
                className="font-medium text-sm text-gray-600 hover:text-blue-600"
              >
                For Lenders
              </Link>
            </>
          )}

          {/* Borrower Apply Page */}
          {isBorrowerApply && (
            <Link
              href="/"
              className="font-medium text-sm text-gray-600 hover:text-blue-600"
            >
              For Borrowers
            </Link>
          )}

          {/* Lender Apply Page */}
          {isLenderApply && (
            <Link
              href="/lenders"
              className="font-medium text-sm text-gray-600 hover:text-blue-600"
            >
              For Lenders
            </Link>
          )}

          {/* Home or Lenders Page */}
          {!isBorrowerHowItWorks && !isLenderHowItWorks && !isBorrowerApply && !isLenderApply && (
            <>
              <Link
                href="/"
                className={`font-medium text-sm ${
                  currentActiveTab === 'borrower' ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'
                }`}
                onClick={() => handleTabChange('borrower')}
              >
                For Borrowers
              </Link>
              <Link
                href="/lenders"
                className={`font-medium text-sm ${
                  currentActiveTab === 'lender' ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'
                }`}
                onClick={() => handleTabChange('lender')}
              >
                For Lenders
              </Link>
            </>
          )}

          {/* "Get Started" button is always present */}
          <Button
            href={getStartedUrl}
            variant="primary"
            className="text-sm py-2 px-4"
          >
            Get Started
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        {/* Mobile */}
        <div className="md:hidden flex items-center">
          <Button
            href={getStartedUrl}
            variant="primary"
            className="text-xs py-1.5 px-3 mr-2 whitespace-nowrap"
          >
            Get Started
          </Button>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-1.5">
            {mobileMenuOpen ? <X className="h-5 w-5 text-gray-800"/> : <Menu className="h-5 w-5 text-gray-800"/>}
          </button>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-gray-50 border-t border-gray-100 shadow-sm">
          <div className="container mx-auto py-2">
            {/* Borrower How It Works Page */}
            {isBorrowerHowItWorks && (
              <>
                <Link 
                  href="/how-it-works" 
                  className="block w-full text-left py-3 px-3 text-blue-600 font-medium border-b border-gray-100 hover:bg-gray-100"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  How It Works
                </Link>
                <Link 
                  href="/" 
                  className="block w-full text-left py-3 px-3 text-gray-800 font-medium border-b border-gray-100 hover:bg-gray-100"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  For Borrowers
                </Link>
              </>
            )}

            {/* Lender How It Works Page */}
            {isLenderHowItWorks && (
              <>
                <Link 
                  href="/lenders/how-it-works" 
                  className="block w-full text-left py-3 px-3 text-blue-600 font-medium border-b border-gray-100 hover:bg-gray-100"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  How It Works
                </Link>
                <Link 
                  href="/lenders" 
                  className="block w-full text-left py-3 px-3 text-gray-800 font-medium border-b border-gray-100 hover:bg-gray-100"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  For Lenders
                </Link>
              </>
            )}

            {/* Borrower Apply Page */}
            {isBorrowerApply && (
              <Link 
                href="/" 
                className="block w-full text-left py-3 px-3 text-gray-800 font-medium border-b border-gray-100 hover:bg-gray-100"
                onClick={() => setMobileMenuOpen(false)}
              >
                For Borrowers
              </Link>
            )}

            {/* Lender Apply Page */}
            {isLenderApply && (
              <Link 
                href="/lenders" 
                className="block w-full text-left py-3 px-3 text-gray-800 font-medium border-b border-gray-100 hover:bg-gray-100"
                onClick={() => setMobileMenuOpen(false)}
              >
                For Lenders
              </Link>
            )}

            {/* Home or Lenders Page */}
            {!isBorrowerHowItWorks && !isLenderHowItWorks && !isBorrowerApply && !isLenderApply && (
              <>
                <Link 
                  href="/" 
                  className={`block w-full text-left py-3 px-3 font-medium border-b border-gray-100 hover:bg-gray-100 ${
                    currentActiveTab === 'borrower' ? 'text-blue-600' : 'text-gray-800'
                  }`}
                  onClick={() => handleTabChange('borrower')}
                >
                  For Borrowers
                </Link>
                <Link 
                  href="/lenders" 
                  className={`block w-full text-left py-3 px-3 font-medium hover:bg-gray-100 ${
                    currentActiveTab === 'lender' ? 'text-blue-600' : 'text-gray-800'
                  }`}
                  onClick={() => handleTabChange('lender')}
                >
                  For Lenders
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};