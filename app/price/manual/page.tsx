'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import LoadingOverlay from '@/components/LoadingOverlay';
import { X } from 'lucide-react';

export default function PriceByManualPage() {
  const router = useRouter();
  const [itemDescription, setItemDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string|null>(null);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  
  // Loading steps for manual description analysis
  const loadingSteps = [
    { label: "Processing description", completed: false, active: true },
    { label: "Extracting product attributes", completed: false, active: false },
    { label: "Identifying brand & model", completed: false, active: false },
    { label: "Generating search query", completed: false, active: false },
    { label: "Searching marketplace data", completed: false, active: false },
    { label: "Finding distinct product variations", completed: false, active: false },
    { label: "Analyzing price ranges", completed: false, active: false },
    { label: "Preparing results", completed: false, active: false }
  ];
  
  const [steps, setSteps] = useState(loadingSteps);
  
  // Time tracker for analysis
  const [startTime, setStartTime] = useState(0);
  
  // Progress animation during analysis
  useEffect(() => {
    let interval: NodeJS.Timeout;
    let stepInterval: NodeJS.Timeout;
    
    if (isAnalyzing) {
      // Simulate progress with realistic timing based on the terminal log
      interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 98) {
            clearInterval(interval);
            return 98;
          }
          
          // Progress increases in smaller increments as we get further along
          const increment = prev < 30 ? 5 : prev < 60 ? 3 : prev < 80 ? 2 : 1;
          return prev + increment;
        });
      }, 300);
      
      // Update steps with realistic timing
      // The manual method seems slightly slower based on your logs (11775ms vs 11119ms)
      const stepTiming = [0, 1200, 2500, 3800, 6000, 8000, 10000, 11500];
      
      stepInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        
        // Find current step based on elapsed time
        let newStepIndex = -1;
        for (let i = 0; i < stepTiming.length; i++) {
          if (elapsed >= stepTiming[i]) {
            newStepIndex = i;
          } else {
            break;
          }
        }
        
        if (newStepIndex >= 0 && newStepIndex !== currentStep) {
          setCurrentStep(newStepIndex);
          
          // Update steps state
          setSteps(prev => prev.map((step, idx) => {
            if (idx < newStepIndex) {
              return { ...step, completed: true, active: false };
            } else if (idx === newStepIndex) {
              return { ...step, completed: false, active: true };
            } else {
              return { ...step, completed: false, active: false };
            }
          }));
        }
      }, 500);
    }
    
    return () => {
      clearInterval(interval);
      clearInterval(stepInterval);
    }
  }, [isAnalyzing, currentStep]);

  const handleAnalyze = async () => {
    if (!itemDescription.trim()) {
      setError('Please enter a description of your item.');
      return;
    }
    setError(null);
    setIsAnalyzing(true);
    setProgress(0);
    setCurrentStep(0);
    setSteps(loadingSteps.map((step, idx) => 
      idx === 0 ? { ...step, active: true } : step
    ));
    setStartTime(Date.now());
  
    try {
      // Call our new identify-item-manual endpoint
      const res = await fetch('/api/identify-item-manual', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          description: itemDescription
        })
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || `Error ${res.status}`);
      }
      
      const data = await res.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      if (!data.resultId) {
        throw new Error('No result ID received from server');
      }
      
      // Set progress to 100% when complete
      setProgress(100);
      
      // Update all steps to completed
      setSteps(prev => prev.map(step => ({ ...step, completed: true, active: false })));
      
      // Short delay before redirect for user to see completion
      setTimeout(() => {
        // Save the original description to sessionStorage for potential reference on the results page
        sessionStorage.setItem(`itemDescription_${data.resultId}`, itemDescription);
        
        // Navigate to results page - same endpoint as the photo flow uses
        router.push(`/price/results?id=${data.resultId}`);
      }, 800);
    } catch (e: any) {
      console.error('Error during analysis:', e);
      setIsAnalyzing(false);
      setError(e.message || 'Unexpected error');
    }
  };

  const handleReset = () => {
    setItemDescription('');
    setError(null);
  };

  return (
    <main className="min-h-screen bg-white text-gray-900">
      <Analytics />
      <SpeedInsights />
      <Header activeTab="borrower" />

      <section className="pt-32 pb-16 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-gray-900 mb-4">
              Identify & Price Your Item
            </h1>
            <p className="text-lg text-gray-600">
              Describe your item in detail and let our AI find matching listings.
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            {isAnalyzing ? (
              <LoadingOverlay
                message="Analyzing your description…"
                subMessage="Our AI is finding matching listings. This typically takes 10-12 seconds."
                progress={progress}
                isFullScreen={false}
                steps={steps}
                estimatedTime="About 12 seconds remaining"
              />
            ) : (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 text-center">
                {error && (
                  <div className="mb-4 p-3 bg-red-100 text-red-800 rounded">
                    {error}
                  </div>
                )}

                <div className="mb-4">
                  <div className="relative mx-auto max-w-2xl">
                    <label 
                      htmlFor="item-description" 
                      className="block text-left text-gray-700 font-medium mb-2"
                    >
                      Item Description
                    </label>
                    <div className="relative">
                      <textarea
                        id="item-description"
                        rows={6}
                        className="w-full rounded-lg border border-gray-300 p-4 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g. 'Pink Hermès Birkin 25, leather, 2019, very good condition' or 'Men's Rolex Submariner 114060 No Date Black Ceramic Bezel Steel Watch'"
                        value={itemDescription}
                        onChange={(e) => setItemDescription(e.target.value)}
                      />
                      {itemDescription && (
                        <button
                          onClick={handleReset}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full"
                          aria-label="Clear description"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-gray-500 text-left">
                      The more details you can provide, the more accurate our matching will be.
                    </p>
                  </div>
                </div>

                <div className="flex justify-center space-x-4 mt-6">
                  <button
                    onClick={handleAnalyze}
                    disabled={!itemDescription.trim()}
                    className={`px-6 py-3 rounded-lg font-medium ${
                      itemDescription.trim()
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    Analyze & View Matches
                  </button>
                  {itemDescription && (
                    <button
                      onClick={handleReset}
                      className="px-6 py-3 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}