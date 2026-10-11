// app/price/results/PriceResultsClient.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import LoadingOverlay from '@/components/LoadingOverlay';
import ItemMatchSelector from '@/components/ItemMatchSelector';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { getFirebaseDb } from '@/utils/config';
import { doc, getDoc } from 'firebase/firestore';

export default function PriceResultsClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const resultId = searchParams.get('id');
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string|null>(null);
  const [resultData, setResultData] = useState<{
    matches: any[];
    categoryData: any;
    item: any;
    queryUsed: string;
  }>({
    matches: [],
    categoryData: {},
    item: {},
    queryUsed: ''
  });
  
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    async function fetchResultData() {
      if (!resultId) {
        setError('No result ID provided');
        setIsLoading(false);
        return;
      }

      try {
        const db = getFirebaseDb();
        const resultRef = doc(db, 'analysisResults', resultId);
        const resultSnap = await getDoc(resultRef);

        if (!resultSnap.exists()) {
          setError('Result not found');
          setIsLoading(false);
          return;
        }

        const data = resultSnap.data() as any;
        setResultData(data);
        
        if (data.matches && data.matches.length === 1) {
          setSelectedMatchId(0);
        }
        
        setIsLoading(false);
      } catch (err: any) {
        console.error('Error fetching result:', err);
        setError(err.message || 'Failed to fetch result data');
        setIsLoading(false);
      }
    }

    fetchResultData();
  }, [resultId]);

  const { matches, categoryData, item } = resultData;
  const categoriesMap = { [categoryData?.id || '']: categoryData || {} };
  
  const handleMatchSelection = (_match: any, idx: number) => {
    setSelectedMatchId(idx);
  };
  
  const handleContinue = () => {
    if (selectedMatchId === null) {
      alert('Please select a match to continue');
      return;
    }

    setIsTransitioning(true);
    router.push(`/item-details?id=${resultId}&matchIndex=${selectedMatchId}`);
  };
  
  const handleRetake = () => {
    router.push('/price/photo');
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-white text-gray-900">
        <Analytics />
        <SpeedInsights />
        <Header activeTab="borrower" />
        {isTransitioning && (
          <div className="fixed inset-0 bg-white bg-opacity-70 z-50 flex items-center justify-center">
            <LoadingOverlay message="Preparing your item details..." />
          </div>
        )}
        <Footer />
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-white text-gray-900">
        <Header activeTab="borrower" />
        <section className="pt-32 pb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 text-center">
            <div className="bg-red-50 p-6 rounded-lg">
              <h1 className="text-2xl font-medium text-red-800 mb-4">Error</h1>
              <p className="text-red-700">{error}</p>
              <button 
                onClick={() => router.push('/price/photo')}
                className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Try Again
              </button>
            </div>
          </div>
        </section>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white text-gray-900">
      <Analytics />
      <SpeedInsights />
      <Header activeTab="borrower" />

      <section className="pt-32 pb-16 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <h1 className="text-3xl font-semibold text-gray-900 mb-6">
            Matches for {item?.dynamicFields?.brand 
              ? `${item.dynamicFields.brand} ${item.dynamicFields.modelName || ''}` 
              : 'Your Item'}
          </h1>

          {matches.length > 0 ? (
            <>
              <ItemMatchSelector
                matches={matches}
                selectedMatchId={selectedMatchId}
                onSelectMatch={handleMatchSelection}
                onReload={handleRetake}
                categories={categoriesMap}
                isLoading={false}
              />

              <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
                <button
                  onClick={handleRetake}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all"
                >
                  Take Another Photo
                </button>
                
                <button
                  onClick={handleContinue}
                  disabled={selectedMatchId === null}
                  className={`px-8 py-3 rounded-lg font-medium flex items-center justify-center 
                    ${selectedMatchId !== null
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'bg-blue-300 text-white cursor-not-allowed'}
                  `}
                >
                  Continue with Selected Match
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-5 w-5 ml-2" 
                    viewBox="0 0 20 20" 
                    fill="currentColor"
                  >
                    <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>

              <div className="mt-4 text-center text-gray-500 text-sm">
                Select a match above, then click “Continue” to provide additional details about your item.
              </div>
            </>
          ) : (
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 text-center">
              <h2 className="text-xl font-medium text-gray-800 mb-4">No Matches Found</h2>
              <p className="text-gray-600 mb-6">
                We couldn't find any matches for your item. Try uploading a clearer image.
              </p>
              <button
                onClick={handleRetake}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
