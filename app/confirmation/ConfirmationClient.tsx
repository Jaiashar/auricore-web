'use client';

import React, { FC, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import {
  ArrowRight,
  Check,
  Clock,
  DollarSign,
  AlertCircle,
  RefreshCw,
  Mail,
  Loader2,
} from 'lucide-react';

import EnhancedPricingDisplay from '@/components/EnhancedPricingDisplay';
import LoadingOverlay from '@/components/LoadingOverlay';
import DetailedPricingProgress from '@/components/DetailedPricingProgress';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import TrustBadges from '@/components/sections/TrustBadges';

// --- Interfaces ---
interface CustomerInfo { email?: string; name?: string; phone?: string; useCase?: string; }
interface SelectedMatch { title?: string; image?: string; }
export interface PricingInfo {
  confidence: string;
  dataPoints: number;
  priceRange?: string;
  marketValueRange?: { low: number; high: number };
  disbursedAmount: number;
  insights?: string[];
  offerAmountRange?: { low: number; high: number };
}
interface ApplicationItem { id: string; category?: string; }
interface ApplicationData {
  customerInfo?: CustomerInfo;
  useCase?: string;
  selectedMatches?: Record<string, SelectedMatch>;
  selectedMatch?: SelectedMatch;
  finalPricing?: { pricingData?: Record<string, PricingInfo> };
  pricingData?: Record<string, PricingInfo>;
  items?: ApplicationItem[];
  pricingStatus?: string;
  emailSent?: boolean;
  pricingItemStage?: Record<string, string>;
  pricingItemProgress?: Record<string, number>;
  pricingItemStatus?: Record<string, string>;
  pricingItemStartTime?: Record<string, string>;
}

const POLL_INTERVAL_MS = 3000;
const STALL_THRESHOLD_MS = 180000; // 3 minutes

// Helper function for mapping stages
const mapSimpleStageToDetailed = (stage: string): any => {
  const stageMap: Record<string, string> = {
    'initializing': 'initializing',
    'searching': 'searching',
    'analyzing': 'analyzing',
    'retrieving': 'data-collection',
    'processing': 'data-processing',
    'evaluating': 'condition-evaluation',
    'comparing': 'market-comparison',
    'calculating': 'offer-calculation',
    'finalizing': 'range-determination',
    'complete': 'complete'
  };
  
  return stageMap[stage] || 'initializing';
};

const ConfirmationClient: FC = () => {
  const params = useSearchParams();
  const id = params.get('applicationId') || params.get('id');
  const emailParam = params.get('email') || undefined;
  
  // All useState hooks grouped together at the top
  const [userImage, setUserImage] = useState<string | null>(null);
  const [applicationData, setApplicationData] = useState<ApplicationData | null>(null);
  const [pricingInfo, setPricingInfo] = useState<Record<string, PricingInfo> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState<boolean | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [initiatedItems, setInitiatedItems] = useState<Set<string>>(new Set());
  const [stalledPricing, setStalledPricing] = useState(false);
  const [elapsedTime, setElapsedTime] = useState<number>(0);

  const startTimeRef = useRef(Date.now());
  const initialAttemptRef = useRef(false);

  const items = useMemo(() => applicationData?.items ?? [], [applicationData]);
  const processedIds = useMemo(() => (pricingInfo ? Object.keys(pricingInfo) : []), [pricingInfo]);
  const processingIds = useMemo(() => {
    const ids = items.map(({ id }) => id);
    return ids.filter(
      id =>
        !processedIds.includes(id) ||
        applicationData?.pricingItemStatus?.[id] === 'processing'
    );
  }, [items, processedIds, applicationData]);

  const pricingComplete =
    applicationData?.pricingStatus === 'complete' ||
    (items.length > 0 && processedIds.length === items.length);

  const fetchApplication = useCallback(async () => {
    if (!id) return;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(`/api/get-application?id=${id}`, { signal: controller.signal });
      clearTimeout(timeout);

      if (!res.ok) throw new Error(`Status ${res.status}`);
      const { success, application } = await res.json();
      if (!success || !application) throw new Error('Invalid payload');

      setApplicationData(application);
      setEmailSent(!!application.emailSent);
      const pd = application.pricingData || application.finalPricing?.pricingData;
      if (pd) setPricingInfo(pd);
      setRetryCount(0);
      setLoading(false);
      setError(null);
    } catch {
      setRetryCount(c => {
        if (c > 3) setError('Unable to load application data. Retrying...');
        return c + 1;
      });
    }
  }, [id]);

  const initiatePricing = useCallback(
    async (itemId: string, force = false) => {
      if (!id || !itemId) return;
      try {
        await fetch('/api/search-pricing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ applicationId: id, itemId, forcePricing: force }),
        });
        setInitiatedItems(s => new Set(s).add(itemId));
      } catch {}
    },
    [id]
  );

  const sendEmail = useCallback(
    async (force = false) => {
      if (!id || (emailSent && !force)) return;
      setSendingEmail(true);
      setEmailSuccess(null);
      try {
        const response = await fetch('/api/send-confirmation-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ applicationId: id, email: emailParam || applicationData?.customerInfo?.email }),
        });
        
        const data = await response.json();
        setEmailSent(true);
        setEmailSuccess(data.success);
        
        // Auto-hide success message after 3 seconds
        if (data.success) {
          setTimeout(() => setEmailSuccess(null), 3000);
        }
      } catch (error) {
        setEmailSuccess(false);
      } finally {
        setSendingEmail(false);
      }
    },
    [id, emailParam, emailSent, applicationData]
  );

  // useEffect hooks grouped together
  useEffect(() => {
    if (!id) return;
    const photo = sessionStorage.getItem(`itemPhoto_${id}`);
    if (photo) setUserImage(photo);
  }, [id]);

  useEffect(() => {
    if (!pricingComplete) {
      const timer = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [pricingComplete]);

  useEffect(() => {
    if (
      loading ||
      pricingComplete ||
      !applicationData ||
      initialAttemptRef.current
    ) return;

    const toPrice = items.filter(({ id }) => {
      const status = applicationData.pricingItemStatus?.[id];
      const startTimeStr = applicationData.pricingItemStartTime?.[id];
      const startMs = startTimeStr ? Date.parse(startTimeStr) : 0;

      return (
        !processedIds.includes(id) &&
        !initiatedItems.has(id) &&
        !(
          status === 'processing' &&
          Date.now() - startMs < STALL_THRESHOLD_MS
        )
      );
    });

    if (toPrice.length === 0) {
      initialAttemptRef.current = true;
      return;
    }

    (async () => {
      for (const item of toPrice) {
        await initiatePricing(item.id);
        await new Promise(r => setTimeout(r, 500));
      }
      initialAttemptRef.current = true;
      fetchApplication();
    })();
  }, [
    applicationData,
    items,
    processedIds,
    initiatedItems,
    pricingComplete,
    fetchApplication,
    initiatePricing,
    loading
  ]);


  useEffect(() => {
    if (!id) {
      setLoading(false);
      setError('No application ID provided.');
      return;
    }
    fetchApplication();
    if (!pricingComplete) {
      const interval = setInterval(fetchApplication, POLL_INTERVAL_MS);
      return () => clearInterval(interval);
    }
  }, [id, pricingComplete, fetchApplication]);

  useEffect(() => {
    if (!pricingComplete && processingIds.length > 0) {
      if (Date.now() - startTimeRef.current > STALL_THRESHOLD_MS) {
        setStalledPricing(true);
      }
    }
  }, [processingIds.length, pricingComplete]);

  useEffect(() => {
    if (pricingComplete && !emailSent) {
      fetch('/api/create-borrower', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId: id }),
      });
    }
  }, [pricingComplete, emailSent, id]);

  useEffect(() => {
    if (pricingComplete && !emailSent && !sendingEmail) sendEmail();
  }, [pricingComplete, emailSent, sendingEmail, sendEmail]);

  const handleRetry = () => {
    startTimeRef.current = Date.now();
    initialAttemptRef.current = false;
    setInitiatedItems(new Set());
    setError(null);
    setLoading(true);
    setPricingInfo(null);
    setEmailSent(false);
    setRetryCount(0);
    setStalledPricing(false);
    fetchApplication();
  };

  const handleResendEmail = () => {
    sendEmail(true);
  };

  // Compute totals & midpoints
  const { totalLow, totalHigh, marketLow, marketHigh } = useMemo(() => {
    let low = 0, high = 0, mLow = 0, mHigh = 0;
    items.forEach(({ id }) => {
      const p = pricingInfo?.[id];
      if (p?.offerAmountRange) {
        low += p.offerAmountRange.low;
        high += p.offerAmountRange.high;
      }
      if (p?.marketValueRange) {
        mLow += p.marketValueRange.low;
        mHigh += p.marketValueRange.high;
      }
    });
    return { totalLow: low, totalHigh: high, marketLow: mLow, marketHigh: mHigh };
  }, [items, pricingInfo]);

  // Narrowed midpoint & margin (~10%)
  const marketMid = (marketLow + marketHigh) / 2;
  const marketMargin = marketMid * 0.1;
  const formattedMarketMid = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(marketMid);
  const formattedMarketMargin = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(marketMargin);

  const offerMid = (totalLow + totalHigh) / 2;
  const offerMargin = offerMid * 0.1;
  const formattedOfferMid = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(offerMid);
  const formattedOfferMargin = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(offerMargin);

  if (loading) return (
    <>  
      <Header activeTab="borrower" />
      <LoadingOverlay message="Loading your submission..." subMessage="Retrieving your application details." />
      <Footer />
    </>
  );

  if (error) return (
    <>  
      <Header activeTab="borrower" />
      <div className="bg-gray-50 min-h-screen pt-16 pb-12">
        <div className="max-w-4xl mx-auto px-6">
          <div className="bg-white rounded-2xl shadow-md border overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-8 py-6 text-white">
              <h2 className="text-2xl font-semibold">Application Status</h2>
              <p className="text-blue-100">{error}</p>
            </div>
            <div className="p-8 text-center">
              <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <button onClick={handleRetry} className="mt-4 inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-lg">
                <RefreshCw className="h-4 w-4 mr-2" />Try Again
              </button>
            </div>
          </div>
          <Link href="/" className="block mt-10 text-center text-blue-600 hover:underline">
            Return to Home <ArrowRight className="inline h-4 w-4 ml-1" />
          </Link>
        </div>
      </div>
      <Footer />
    </>
  );

  const data = applicationData!;
  const name = data.customerInfo?.name || 'Customer';
  const useCase = data.useCase || data.customerInfo?.useCase || '';
  const userEmail = emailParam || data.customerInfo?.email;

  return (
    <>
      <Analytics />
      <SpeedInsights />
      <Header activeTab="borrower" />
      <main className="bg-gray-50 min-h-screen pt-24 pb-12">
        <div className="max-w-4xl mx-auto px-6">
          <div className="bg-white rounded-2xl shadow-md border overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-8 py-6 text-white">
              <h2 className="text-2xl font-semibold">Application Received</h2>
              <p className="text-blue-100">Thank you for submitting your items for evaluation.</p>
            </div>

            <div className="p-8">
              {/* Thank You */}
              <div className="text-center mb-6">
                {userImage ? (
                  <div className="mx-auto w-32 h-32 mb-6"><img src={userImage} alt="Your submitted photo" className="w-full h-full object-contain rounded-lg shadow" /></div>
                ) : (
                  <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6"><Check className="h-10 w-10 text-green-600" /></div>
                )}
                <h2 className="text-3xl font-medium mb-2 text-gray-900">Thank You, {name}</h2>
                {userEmail && <p className="text-sm text-gray-700 mb-2">Confirmation sent to <span className="font-medium">{userEmail}</span></p>}
              </div>

              {/* Resend Email Button */}
              {pricingComplete && userEmail && (
                <div className="text-center mb-8">
                  <button
                    onClick={handleResendEmail}
                    disabled={sendingEmail}
                    className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 transition rounded-lg text-sm font-medium"
                  >
                    {sendingEmail ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="h-4 w-4 mr-2" />
                        Resend Confirmation Email
                      </>
                    )}
                  </button>
                  
                  {/* Email status feedback */}
                  {emailSuccess === true && (
                    <div className="mt-2 text-sm text-green-600 flex items-center justify-center">
                      <Check className="h-4 w-4 mr-1" /> Email sent successfully
                    </div>
                  )}
                  {emailSuccess === false && (
                    <div className="mt-2 text-sm text-red-600 flex items-center justify-center">
                      <AlertCircle className="h-4 w-4 mr-1" /> Failed to send email. Please try again.
                    </div>
                  )}
                </div>
              )}

              {/* Progress Indicator */}
              {/* Progress Indicator - Updated to use only DetailedPricingProgress */}
              {!pricingComplete && items.length > 0 && (
                <div className="mb-8">
                  {/* For single item processing */}
                  {items.length === 1 && processingIds.length === 1 ? (
                    <DetailedPricingProgress
                      applicationId={id!}
                      itemId={processingIds[0]}
                    />
                  ) : (
                    /* For multiple items, show each item's progress separately */
                    <div className="space-y-6">
                      <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 mb-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-medium text-blue-700">Processing Your Items</h3>
                          <div className="text-sm text-blue-600">
                            {processedIds.length} of {items.length} complete
                          </div>
                        </div>
                        <div className="w-full bg-blue-100 rounded-full h-2.5 mb-2">
                          <div
                            className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                            style={{ width: `${(processedIds.length / items.length) * 100}%` }}
                          />
                        </div>
                      </div>
                      
                      {processingIds.map((itemId, index) => {
                        const item = items.find(i => i.id === itemId);
                        const match = data.selectedMatches?.[itemId] ?? data.selectedMatch ?? null;
                        
                        return (
                          <div key={itemId} className="border border-gray-200 rounded-lg overflow-hidden">
                            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                              <div className="flex items-center">
                                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                                  <span className="text-blue-700 text-xs font-medium">{index + 1}</span>
                                </div>
                                <h4 className="text-sm font-medium text-gray-900">
                                  {match?.title || `Item ${index + 1}`}
                                </h4>
                              </div>
                            </div>
                            <div className="p-4">
                              <DetailedPricingProgress
                                applicationId={id!}
                                itemId={itemId}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Narrowed Market & Offer Summary */}
              {pricingComplete && (
                <div className="mb-8 flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6">
                  <div className="bg-gray-50 p-6 rounded-xl border text-center">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Estimated Market Value</h3>
                    <div className="text-3xl font-semibold text-gray-800 flex items-baseline justify-center">
                      <span>≈ {formattedMarketMid}</span>
                      <span className="text-base font-normal text-gray-600 ml-2">±{formattedMarketMargin}</span>
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-xl border text-center">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Our Offer</h3>
                    <div className="text-3xl font-semibold text-green-600 flex items-baseline justify-center">
                      <span>≈ {formattedOfferMid}</span>
                      <span className="text-base font-normal text-green-600 ml-2">±{formattedOfferMargin}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Itemized Offers */}
              {pricingComplete && items.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-2xl font-medium text-gray-800 mb-6 text-center">Itemized Offers</h3>
                  <div className="space-y-6">
                    {items.map((item, i) => {
                      const match: SelectedMatch | null = data.selectedMatches?.[item.id] ?? data.selectedMatch ?? null;
                      const info = pricingInfo?.[item.id] || null;
                      return (
                        <div key={item.id} className="p-6 bg-white rounded-xl border">
                          <div className="flex items-center mb-4">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3"><span className="text-blue-700 font-semibold">{i+1}</span></div>
                            <h4 className="text-lg font-medium text-gray-900">{match?.title || `Item ${i+1}`}</h4>
                          </div>
                          <EnhancedPricingDisplay
                            pricingInfo={info}
                            itemData={item}
                            selectedMatch={match}   
                        />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Upsell Loans */}
              {pricingComplete && useCase !== 'loan' && (
                <div className="mb-8 bg-blue-50 p-6 rounded-xl border text-center">
                  <h3 className="text-lg font-medium text-blue-800 mb-2">Need Cash Now?</h3>
                  <p className="text-blue-700 mb-4">With Auricore loans, borrow against your items without giving them up. Get instant access to funds at competitive rates.</p>
                  <Link href="/loan" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg">Learn About Loans <ArrowRight className="h-4 w-4 ml-2" /></Link>
                </div>
              )}

              {/* Trust Badges */}
              <TrustBadges />

              {/* Next Steps */}
              <div className="mt-10 pt-6 border-t">
                <h3 className="text-xl font-medium mb-6 text-center text-gray-900">What Happens Next?</h3>
                <div className="space-y-4">
                  {[
                    { icon: ArrowRight, title: 'Identity Verification', desc: 'Our team will contact you to verify your identity and confirm the details.', bg: 'bg-blue-100', iconColor: 'text-blue-600' },
                    { icon: Clock, title: 'Item Authentication', desc: "We'll inspect your items to confirm their condition and verify provided details.", bg: 'bg-amber-100', iconColor: 'text-amber-600' },
                    { icon: DollarSign, title: 'Final Offer', desc: "After authentication, we'll send your final offer for each item.", bg: 'bg-green-100', iconColor: 'text-green-600' },
                  ].map(({ icon: Icon, title, desc, bg, iconColor }) => (
                    <div key={title} className="bg-gray-50 p-5 rounded-xl flex items-start">
                      <div className={`w-10 h-10 rounded-full ${bg} flex items-center justify-center mr-4`}><Icon className={`h-5 w-5 ${iconColor}`} /></div>
                      <div><h4 className="font-medium text-gray-800 mb-1">{title}</h4><p className="text-gray-700">{desc}</p></div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-10 text-center">
                <Link href="/" className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg">Return to Home <ArrowRight className="h-5 w-5 ml-2" /></Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default ConfirmationClient;