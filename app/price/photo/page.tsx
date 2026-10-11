'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import LoadingOverlay from '@/components/LoadingOverlay';
import CameraComponent from '@/components/CameraComponent';
import { Upload, X } from 'lucide-react';

export default function PriceByPhotoPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string|null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Loading steps for image analysis
  const loadingSteps = [
    { label: "Processing image", completed: false, active: true },
    { label: "Identifying item features", completed: false, active: false },
    { label: "Generating search query", completed: false, active: false },
    { label: "Searching marketplace data", completed: false, active: false },
    { label: "Finding distinct product variations", completed: false, active: false },
    { label: "Analyzing price ranges", completed: false, active: false },
    { label: "Preparing results", completed: false, active: false }
  ];
  
  const [steps, setSteps] = useState(loadingSteps);

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
      const stepTiming = [0, 1500, 3000, 5000, 7000, 9000, 10500];
      
      stepInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        
        // Find current step based on elapsed time
        const newStepIndex = stepTiming.findIndex((timing, index) => {
          return elapsed < timing && index > 0;
        }) - 1;
        
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

  // Helper function to detect HEIC file type from extension
  const isHeicFile = (filename: string): boolean => {
    const ext = filename.split('.').pop()?.toLowerCase();
    return ext === 'heic' || ext === 'heif';
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const img = e.target.files?.[0];
    if (!img) return;
    
    // Handle HEIC/HEIF files
    if (isHeicFile(img.name)) {
      console.log('HEIC file detected, will be converted on server');
    } else if (!img.type.startsWith('image/')) {
      setError('Please select an image file.');
      return;
    }
    
    if (img.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5MB.');
      return;
    }
    
    setFile(img);
    setPreviewUrl(URL.createObjectURL(img));
  };

  // Handle photo captured from camera
  const handleCapturePhoto = (capturedFile: File) => {
    setFile(capturedFile);
    setPreviewUrl(URL.createObjectURL(capturedFile));
    setIsCameraOpen(false);
  };

  // Time tracker for analysis
  const [startTime, setStartTime] = useState(0);
  
  const handleAnalyze = async () => {
    if (!file) {
      setError('Please select or capture an image to analyze.');
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
      const formData = new FormData();
      formData.append('image', file);
  
      const res = await fetch('/api/identify-item', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
  
      if (!res.ok) {
        throw new Error(data.error || `Server error ${res.status}`);
      }
      const { resultId, previewUrl } = data;
      if (!resultId || !previewUrl) {
        throw new Error('Invalid response from server');
      }
  
      // Set progress to 100% when complete
      setProgress(100);
      
      // Update all steps to completed
      setSteps(prev => prev.map(step => ({ ...step, completed: true, active: false })));
      
      // Short delay before redirect for user to see completion
      setTimeout(() => {
        // Redirect to results page, passing previewUrl if you like:
        router.push(
          `/price/results?id=${resultId}&preview=${encodeURIComponent(previewUrl)}`
        );
      }, 800);
    } catch (e: any) {
      console.error('Error during analysis:', e);
      setError(e.message || 'Unexpected error');
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreviewUrl(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
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
              Upload a photo or take a picture and let our AI find matching listings.
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            {isAnalyzing ? (
              <LoadingOverlay
                message="Analyzing your image…"
                subMessage="Our AI is finding matching listings. This typically takes 10-12 seconds."
                progress={progress}
                isFullScreen={false}
                steps={steps}
                estimatedTime="About 10 seconds remaining"
              />
            ) : (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 text-center">
                {error && (
                  <div className="mb-4 p-3 bg-red-100 text-red-800 rounded">
                    {error}
                  </div>
                )}

                {isCameraOpen ? (
                  // Use the isolated CameraComponent
                  <CameraComponent
                    onCapture={handleCapturePhoto}
                    onCancel={() => setIsCameraOpen(false)}
                  />
                ) : (
                  <div className="mb-4">
                    {previewUrl ? (
                      <div className="relative mx-auto w-64 h-64">
                        {/* Use standard img tag instead of Next.js Image component */}
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="w-full h-full object-contain rounded-lg"
                        />
                        <button
                          onClick={handleReset}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full"
                          aria-label="Remove image"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col md:flex-row justify-center items-center gap-4">
                        <button
                          onClick={() => setIsCameraOpen(true)}
                          className="w-full md:w-48 h-48 flex flex-col items-center justify-center rounded border-2 border-dashed border-blue-300 bg-blue-50 hover:bg-blue-100 transition duration-200"
                        >
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            className="w-10 h-10 text-blue-500 mb-2"
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                          >
                            <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                            <circle cx="12" cy="13" r="3" />
                          </svg>
                          <span className="text-blue-600 font-medium">Take a Photo</span>
                        </button>

                        <div className="text-gray-500 font-medium text-sm my-2 md:my-0 md:mx-2">OR</div>

                        <label
                          htmlFor="photo-upload"
                          className="w-full md:w-48 h-48 flex flex-col items-center justify-center rounded border-2 border-dashed border-gray-300 hover:bg-gray-50 transition duration-200 cursor-pointer"
                        >
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            className="w-10 h-10 text-gray-400 mb-2"
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                          >
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="17 8 12 3 7 8" />
                            <line x1="12" y1="3" x2="12" y2="15" />
                          </svg>
                          <span className="text-gray-500">Upload a Photo</span>
                          <input
                            id="photo-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleFileChange}
                            ref={fileInputRef}
                          />
                        </label>
                      </div>
                    )}
                  </div>
                )}

                {file && isHeicFile(file.name) && (
                  <div className="mb-4 p-3 bg-blue-100 text-blue-800 rounded">
                    Note: HEIC/HEIF image detected. This format will be automatically converted for processing.
                  </div>
                )}

                {!isCameraOpen && (
                  <div className="flex justify-center space-x-4 mt-6">
                    <button
                      onClick={handleAnalyze}
                      disabled={!file}
                      className={`px-6 py-3 rounded-lg font-medium ${
                        file
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      Analyze & View Matches
                    </button>
                    {file && (
                      <button
                        onClick={handleReset}
                        className="px-6 py-3 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}