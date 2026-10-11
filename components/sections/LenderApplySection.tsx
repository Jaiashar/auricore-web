// app/components/sections/LenderApplySection.tsx
import React, { useState, FormEvent, useEffect } from 'react';
import { Check, DollarSign, Shield, Lock, ArrowRight, Zap } from 'lucide-react';
import { Button } from '../ui/Button';

export const LenderApplySection: React.FC = () => {
  // State variables from your existing component
  const [lenderFirstName, setLenderFirstName] = useState('');
  const [lenderLastName, setLenderLastName] = useState('');
  const [lenderEmail, setLenderEmail] = useState('');
  const [lenderAmountText, setLenderAmountText] = useState('500');
  const [lenderAmount, setLenderAmount] = useState(500);
  const [promoCode, setPromoCode] = useState('');
  const [isRateBoosted, setIsRateBoosted] = useState(false);
  const [promoCodeVerified, setPromoCodeVerified] = useState(false);
  const [promoCodeError, setPromoCodeError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);

  // Constants for rate values
  const standardRateRange = "8-10%";
  const boostedRateRange = "12-15%";

  // Valid promo codes (in a real app, you'd verify these on the server)
  const validPromoCodes = ["CODEBOOST", "VIP2025", "PREMIUM"];

  const verifyPromoCode = () => {
    setPromoCodeError(null);
    setIsVerifyingCode(true);

    // Simulate network request with setTimeout
    setTimeout(() => {
      if (!promoCode.trim()) {
        setPromoCodeError("Please enter a promo code");
        setIsVerifyingCode(false);
        return;
      }

      if (validPromoCodes.includes(promoCode.trim().toUpperCase())) {
        setPromoCodeVerified(true);
        setIsRateBoosted(true);
        setPromoCodeError(null);
      } else {
        setPromoCodeVerified(false);
        setIsRateBoosted(false);
        setPromoCodeError("Invalid promo code");
      }
      setIsVerifyingCode(false);
    }, 600);
  };

  const handleLenderSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!lenderEmail || lenderAmount < 500) {
      setSubmitError('Please provide a valid email and at least $500.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/create-lender', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: lenderFirstName,
          lastName: lenderLastName,
          email: lenderEmail,
          amount: lenderAmount,
          isRateBoosted: isRateBoosted,
          promoCode: isRateBoosted ? promoCode : null
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Signup failed');
      
      // Set success state but keep isRateBoosted status
      setSubmitSuccess(true);
      
      // Clear form data but preserve the boosted rate status
      setLenderFirstName('');
      setLenderLastName('');
      setLenderEmail('');
      setLenderAmount(500);
      setLenderAmountText('500');
      
      // Important: Don't reset these values when form is submitted
      // We'll keep the promo code and boosted status
      // This is the key fix to your issue
    } catch (err: any) {
      setSubmitError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Benefits data
  const lenderBenefits = [
    {
      title: "High Annual Returns",
      description: isRateBoosted 
        ? "Enjoy premium returns of 12-15% that significantly outperform traditional investments" 
        : "Earn industry-leading returns of 8-10% that outperform most traditional investments",
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
    <section className="py-20 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8">
        
        {/* Form Section */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
          <div className="grid md:grid-cols-2">
            {/* Left side - Form */}
            <div className="p-6 sm:p-8 md:p-10">
              {submitSuccess ? (
                <div className="bg-green-50 p-6 rounded-lg text-center h-full flex flex-col items-center justify-center">
                  <Check className="h-12 w-12 text-green-600 mx-auto mb-4"/>
                  <h3 className="text-green-800 font-medium text-xl mb-2">Thank you!</h3>
                  <p className="text-green-700">
                    We've received your information and will be in touch soon to help you start your investment journey
                    {isRateBoosted && " with your special boosted returns!"}.
                  </p>
                </div>
              ) : (
                <>
                  <h3 className="text-2xl font-bold text-gray-800 mb-6">Start Investing Today</h3>
                  <form onSubmit={handleLenderSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                        <input
                          type="text"
                          value={lenderFirstName}
                          onChange={e => setLenderFirstName(e.target.value)}
                          required
                          className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                        <input
                          type="text"
                          value={lenderLastName}
                          onChange={e => setLenderLastName(e.target.value)}
                          required
                          className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Your Email</label>
                      <input
                        type="email"
                        value={lenderEmail}
                        onChange={e => setLenderEmail(e.target.value)}
                        required
                        className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Investment Amount</label>
                      <div className="relative mt-1">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <span className="text-gray-700 font-medium">$</span>
                        </div>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={lenderAmountText}
                          onChange={e => {
                            const txt = e.target.value.replace(/[^0-9]/g, '');
                            setLenderAmountText(txt);
                            setLenderAmount(txt === '' ? 0 : parseInt(txt, 10));
                          }}
                          required
                          className="w-full pl-7 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium"
                        />
                      </div>
                      {lenderAmount < 500 && (
                        <p className="mt-1 text-xs text-red-500">Minimum investment amount is $500</p>
                      )}
                    </div>
                    
                    {/* Promo Code Section */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Promo Code (Optional)</label>
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={promoCode}
                          onChange={e => {
                            setPromoCode(e.target.value);
                            setPromoCodeVerified(false);
                            setPromoCodeError(null);
                            setIsRateBoosted(false);
                          }}
                          placeholder="Enter promo code for rate boost"
                          className={`flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium ${
                            promoCodeVerified ? 'border-green-500' : promoCodeError ? 'border-red-500' : ''
                          }`}
                        />
                        <button
                          type="button"
                          onClick={verifyPromoCode}
                          disabled={isVerifyingCode || !promoCode}
                          className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                          {isVerifyingCode ? 'Verifying...' : 'Verify'}
                        </button>
                      </div>
                      {promoCodeError && <p className="mt-1 text-xs text-red-500">{promoCodeError}</p>}
                      {promoCodeVerified && (
                        <p className="mt-1 text-xs text-green-600 flex items-center">
                          <Zap className="h-3 w-3 mr-1" /> Rate boost applied! Enjoy 12-15% returns.
                        </p>
                      )}
                    </div>
                    
                    {submitError && <p className="text-red-600 text-sm">{submitError}</p>}
                    <div>
                      <Button type="submit" variant="primary" disabled={isSubmitting} className="w-full">
                        {isSubmitting ? 'Submitting…' : 'Join Lender Waitlist'} <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </form>
                </>
              )}
            </div>
            
            {/* Right side - Stats/Info */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white p-6 sm:p-8 md:p-10 flex flex-col justify-center">
              <h3 className="text-2xl font-semibold mb-6 text-white">Investment Highlights</h3>
              <div className="space-y-6">
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                  <div className="text-sm font-medium text-white mb-1">Annual Return Rate</div>
                  <div className="text-3xl font-bold relative transition-all duration-500">
                    {isRateBoosted ? (
                      <>
                        <span className="line-through opacity-50">{standardRateRange}</span>
                        <span className="ml-2 text-green-400 animate-pulse">{boostedRateRange}</span>
                        <Zap className="h-5 w-5 text-green-400 inline ml-1 animate-bounce" />
                      </>
                    ) : (
                      standardRateRange
                    )}
                  </div>
                </div>
                
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                  <div className="text-sm font-medium text-white mb-1">Minimum Investment</div>
                  <div className="text-3xl font-bold">$500</div>
                </div>
                
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                  <div className="text-sm font-medium text-white mb-1">Average Monthly Distribution</div>
                  <div className="text-3xl font-bold">
                    {isRateBoosted ? (
                      <>
                        <span className="line-through opacity-50">0.7%</span>
                        <span className="ml-2 text-green-400">1.0%</span>
                      </>
                    ) : (
                      "0.7%"
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};