'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Clock, CheckCircle, DollarSign, Database, BrainCircuit, Search, BarChart4, Calculator, AlertCircle } from 'lucide-react';
import { onSnapshot, doc, getFirestore } from 'firebase/firestore';

export type DetailedStage =
  | 'initializing'
  | 'searching'
  | 'analyzing'
  | 'data-collection'
  | 'data-processing'
  | 'condition-evaluation'
  | 'market-comparison'
  | 'offer-calculation'
  | 'range-determination'
  | 'finalizing'
  | 'complete'
  | 'error';

interface DetailedPricingProgressProps {
  applicationId: string;
  itemId: string;
  autoAdvance?: boolean;
  stageOverrides?: Record<DetailedStage, { duration?: number; weight?: number }>;
  
  // Add debug/fallback props
  stage?: DetailedStage;
  progress?: number;
  elapsedTime?: number;
  isConnected?: boolean; // For debugging Firebase connection
}

const DetailedPricingProgress: React.FC<DetailedPricingProgressProps> = ({
  applicationId,
  itemId,
  autoAdvance = false,
  stageOverrides = {},
  
  // Fallback props
  stage: fallbackStage,
  progress: fallbackProgress,
  elapsedTime: fallbackElapsedTime,
  isConnected = true,
}) => {
  const [currentStage, setCurrentStage] = useState<DetailedStage>('initializing');
  const [stageProgress, setStageProgress] = useState<number>(0);
  const [overallProgress, setOverallProgress] = useState<number>(0);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [stageMessage, setStageMessage] = useState<string>('');
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [connectionError, setConnectionError] = useState<string>('');

  // Debug state - keeping but no longer displaying
  const [lastUpdate, setLastUpdate] = useState<string>('');

  // Define all stages with their details
  const defaultStages: Record<DetailedStage, {
    title: string;
    description: string;
    icon: React.ReactNode;
    duration: number;
    weight: number;
  }> = {
    initializing: {
      title: 'Initializing',
      description: 'Setting up pricing analysis',
      icon: <Database className="h-4 w-4" />,
      duration: 3,
      weight: 5,
    },
    searching: {
      title: 'Finding Comparable Items',
      description: 'Searching marketplace for similar products',
      icon: <Search className="h-4 w-4" />,
      duration: 8,
      weight: 15,
    },
    analyzing: {
      title: 'Analyzing Market Data',
      description: 'Evaluating current market trends',
      icon: <BrainCircuit className="h-4 w-4" />,
      duration: 6,
      weight: 10,
    },
    'data-collection': {
      title: 'Collecting Price Data',
      description: 'Gathering pricing points from all sources',
      icon: <BarChart4 className="h-4 w-4" />,
      duration: 5,
      weight: 10,
    },
    'data-processing': {
      title: 'Processing Market Data',
      description: 'Normalizing and filtering price points',
      icon: <BrainCircuit className="h-4 w-4" />,
      duration: 4,
      weight: 5,
    },
    'condition-evaluation': {
      title: 'Evaluating Condition',
      description: 'Applying condition-based adjustments',
      icon: <BrainCircuit className="h-4 w-4" />,
      duration: 7,
      weight: 10,
    },
    'market-comparison': {
      title: 'Market Comparison',
      description: 'Comparing to recent sales and listings',
      icon: <BarChart4 className="h-4 w-4" />,
      duration: 6,
      weight: 10,
    },
    'offer-calculation': {
      title: 'Calculating Base Offer',
      description: 'Determining initial offer value',
      icon: <Calculator className="h-4 w-4" />,
      duration: 12,
      weight: 15,
    },
    'range-determination': {
      title: 'Determining Offer Range',
      description: 'Finalizing your personalized price range',
      icon: <DollarSign className="h-4 w-4" />,
      duration: 8,
      weight: 15,
    },
    finalizing: {
      title: 'Finalizing Results',
      description: 'Preparing your complete pricing analysis',
      icon: <Clock className="h-4 w-4" />,
      duration: 4,
      weight: 5,
    },
    complete: {
      title: 'Processing Complete',
      description: 'Your offer is ready to view',
      icon: <CheckCircle className="h-4 w-4" />,
      duration: 0,
      weight: 0,
    },
    error: {
      title: 'Error',
      description: 'An error occurred during processing',
      icon: <AlertCircle className="h-4 w-4" />,
      duration: 0,
      weight: 0,
    },
  };

  // Apply any overrides
  const stages = useMemo(() => {
    return (Object.keys(defaultStages) as DetailedStage[]).reduce((acc, stage) => {
      acc[stage] = {
        ...defaultStages[stage],
        ...(stageOverrides[stage] || {}),
      };
      return acc;
    }, {} as typeof defaultStages);
  }, [stageOverrides]);

  // List of stages in process order
  const stageOrder = useMemo<DetailedStage[]>(
    () => [
      'initializing',
      'searching',
      'analyzing',
      'data-collection',
      'data-processing',
      'condition-evaluation',
      'market-comparison',
      'offer-calculation',
      'range-determination',
      'finalizing',
      'complete',
    ],
    []
  );

  // Type guard for stage validation
  const isValidStage = (stage: any): stage is DetailedStage => {
    const validStages: DetailedStage[] = [
      'initializing',
      'searching',
      'analyzing',
      'data-collection',
      'data-processing',
      'condition-evaluation',
      'market-comparison',
      'offer-calculation',
      'range-determination',
      'finalizing',
      'complete',
      'error'
    ];
    
    return validStages.includes(stage);
  };

  // Safe stage info getter
  const getStageInfo = (stage: string) => {
    // First check if it's a valid stage
    if (isValidStage(stage) && stages[stage]) {
      return stages[stage];
    }
    
    // Fallback for unknown stages
    console.warn(`Unknown or invalid stage: ${stage}. Using default.`);
    
    // Try to create a reasonable title from the stage name
    const title = stage
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    return {
      title: title || 'Processing',
      description: 'Processing...',
      icon: <BrainCircuit className="h-4 w-4" />,
      duration: 0,
      weight: 0
    };
  };

  // Listen to Firebase updates for real-time progress with enhanced debugging
  useEffect(() => {
    if (!applicationId || !itemId || autoAdvance || !isConnected) {
      setIsLoading(false);
      console.log('Skipping Firebase subscription:', { applicationId, itemId, autoAdvance, isConnected });
      return;
    }
  
    console.log(`🔥 Setting up Firebase subscription for ${applicationId}/${itemId}`);
  
    try {
      const db = getFirestore();
      const appRef = doc(db, 'applications', applicationId);
  
      const unsubscribe = onSnapshot(
        appRef,
        {
          includeMetadataChanges: true  // This helps catch all updates
        },
        (doc) => {
          console.group(`🔔 Firebase update for ${itemId} (${new Date().toISOString()})`);
          console.log('Document exists:', doc.exists());
          console.log('From cache:', doc.metadata.fromCache);
          console.log('Has pending writes:', doc.metadata.hasPendingWrites);
          
          setLastUpdate(new Date().toISOString());
          
          if (!doc.exists()) {
            console.warn('❌ Application document does not exist');
            setConnectionError('Document not found');
            setIsLoading(false);
            console.groupEnd();
            return;
          }
  
          const data = doc.data();
          console.log('📄 Full document data keys:', Object.keys(data));
          
          // Get item-specific progress data with detailed logging
          const stageKey = `pricingItemStage.${itemId}`;
          const progressKey = `pricingItemProgress.${itemId}`;
          const messageKey = `pricingItemMessage.${itemId}`;
          const startTimeKey = `pricingItemStartTime.${itemId}`;
          const errorKey = `pricingItemError.${itemId}`;
          const statusKey = `pricingItemStatus.${itemId}`;
          
          console.log('🔍 Looking for keys:', {
            stageKey,
            progressKey,
            messageKey,
            startTimeKey,
            errorKey,
            statusKey
          });
          
          const stage = data[stageKey];
          const progress = data[progressKey];
          const message = data[messageKey];
          const itemStartTime = data[startTimeKey];
          const error = data[errorKey];
          const status = data[statusKey];
  
          console.log('📊 Current values:', {
            stage,
            progress,
            message,
            itemStartTime,
            error,
            status
          });
          
          console.log('📊 Previous values:', {
            currentStage,
            stageProgress,
            stageMessage,
            startTime: new Date(startTime).toISOString(),
            errorMessage,
            isLoading
          });
  
          // Update state based on Firebase data with detailed logging
          if (stage !== undefined) {
            if (stage !== currentStage) {
              console.log(`🔄 Stage changed: ${currentStage} → ${stage}`);
              
              // Validate the stage before setting it
              if (isValidStage(stage)) {
                setCurrentStage(stage);
              } else {
                console.warn(`Invalid stage received from Firebase: ${stage}`);
                console.warn(`Valid stages are:`, [
                  'initializing', 'searching', 'analyzing', 'data-collection',
                  'data-processing', 'condition-evaluation', 'market-comparison',
                  'offer-calculation', 'range-determination', 'finalizing', 'complete', 'error'
                ]);
                // Don't update the stage if it's invalid
              }
            } else {
              console.log(`✨ Stage unchanged: ${stage}`);
            }
          } else {
            console.log(`❌ No stage data found for key: ${stageKey}`);
          }
          
          if (typeof progress === 'number') {
            if (progress !== stageProgress) {
              console.log(`📈 Progress changed: ${stageProgress}% → ${progress}%`);
              setStageProgress(progress);
            } else {
              console.log(`✨ Progress unchanged: ${progress}%`);
            }
          } else {
            console.log(`❌ No progress data found for key: ${progressKey} (value: ${progress})`);
          }
          
          if (message) {
            if (message !== stageMessage) {
              console.log(`💬 Message changed: "${stageMessage}" → "${message}"`);
              setStageMessage(message);
            } else {
              console.log(`✨ Message unchanged: "${message}"`);
            }
          }
  
          if (error) {
            console.error('❌ Pricing error:', error);
            setErrorMessage(error);
            setCurrentStage('error');
          }
  
          // Update start time if available
          if (itemStartTime && typeof itemStartTime === 'string') {
            const newStartTime = new Date(itemStartTime).getTime();
            if (newStartTime !== startTime) {
              console.log(`🕐 Start time updated: ${new Date(startTime).toISOString()} → ${new Date(newStartTime).toISOString()}`);
              setStartTime(newStartTime);
            }
          }
          
          // Set loading to false once we have data
          if (isLoading) {
            console.log('✅ Setting isLoading to false');
            setIsLoading(false);
          }
          
          setConnectionError('');
          console.groupEnd();
        }, 
        (error) => {
          console.error('❌ Firebase subscription error:', error);
          setIsLoading(false);
          setConnectionError(error.message);
          setErrorMessage('Unable to load pricing progress');
        }
      );
  
      // Log that subscription is set up
      console.log(`✅ Firebase subscription established for ${applicationId}/${itemId}`);
  
      return () => {
        console.log(`🔌 Cleaning up Firebase subscription for ${applicationId}/${itemId}`);
        unsubscribe();
      };
    } catch (error: any) {
      console.error('❌ Error setting up Firebase subscription:', error);
      setIsLoading(false);
      setConnectionError(error.message);
    }
  }, [applicationId, itemId, autoAdvance, isConnected, currentStage, stageProgress, stageMessage, startTime, errorMessage, isLoading]);

  // Fallback to props if Firebase isn't working
  useEffect(() => {
    if (fallbackStage !== undefined && (!isConnected || connectionError)) {
      console.log('Setting fallback stage:', fallbackStage);
      if (isValidStage(fallbackStage)) {
        setCurrentStage(fallbackStage);
      }
      setIsLoading(false);
    }
  }, [fallbackStage, isConnected, connectionError]);

  useEffect(() => {
    if (fallbackProgress !== undefined && (!isConnected || connectionError)) {
      setStageProgress(fallbackProgress);
    }
  }, [fallbackProgress, isConnected, connectionError]);

  useEffect(() => {
    if (fallbackElapsedTime !== undefined && (!isConnected || connectionError)) {
      setElapsedTime(fallbackElapsedTime);
    }
  }, [fallbackElapsedTime, isConnected, connectionError]);

  // Timer for elapsed time with improved calculation
  useEffect(() => {
    const timer = setInterval(() => {
      const currentTime = Date.now();
      const elapsed = Math.floor((currentTime - startTime) / 1000);
      
      // Only update if the elapsed time has actually changed
      if (elapsed !== elapsedTime) {
        setElapsedTime(elapsed);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [startTime, elapsedTime]);

  // Calculate overall progress based on stage and stage progress
  useEffect(() => {
    const stageIndex = stageOrder.indexOf(currentStage);
    if (stageIndex === -1 || currentStage === 'error') return;

    // Calculate overall progress based on completed stages and current stage progress
    const completedStagesWeight = stageIndex * (100 / stageOrder.length);
    const currentStageWeight = (stageProgress / 100) * (100 / stageOrder.length);
    
    const totalProgress = completedStagesWeight + currentStageWeight;
    const newProgress = Math.min(99.9, totalProgress);
    
    // Only update if the progress has actually changed
    if (Math.abs(newProgress - overallProgress) > 0.1) {
      setOverallProgress(newProgress);
    }
  }, [currentStage, stageProgress, stageOrder, overallProgress]);

  // Format time as mm:ss
  const formatTime = (seconds: number): string => {
    if (isNaN(seconds) || !isFinite(seconds)) return '00:00';

    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Get remaining time text
  const getRemainingTimeText = (): string => {
    if (isLoading) return 'Loading...';
    if (currentStage === 'complete') return 'Complete';
    if (currentStage === 'error') return 'Error occurred';
    if (elapsedTime < 5) return 'Starting...';
    
    // Estimate based on typical completion time
    const avgCompletionTime = 60;
    const remainingTime = Math.max(0, avgCompletionTime - elapsedTime);
    
    if (remainingTime < 30) return 'Just a few moments...';
    if (remainingTime < 60) return 'Less than a minute remaining';

    const mins = Math.ceil(remainingTime / 60);
    return `About ${mins} ${mins === 1 ? 'minute' : 'minutes'} remaining`;
  };

  // Group stages for display
  const stageGroups = [
    {
      title: 'Initial Analysis',
      stages: ['initializing', 'searching', 'analyzing'] as DetailedStage[],
    },
    {
      title: 'Data Processing',
      stages: ['data-collection', 'data-processing', 'condition-evaluation', 'market-comparison'] as DetailedStage[],
    },
    {
      title: 'Offer Calculation',
      stages: ['offer-calculation', 'range-determination', 'finalizing'] as DetailedStage[],
    },
  ];

  // Find the current stage's group index
  const currentGroupIdx = stageGroups.findIndex((group) =>
    group.stages.includes(currentStage)
  );

  // Get current stage info safely
  const currentStageInfo = getStageInfo(currentStage);

  // Loading state with more info
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading pricing progress...</p>
        </div>
      </div>
    );
  }

  // Connection error state
  if (connectionError && !currentStage) {
    return (
      <div className="bg-white rounded-lg border border-red-200 overflow-hidden">
        <div className="bg-red-50 p-4 border-b border-red-100">
          <div className="flex items-center justify-center">
            <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
            <h3 className="text-base font-medium text-red-800">Connection Error</h3>
          </div>
        </div>
        <div className="p-4">
          <p className="text-sm text-red-700">
            Unable to connect to pricing data. Please refresh and try again.
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (currentStage === 'error') {
    return (
      <div className="bg-white rounded-lg border border-red-200 overflow-hidden">
        <div className="bg-red-50 p-4 border-b border-red-100">
          <div className="flex items-center justify-center">
            <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
            <h3 className="text-base font-medium text-red-800">Processing Error</h3>
          </div>
        </div>
        <div className="p-4">
          <p className="text-sm text-red-700">
            {errorMessage || 'An error occurred while processing your item. Please try again.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Overall Progress Header */}
      <div className="bg-blue-50 p-3 sm:p-4 border-b border-blue-100">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm sm:text-base font-medium text-blue-800">Calculating Your Offer</h3>
          <div className="text-xs sm:text-sm font-medium text-blue-700">
            {currentStage === 'complete' ? '100' : Math.round(overallProgress)}%
          </div>
        </div>

        {/* Overall Progress Bar */}
        <div className="w-full bg-blue-100 rounded-full h-2 sm:h-2.5 mb-2">
          <div
            className="bg-blue-600 h-2 sm:h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${currentStage === 'complete' ? 100 : overallProgress}%` }}
          />
        </div>

        <div className="flex justify-between text-xs text-blue-600">
          <span>Time elapsed: {formatTime(elapsedTime)}</span>
          <span>{getRemainingTimeText()}</span>
        </div>
      </div>

      {/* Current Stage Highlight */}
      <div className="p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-white border-b border-gray-100">
        <div className="flex items-center">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-100 flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
            {currentStageInfo.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs sm:text-sm font-medium text-blue-700 truncate">{currentStageInfo.title}</h4>
            <p className="text-xs text-blue-600 truncate">
              {stageMessage || currentStageInfo.description}
            </p>
          </div>
          <div className="ml-2 flex-shrink-0">
            <span className="text-xs sm:text-sm font-medium text-blue-700">
              {currentStage === 'complete' ? '100' : Math.round(stageProgress)}%
            </span>
          </div>
        </div>

        {/* Current stage progress bar */}
        {currentStage !== 'complete' && (
          <div className="w-full bg-blue-100 rounded-full h-1 sm:h-1.5 mt-2 sm:mt-3">
            <div
              className="bg-blue-500 h-1 sm:h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${stageProgress}%` }}
            />
          </div>
        )}
      </div>

      {/* Stage Groups */}
      <div className="p-3 sm:p-4">
        {stageGroups.map((group, groupIdx) => {
          const isActiveGroup = groupIdx === currentGroupIdx;
          const isCompletedGroup = groupIdx < currentGroupIdx || currentStage === 'complete';

          return (
            <div
              key={group.title}
              className={`mb-3 sm:mb-4 p-2 sm:p-3 rounded-lg border ${
                isActiveGroup
                  ? 'bg-blue-50 border-blue-100'
                  : isCompletedGroup
                  ? 'bg-green-50 border-green-100'
                  : 'bg-gray-50 border-gray-100'
              }`}
            >
              <h4
                className={`text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 ${
                  isActiveGroup
                    ? 'text-blue-700'
                    : isCompletedGroup
                    ? 'text-green-700'
                    : 'text-gray-500'
                }`}
              >
                {group.title}
              </h4>

              <div className="space-y-1.5 sm:space-y-2.5">
                {group.stages.map((stageKey) => {
                  const stageInfo = getStageInfo(stageKey);
                  const stageIdx = stageOrder.indexOf(stageKey);
                  const activeIdx = stageOrder.indexOf(currentStage);

                  const isCompleted = stageIdx < activeIdx || currentStage === 'complete';
                  const isActive = stageKey === currentStage;
                  const isPending = stageIdx > activeIdx && currentStage !== 'complete';

                  return (
                    <div
                      key={stageKey}
                      className={`flex items-center ${
                        isActive ? 'opacity-100' : isCompleted ? 'opacity-90' : 'opacity-50'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center mr-1.5 sm:mr-2 flex-shrink-0 ${
                          isCompleted
                            ? 'bg-green-100 text-green-600'
                            : isActive
                            ? 'bg-blue-100 text-blue-600'
                            : 'bg-gray-100 text-gray-400'
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                        ) : isActive ? (
                          stageInfo.icon
                        ) : isPending ? (
                          <div className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-gray-300" />
                        ) : (
                          stageInfo.icon
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-2xs sm:text-xs font-medium truncate">{stageInfo.title}</div>
                        {isActive && currentStage !== 'complete' && (
                          <div className="mt-1 w-full bg-blue-100 rounded-full h-0.5 sm:h-1">
                            <div
                              className="bg-blue-600 h-0.5 sm:h-1 rounded-full transition-all duration-300"
                              style={{ width: `${stageProgress}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Estimated Completion */}
        {currentStage !== 'complete' && (
          <div className="text-center text-2xs sm:text-xs text-gray-500 mt-2">
            <Clock className="inline-block h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
            {getRemainingTimeText()}
          </div>
        )}
      </div>
    </div>
  );
};

export default DetailedPricingProgress;