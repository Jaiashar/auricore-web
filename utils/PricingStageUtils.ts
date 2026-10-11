// Utility functions for mapping between different stage formats

import { DetailedStage } from "@/components/DetailedPricingProgress";

// Simple stage types used in existing components
export type SimpleStage = 
  | 'initializing' 
  | 'searching' 
  | 'analyzing' 
  | 'calculating' 
  | 'calculating-data'
  | 'calculating-offer'
  | 'calculating-range'
  | 'finalizing' 
  | 'complete';

// API stage types from backend
export type ApiStage =
  | 'initializing'
  | 'searching'
  | 'analyzing'
  | 'retrieving'
  | 'processing'
  | 'evaluating'
  | 'comparing'
  | 'calculating'
  | 'finalizing'
  | 'complete';

/**
 * Maps a simple stage to a detailed stage
 */
export function mapSimpleToDetailed(simpleStage: SimpleStage): DetailedStage {
  const stageMap: Record<SimpleStage, DetailedStage> = {
    'initializing': 'initializing',
    'searching': 'searching',
    'analyzing': 'analyzing',
    'calculating-data': 'data-collection',
    'calculating-offer': 'offer-calculation',
    'calculating-range': 'range-determination',
    'calculating': 'offer-calculation', // Map the generic "calculating" to offer calculation
    'finalizing': 'finalizing',
    'complete': 'complete'
  };
  
  return stageMap[simpleStage] || 'initializing';
}

/**
 * Maps an API stage to a detailed stage
 */
export function mapApiToDetailed(apiStage: ApiStage): DetailedStage {
  const stageMap: Record<ApiStage, DetailedStage> = {
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
  
  return stageMap[apiStage] || 'initializing';
}

/**
 * Maps a detailed stage to percentage of completion
 */
export function getStagePercentage(stage: DetailedStage, progress: number = 50): number {
  // Base percentages for each stage to create a sense of progression
  const stageBasePercentages: Record<DetailedStage, number> = {
      'initializing': 0,
      'searching': 10,
      'analyzing': 20,
      'data-collection': 30,
      'data-processing': 40,
      'condition-evaluation': 50,
      'market-comparison': 60,
      'offer-calculation': 70,
      'range-determination': 80,
      'finalizing': 90,
      'complete': 100,
      error: 0
  };
  
  const basePercentage = stageBasePercentages[stage] || 0;
  const nextStagePercentage = stageBasePercentages[getNextStage(stage)] || 100;
  
  // Calculate percentage within the current stage
  const stageWidth = nextStagePercentage - basePercentage;
  return Math.min(100, basePercentage + (stageWidth * (progress / 100)));
}

/**
 * Gets the next stage in the progression
 */
function getNextStage(stage: DetailedStage): DetailedStage {
  const stageOrder: DetailedStage[] = [
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
    'complete'
  ];
  
  const currentIndex = stageOrder.indexOf(stage);
  if (currentIndex === -1 || currentIndex === stageOrder.length - 1) {
    return 'complete';
  }
  
  return stageOrder[currentIndex + 1];
}

/**
 * Formats remaining time in mm:ss format
 */
export function formatRemainingTime(seconds: number): string {
  if (seconds < 0) return '00:00';
  
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

/**
 * Returns a user-friendly description of remaining time
 */
export function getRemainingTimeText(seconds: number | null): string {
  if (seconds === null) return 'Calculating...';
  
  if (seconds < 30) return 'Just a few moments...';
  if (seconds < 60) return 'Less than a minute remaining';
  
  const mins = Math.ceil(seconds / 60);
  return `About ${mins} ${mins === 1 ? 'minute' : 'minutes'} remaining`;
}