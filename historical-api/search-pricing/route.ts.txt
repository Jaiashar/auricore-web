// app/api/search-pricing/route.ts

import { NextRequest, NextResponse } from 'next/server';
import {
  fetchAndAnalyzePricingWithClaude,
  callWithTimeout,
} from '@/utils/claudePricingService';
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
  DocumentSnapshot,
  DocumentData,
  deleteField,
  setDoc,
} from 'firebase/firestore';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';

/* ================================
   Configuration
   ================================ */
const CONFIG = {
  PRICING_TIMEOUT_MS: 60_000,
  BACKGROUND_TIMEOUT_WARNING: 45_000,
  DB_OPERATION_TIMEOUT: 10_000,
  MAX_RETRY_ATTEMPTS: 2,
  RETRY_DELAY_MS: 3_000,
  STALLED_PROCESS_THRESHOLD: 300_000,
};

// Add metals API integration
const METALS_API_CONFIG = {
  API_BASE_URL: 'https://api.metals.dev/v1',
  API_KEY: process.env.METALS_API_KEY || 'YOUR_API_KEY_HERE',
  OFFER_RANGE: {
    // Standard ranges for regular items
    STD_LOW_PERCENTAGE: 0.60,  // 60% of market value
    STD_HIGH_PERCENTAGE: 0.70, // 70% of market value
    // Higher ranges specifically for precious metals
    PM_LOW_PERCENTAGE: 0.70,   // 70% of market value
    PM_HIGH_PERCENTAGE: 0.80   // 80% of market value
  },
  // Cast to allow indexing by arbitrary lowercase strings without TS error
  METAL_MAPPINGS: {
    gold: 'gold',
    silver: 'silver',
    platinum: 'platinum',
    palladium: 'palladium',
    other: 'gold' // Default to gold for "other" types
  } as Record<string, string>,
};

/* ================================
   Type Definitions
   ================================ */
interface SelectedMatch {
  title?: string;
  originalItem?: Record<string, any>;
  [key: string]: any;
}

interface ApplicationData {
  selectedMatch?: SelectedMatch;
  selectedMatches?: Record<string, SelectedMatch>;
  items?: Array<Record<string, any> & { id: string }>;
  pricingData?: Record<string, any>;
  pricingItemStatus?: Record<string, string>;
  pricingItemStartTime?: Record<string, string>;
  pricingItemEndTime?: Record<string, string>;
  pricingItemError?: Record<string, string>;
  pricingItemStage?: Record<string, string>;
  pricingItemProgress?: Record<string, number>;
  pricingItemMessage?: Record<string, string>;
  pricingStartedAt?: string;
  [key: string]: any;
}

interface PricingData {
  executionTimeMs?: number;
  marketValue?: number;
  disbursedAmount?: number;
  confidence?: string;
  dataPoints?: number;
  marketValueRange?: { low: number; high: number };
  offerAmountRange?: { low: number; high: number };
  error?: string;
  errorType?: string;
  metalType?: string;
  pureTroyOunces?: number;
  purityDecimal?: number;
  spotPrice?: number;
  spotPriceTimestamp?: string;
  insights?: any[];
  [key: string]: any;
}

interface RequestBody {
  query?: string;
  category?: string;
  matchTitle?: string;
  applicationId?: string;
  updatedItem?: Record<string, any>;
  itemId?: string;
  backgroundProcessing?: boolean;
  forcePricing?: boolean;
  metalType?: string;
  form?: string;
  weightValue?: string;
  weightUnit?: string;
  purity?: string;
  isPreciousMetal?: boolean;
}

// Define the ProgressCallback type with proper typing
type ProgressCallback = (stage: string, percentage: number, details?: {
  message?: string;
  currentStep?: string;
  data?: any;
}) => Promise<void>;

/* ================================
   Firebase Init Helpers
   ================================ */
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
};

function getFirebaseApp(): FirebaseApp {
  return getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
}

function getFirebaseFirestore() {
  return getFirestore(getFirebaseApp());
}

/* ================================
   Data Sanitization
   ================================ */
function sanitizeForFirestore(data: Record<string, any>): Record<string, any> {
  const clean: Record<string, any> = {};
  for (const [k, v] of Object.entries(data)) {
    if (v === undefined) continue;
    if (Array.isArray(v)) clean[k] = v.filter((i) => i !== undefined);
    else if (v !== null && typeof v === 'object')
      clean[k] = sanitizeForFirestore(v);
    else clean[k] = v;
  }
  return clean;
}

/* ================================
   Timer Utility
   ================================ */
class OperationTimer {
  private timeoutId: NodeJS.Timeout;
  private startTime = Date.now();
  constructor(
    private name: string,
    warnMs: number = CONFIG.BACKGROUND_TIMEOUT_WARNING
  ) {
    console.log(`⏱️ Starting ${name}`);
    this.timeoutId = setTimeout(() => {
      console.warn(`⚠️ POTENTIAL HANG: ${name} >${warnMs / 1000}s`);
    }, warnMs);
  }
  end(): number {
    clearTimeout(this.timeoutId);
    const d = Date.now() - this.startTime;
    console.log(`✅ ${this.name} done in ${d}ms`);
    return d;
  }
}

/* ================================
   Stalled Check
   ================================ */
function isPricingStalled(start?: string): boolean {
  if (!start) return false;
  return (
    Date.now() - new Date(start).getTime() >
    CONFIG.STALLED_PROCESS_THRESHOLD
  );
}

/* ================================
   Progress Tracking Helper
   ================================ */
class ProgressTracker {
  private stageRanges: Record<string, { start: number; end: number; weight: number }> = {
    'initializing': { start: 0, end: 5, weight: 5 },
    'searching': { start: 5, end: 20, weight: 15 },
    'analyzing': { start: 20, end: 30, weight: 10 },
    'data-collection': { start: 30, end: 40, weight: 10 },
    'data-processing': { start: 40, end: 45, weight: 5 },
    'condition-evaluation': { start: 45, end: 55, weight: 10 },
    'market-comparison': { start: 55, end: 65, weight: 10 },
    'offer-calculation': { start: 65, end: 80, weight: 15 },
    'range-determination': { start: 80, end: 95, weight: 15 },
    'finalizing': { start: 95, end: 100, weight: 5 },
    'complete': { start: 100, end: 100, weight: 0 },
    'error': { start: 0, end: 0, weight: 0 }
  };

  calculateProgress(stage: string, stageProgress: number = 0): number {
    const range = this.stageRanges[stage];
    if (!range) {
      console.warn(`Unknown stage: ${stage}, defaulting to 0%`);
      return 0;
    }
    
    // Ensure stageProgress is between 0 and 100
    const clampedProgress = Math.max(0, Math.min(100, stageProgress));
    
    // Calculate the overall progress
    const calculatedProgress = range.start + ((range.end - range.start) * clampedProgress / 100);
    
    console.log(`Progress calculation: stage=${stage}, stageProgress=${stageProgress}%, range=${range.start}-${range.end}, calculated=${calculatedProgress}%`);
    
    return Math.min(100, Math.max(0, calculatedProgress));
  }
  
  // Helper method to get all stages in order
  getStageOrder(): string[] {
    return [
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
  }
  
  // Helper to validate if a stage exists
  isValidStage(stage: string): boolean {
    return stage in this.stageRanges;
  }
}

const progressTracker = new ProgressTracker();

/* ================================
   Precious Metal Pricing Functions
   ================================ */
// Utility functions for weight conversion and calculation
function normalizeWeightToGrams(weightValue?: string, weightUnit?: string): number | null {
  if (!weightValue || !weightUnit) return null;
  const value = parseFloat(weightValue);
  if (isNaN(value) || value <= 0) return null;
  
  switch (weightUnit) {
    case 'g':   return value;
    case 'kg':  return value * 1000;
    case 'oz':  return value * 28.3495231;
    case 'ozt': return value * 31.1034768;
    default:    return value;
  }
}

function gramsToTroyOunces(grams: number): number {
  return grams / 31.1034768;
}

function getPurityDecimal(
  purityValue?: string,
  metalType?: string,
  categoryData?: Record<string, any>
): number | null {
  if (!purityValue || !metalType || !categoryData) return null;
  const purityField = categoryData.fields?.find((f: any) => f.id === 'purity');
  if (!purityField || !purityField.dynamicOptions) return null;
  const options = purityField.dynamicOptions[metalType] || purityField.dynamicOptions.default;
  const selected = options.find((o: any) => o.value === purityValue);
  return selected ? (selected as any).purityDecimal : null;
}

// Calculate pure metal weight
function calculatePureTroyOunces(item: Record<string, any>, categoryData: Record<string, any>): number | null {
  if (!item || item.category !== 'preciousMetals') return null;
  const { metalType, weightValue, weightUnit, purity } = item.dynamicFields || {};
  const grams = normalizeWeightToGrams(weightValue, weightUnit);
  const purityDecimal = getPurityDecimal(purity, metalType, categoryData);
  if (grams === null || purityDecimal === null) return null;
  return gramsToTroyOunces(grams * purityDecimal);
}

// Fetch metal price from API
async function fetchMetalPrice(metalType: string): Promise<any> {
  // Now allowed by TS because METAL_MAPPINGS is Record<string,string>
  const apiMetal = METALS_API_CONFIG.METAL_MAPPINGS[metalType.toLowerCase()] || 'gold';
  
  try {
    const url = `${METALS_API_CONFIG.API_BASE_URL}/metal/spot?api_key=${METALS_API_CONFIG.API_KEY}&metal=${apiMetal}&currency=USD`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`API returned status ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.status !== 'success' || !data.rate || typeof data.rate.price !== 'number') {
      throw new Error('Invalid response format from metals API');
    }
    
    return data;
  } catch (error: any) {
    console.error(`Error fetching ${metalType} price:`, error);
    throw error;
  }
}

// Process pricing for precious metals with proper progress tracking
async function processPreciousMetalsPricing(
  item: Record<string, any>,
  categoryData: Record<string, any>, 
  progressCallback?: ProgressCallback
): Promise<PricingData> {
  const startTime = Date.now();
  
  try {
    // Stage 1: Initializing (0-10%)
    if (progressCallback) {
      await progressCallback('initializing', 0, { message: 'Starting precious metals pricing...' });
    }
    
    // Extract data
    const { metalType, weightValue, weightUnit, purity } = item.dynamicFields || {};
    
    if (!metalType || !weightValue || !weightUnit || !purity) {
      throw new Error('Missing required precious metal data');
    }
    
    if (progressCallback) {
      await progressCallback('initializing', 50, { message: 'Validating metal specifications...' });
    }
    
    // Stage 2: Data Collection (10-45%)
    if (progressCallback) {
      await progressCallback('data-collection', 0, { message: `Collecting ${metalType} market data...` });
    }
    
    // Calculate pure metal weight
    const pureTroyOunces = calculatePureTroyOunces(item, categoryData);
    
    if (!pureTroyOunces) {
      throw new Error('Unable to calculate pure metal weight');
    }
    
    if (progressCallback) {
      await progressCallback('data-collection', 30, { 
        message: 'Calculated troy ounces',
        data: { pureTroyOunces: pureTroyOunces.toFixed(4) }
      });
    }
    
    // Fetch current spot price
    if (progressCallback) {
      await progressCallback('data-collection', 60, { message: 'Fetching current spot price...' });
    }
    
    const metalData = await fetchMetalPrice(metalType);
    const spotPrice = metalData.rate.price;
    
    if (progressCallback) {
      await progressCallback('data-collection', 90, { 
        message: 'Retrieved spot price',
        data: { spotPrice: `$${spotPrice.toFixed(2)}` }
      });
    }
    
    // Stage 3: Market Calculation (45-90%)
    if (progressCallback) {
      await progressCallback('offer-calculation', 0, { message: 'Calculating market value...' });
    }
    
    // Calculate market value
    const marketValue = pureTroyOunces * spotPrice;
    
    if (progressCallback) {
      await progressCallback('offer-calculation', 30, { 
        message: 'Market value calculated',
        data: { marketValue: `$${marketValue.toFixed(2)}` }
      });
    }
    
    // Calculate offer ranges
    const offerLow = marketValue * METALS_API_CONFIG.OFFER_RANGE.PM_LOW_PERCENTAGE;
    const offerHigh = marketValue * METALS_API_CONFIG.OFFER_RANGE.PM_HIGH_PERCENTAGE;
    
    if (progressCallback) {
      await progressCallback('offer-calculation', 70, { message: 'Determining offer range...' });
    }
    
    // Stage 4: Finalizing (90-100%)
    if (progressCallback) {
      await progressCallback('finalizing', 0, { message: 'Finalizing precious metal offer...' });
    }
    
    const result: PricingData = {
      marketValue,
      marketValueRange: {
        low: marketValue * 0.98,
        high: marketValue * 1.02
      },
      offerAmountRange: {
        low: Math.round(offerLow),
        high: Math.round(offerHigh)
      },
      disbursedAmount: Math.round((offerLow + offerHigh) / 2),
      confidence: 'High',
      dataPoints: 1,
      executionTimeMs: Date.now() - startTime,
      // include these for traceability
      metalType,
      pureTroyOunces,
      purityDecimal: getPurityDecimal(purity, metalType, categoryData) ?? undefined,
      spotPrice,
      spotPriceTimestamp: metalData.timestamp,
      insights: []
    };
    
    if (progressCallback) {
      await progressCallback('complete', 100, { message: 'Precious metal pricing complete!' });
    }
    
    return result;
  } catch (error: any) {
    console.error('Precious metal pricing error:', error);
    if (progressCallback) {
      await progressCallback('error', 0, { message: `Error: ${error.message}` });
    }
    
    return {
      marketValue: 0,
      disbursedAmount: 0,
      confidence: 'None',
      dataPoints: 0,
      executionTimeMs: Date.now() - startTime,
      error: error.message,
      errorType: 'processing'
    };
  }
}

/* ================================
   Regular Item Pricing with Claude
   ================================ */
async function processPricingWithTimeout(
  sel: SelectedMatch,
  orig: Record<string, any>,
  cat: Record<string, any>,
  progressCallback?: ProgressCallback,
  timeoutMs = CONFIG.PRICING_TIMEOUT_MS
): Promise<PricingData> {
  try {
    // Create a wrapped callback that maps internal stages to our standard stages
    const wrappedCallback = async (stage: string | number, pct: any) => {
      if (!progressCallback) return;
      
      console.log('wrappedCallback received:', { stage, pct });
      
      // Handle different types of stage values
      let normalizedStage: string;
      let normalizedProgress: number;
      
      if (typeof stage === 'number') {
        // If stage is a number, treat it as progress
        normalizedStage = 'analyzing';  // Default stage
        normalizedProgress = stage;
      } else {
        // Map Claude's internal stages to our standardized stages
        const stageMap: Record<string, string> = {
          'initializing': 'initializing',
          'searching': 'searching', 
          'analyzing': 'analyzing',
          'collecting': 'data-collection',
          'processing': 'data-processing',
          'evaluating': 'condition-evaluation',
          'comparing': 'market-comparison',
          'calculating': 'offer-calculation',
          'finalizing': 'range-determination',
          'complete': 'complete',
          // Add any other mappings that might be coming from Claude
          'fetching': 'searching',
          'computing': 'offer-calculation',
          'finishing': 'finalizing'
        };
        
        normalizedStage = stageMap[stage] || stage;  // Use original if no mapping found
        normalizedProgress = typeof pct === 'number' ? pct : 50;
      }
      
      console.log('Normalized:', { normalizedStage, normalizedProgress });
      
      // Calculate the overall progress based on the stage and percentage
      const overallProgress = progressTracker.calculateProgress(normalizedStage, normalizedProgress);
      
      console.log('Calling progressCallback with:', { normalizedStage, normalizedProgress });
      
      // Add stage details for better progress messages
      const stageDetails = {
        message: `Processing ${normalizedStage}...`,
        currentStep: normalizedStage,
        data: { stageProgress: normalizedProgress }
      };
      
      await progressCallback(normalizedStage, normalizedProgress, stageDetails);
    };
    
    // Initial progress - start at searching since initialization is done
    if (progressCallback) {
      await progressCallback('searching', 0, { message: 'Starting item analysis...' });
    }
    
    const callbackFn = () => fetchAndAnalyzePricingWithClaude(sel, orig, cat, wrappedCallback);
    const result = await callWithTimeout(
      callbackFn,
      timeoutMs,
      CONFIG.MAX_RETRY_ATTEMPTS,
      CONFIG.RETRY_DELAY_MS
    );
    
    const pricingResult = result as PricingData;

    // Ensure offer range is calculated
    if (pricingResult && !pricingResult.error && pricingResult.marketValue) {
      if (!pricingResult.offerAmountRange) {
        const mv = pricingResult.marketValue;
        pricingResult.offerAmountRange = {
          low: Math.round(mv * METALS_API_CONFIG.OFFER_RANGE.STD_LOW_PERCENTAGE),
          high: Math.round(mv * METALS_API_CONFIG.OFFER_RANGE.STD_HIGH_PERCENTAGE)
        };
        if (!pricingResult.disbursedAmount) {
          pricingResult.disbursedAmount = Math.round((pricingResult.offerAmountRange.low + pricingResult.offerAmountRange.high) / 2);
        }
      }
    }

    // Final progress update
    if (progressCallback) {
      await progressCallback('complete', 100, { message: 'Pricing analysis complete!' });
    }

    return pricingResult;
  } catch (e: any) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    console.error('Pricing error:', msg);
    
    if (progressCallback) {
      await progressCallback('error', 0, { message: `Error: ${msg}` });
    }
    
    return {
      marketValue: 0,
      disbursedAmount: 0,
      confidence: 'None',
      dataPoints: 0,
      error: msg,
      errorType: msg.includes('timed out') ? 'timeout' : 'processing'
    };
  }
}

// Standardize pricing data format
function standardizePricingData(pricingData: PricingData): PricingData {
  if (!pricingData.marketValue && pricingData.marketValueRange) {
    pricingData.marketValue = (pricingData.marketValueRange.low + pricingData.marketValueRange.high) / 2;
  }

  if (!pricingData.offerAmountRange && pricingData.marketValue) {
    const isPM = pricingData.metalType !== undefined || pricingData.pureTroyOunces !== undefined;
    const pct = isPM ? METALS_API_CONFIG.OFFER_RANGE.PM_LOW_PERCENTAGE : METALS_API_CONFIG.OFFER_RANGE.STD_LOW_PERCENTAGE;
    const pctHigh = isPM ? METALS_API_CONFIG.OFFER_RANGE.PM_HIGH_PERCENTAGE : METALS_API_CONFIG.OFFER_RANGE.STD_HIGH_PERCENTAGE;
    pricingData.offerAmountRange = {
      low: Math.round(pricingData.marketValue * pct),
      high: Math.round(pricingData.marketValue * pctHigh)
    };
  }

  if (!pricingData.disbursedAmount && pricingData.offerAmountRange) {
    pricingData.disbursedAmount = Math.round((pricingData.offerAmountRange.low + pricingData.offerAmountRange.high) / 2);
  }

  // Ensure insights is always an array
  pricingData.insights = pricingData.insights || [];
  
  return pricingData;
}

/* ================================
   Main Handler
   ================================ */
export async function POST(req: NextRequest): Promise<Response> {
  const start = Date.now();
  const mainTimer = new OperationTimer('PricingAPIHandler');

  let appId: string | undefined, itmId: string | undefined;

  try {
    const body = (await req.json()) as RequestBody;
    ({ applicationId: appId, itemId: itmId } = body);

    if (!appId || !itmId) {
      return NextResponse.json({ error: 'Missing IDs' }, { status: 400 });
    }

    const db = getFirebaseFirestore();
    const appRef = doc(db, 'applications', appId);



    // Replace your current progress callback with this enhanced version
const progressCallback: ProgressCallback = async (
  stage: string, 
  percentage: number, 
  details?: any
) => {
  console.log(`\n📝 PROGRESS CALLBACK STARTED`);
  console.log(`  Stage: ${stage}`);
  console.log(`  Percentage: ${percentage}`);
  console.log(`  Details:`, details);
  
  try {
    const timestamp = new Date().toISOString();
    
    // Use set with merge instead of update
    const updates = {
      [`pricingItemStage.${itmId}`]: stage,
      [`pricingItemProgress.${itmId}`]: percentage,
      [`pricingItemLastUpdate.${itmId}`]: timestamp
    };
    
    if (details?.message) {
      updates[`pricingItemMessage.${itmId}`] = details.message;
    }
    
    // Check if start time needs to be set
    const currentDoc = await getDoc(appRef);
    if (currentDoc.exists()) {
      const currentData = currentDoc.data() as ApplicationData;
      if (itmId && !currentData?.pricingItemStartTime?.[itmId]) {
        updates[`pricingItemStartTime.${itmId}`] = timestamp;
      }
    }
    
    // Try setDoc with merge instead of updateDoc
    await setDoc(appRef, updates, { merge: true });
    
    // Wait for propagation
    await new Promise(resolve => setTimeout(resolve, 150));
    
    // Verify the write
    const verifyDoc = await getDoc(appRef);
    if (verifyDoc.exists()) {
      const verifyData = verifyDoc.data();
      const verification = {
        stage: verifyData[`pricingItemStage.${itmId}`],
        progress: verifyData[`pricingItemProgress.${itmId}`],
        message: verifyData[`pricingItemMessage.${itmId}`],
        lastUpdate: verifyData[`pricingItemLastUpdate.${itmId}`]
      };
      
      // Check if all values match
      const stageMatch = verification.stage === stage;
      const progressMatch = verification.progress === percentage;
      
      if (!stageMatch || !progressMatch) {
        console.error(`  ❌ MISMATCH DETECTED!`);
        console.error(`    Stage: Expected ${stage}, Got ${verification.stage}`);
        console.error(`    Progress: Expected ${percentage}, Got ${verification.progress}`);
      } else {
        console.log(`  ✅ All values verified correctly`);
      }
    } else {
      console.error(`  ❌ Document doesn't exist after write!`);
    }
    
  } catch (error) {
    console.error(`\n❌ PROGRESS CALLBACK FAILED`);
    console.error('Error:', error);
    
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      
      if ('code' in error) {
        console.error('Error code:', (error as any).code);
      }
    }
    
    // Try one more time with a simplified write
    try {
      console.log('  🔄 Attempting fallback write...');
      
      const fallbackData = {
        [`fb_${stage}_${itmId}`]: percentage
      };
      
      await setDoc(appRef, fallbackData, { merge: true });
      console.log('  ✅ Fallback write successful');
    } catch (fallbackError) {
      console.error('  ❌ Fallback write also failed:', fallbackError);
    }
  }
  
  console.log(`📝 PROGRESS CALLBACK ENDED\n`);
};

const debugFirebaseAccess = async () => {
  
  try {
    // 1. Check if document exists
    const docSnapshot = await getDoc(appRef);
    
    if (docSnapshot.exists()) {
      const data = docSnapshot.data();      
      // Check for existing pricing fields
      const pricingKeys = Object.keys(data).filter(key => key.startsWith('pricing'));
      pricingKeys.forEach(key => {
      });

      const id = itmId ?? '';
      
      // Check for item-specific fields
      const itemKeys = Object
        .keys(data)
        .filter(key => key.includes(id));
      itemKeys.forEach(key => {
      });
    }
    
    // 2. Test write with detailed tracking
    
    const timestamp = new Date().toISOString();
    const testData = {
      [`debug_test_${Date.now()}`]: 'test_value',
      [`pricingItemStage.${itmId}`]: 'debug_test',
      [`pricingItemProgress.${itmId}`]: 99,
      [`pricingItemMessage.${itmId}`]: `Debug test at ${timestamp}`,
      [`pricingItemStartTime.${itmId}`]: timestamp
    };
        
    // Use set with merge instead of update
    await setDoc(appRef, testData, { merge: true });
    
    // Wait a moment for Firebase to propagate
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // 3. Verify write
    const verifySnapshot = await getDoc(appRef);
    
    if (verifySnapshot.exists()) {
      const verifyData = verifySnapshot.data();
      let successCount = 0;
      let failCount = 0;
      
      Object.entries(testData).forEach(([key, expectedValue]) => {
        const actualValue = verifyData[key];
        const matches = actualValue === expectedValue;
        
        if (matches) successCount++;
        else failCount++;
      });
      
      if (failCount > 0) {
        console.error(`\n❌ CRITICAL: ${failCount} fields failed to write!`);
        console.error('This indicates a Firebase issue, not a rules problem.');
      }
    } else {
      console.error('❌ Document does not exist after write attempt!');
    }
    
    // 4. Check Firebase configuration
    const app = getApp();
    
    const db = getFirestore(app);
    
    // 5. Test with alternative write method
    try {
      const altData = {
        'altTest': Date.now(),
        [`altPricingStage_${itmId}`]: 'alternative_test'
      };
      
      if (!appId) {
        throw new Error('Application ID is undefined');
      }
      await setDoc(doc(db, 'applications', appId), altData, { merge: true });
      
      if (!appId) {
        throw new Error('Application ID is undefined');
      }
    } catch (altError) {
      console.error('  ❌ Alternative write failed:', altError);
    }
    
    // 6. Network and connection status
    
  } catch (error) {
    console.error('\n❌ === DEBUG FAILED ===');
    console.error('Error:', error);
    
    if (error instanceof Error) {
      console.error('Error Name:', error.name);
      console.error('Error Message:', error.message);
      console.error('Error Stack:', error.stack);
    }
  }
  
};

// Add this call at the beginning of your POST handler
await debugFirebaseAccess();

    // Start progress tracking immediately
    await progressCallback('initializing', 0, { message: 'Starting pricing calculation...' });

    const applicationDoc = (await callWithTimeout(
      () => getDoc(appRef),
      CONFIG.DB_OPERATION_TIMEOUT,
      CONFIG.MAX_RETRY_ATTEMPTS,
      CONFIG.RETRY_DELAY_MS
    )) as DocumentSnapshot<DocumentData>;

    if (!applicationDoc.exists()) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const data = applicationDoc.data() as ApplicationData;

    await progressCallback('initializing', 20, { message: 'Validating application data...' });

    const stalled =
      data.pricingItemStatus?.[itmId] === 'processing' &&
      isPricingStalled(data.pricingItemStartTime?.[itmId]);

    if (data.pricingData?.[itmId] && !body.forcePricing) {
      return NextResponse.json({
        ...(data.pricingData[itmId]),
        success: true,
        cached: true,
        itemId: itmId,
      });
    }

    if (
      data.pricingItemStatus?.[itmId] === 'processing' &&
      !stalled &&
      !body.forcePricing
    ) {
      const ts = data.pricingItemStartTime?.[itmId]
        ? new Date(data.pricingItemStartTime[itmId]).getTime()
        : 0;
      const elapsed = Date.now() - ts;
      return NextResponse.json({
        success: true,
        status: 'processing',
        elapsedTimeMs: elapsed,
        itemId: itmId,
      });
    }

    await progressCallback('initializing', 50, { message: 'Loading item data...' });

    const originalItem =
      body.updatedItem || data.items?.find((i) => i.id === itmId) || null;
    if (!originalItem) {
      return NextResponse.json(
        { error: `Item ${itmId} not found` },
        { status: 404 }
      );
    }

    let sel: SelectedMatch = { title: body.matchTitle || 'Unknown' };
    if (data.selectedMatches?.[itmId]) sel = data.selectedMatches[itmId];
    else if (data.selectedMatch) sel = data.selectedMatch;

    await progressCallback('initializing', 70, { message: 'Loading category data...' });

    let catData: Record<string, any> = {};
    const catId = body.category || originalItem.category || '';
    if (catId) {
      const catSnap = (await callWithTimeout(
        () => getDoc(doc(db, 'categories', catId)),
        CONFIG.DB_OPERATION_TIMEOUT,
        CONFIG.MAX_RETRY_ATTEMPTS,
        CONFIG.RETRY_DELAY_MS
      )) as DocumentSnapshot<DocumentData>;
      if (catSnap.exists()) catData = catSnap.data()!;
    }

    await progressCallback('initializing', 90, { message: 'Updating status...' });

    if (body.forcePricing || stalled) {
      await updateDoc(appRef, {
        [`pricingItemStatus.${itmId}`]: 'pending',
        [`pricingItemStartTime.${itmId}`]: null,
        [`pricingItemError.${itmId}`]: null,
      });
    }

    // Initialize all status fields at once
    await updateDoc(appRef, {
      pricingStatus: 'in_progress',
      pricingStartedAt: data.pricingStartedAt || new Date().toISOString(),
      [`pricingItemStatus.${itmId}`]: 'processing',
      [`pricingItemStartTime.${itmId}`]: new Date().toISOString(),
      [`pricingItemStage.${itmId}`]: 'initializing',
      [`pricingItemProgress.${itmId}`]: 0,
    });

    await progressCallback('initializing', 100, { message: 'Initialization complete' });

    // Determine if it's precious metal and call appropriate function
    const isPreciousMetal =
      body.isPreciousMetal ||
      originalItem.category === 'preciousMetals' ||
      originalItem.isPreciousMetal;

    let pricingData: PricingData;
    
    if (isPreciousMetal) {
      pricingData = await processPreciousMetalsPricing(
        originalItem,
        catData,
        progressCallback
      );
    } else {
      pricingData = await processPricingWithTimeout(
        sel,
        originalItem,
        catData,
        progressCallback
      );
    }

    pricingData = standardizePricingData(pricingData);

    await updateDoc(appRef, {
      [`pricingData.${itmId}`]: sanitizeForFirestore(pricingData),
      [`pricingItemStatus.${itmId}`]: pricingData.error ? 'error' : 'complete',
      [`pricingItemEndTime.${itmId}`]: new Date().toISOString(),
      [`pricingItemStage.${itmId}`]: pricingData.error ? 'error' : 'complete',
      [`pricingItemProgress.${itmId}`]: pricingData.error ? 0 : 100,
    });

    // Final completion check
    const upd = await getDoc(appRef);
    if (upd.exists()) {
      const updatedData = upd.data() as ApplicationData;
      const total = updatedData.items?.length || 0;
      const done = Object.keys(updatedData.pricingData || {}).length;
      if (total > 0 && done === total) {
        await updateDoc(appRef, {
          pricingStatus: 'complete',
          pricingCompletedAt: new Date().toISOString(),
        });
      }
    }

    mainTimer.end();
    return NextResponse.json({
      ...pricingData,
      success: true,
      itemId: itmId,
      executionTimeMs: Date.now() - start,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('❌ PricingAPI Error:', msg);
    if (appId && itmId) {
      try {
        const db = getFirebaseFirestore();
        await updateDoc(doc(db, 'applications', appId), {
          [`pricingItemStatus.${itmId}`]: 'error',
          [`pricingItemError.${itmId}`]: msg,
          [`pricingItemEndTime.${itmId}`]: new Date().toISOString(),
          [`pricingItemStage.${itmId}`]: 'error',
          [`pricingItemProgress.${itmId}`]: 0,
        });
      } catch {}
    }
    mainTimer.end();
    return NextResponse.json(
      {
        success: false,
        error: msg,
        executionTimeMs: Date.now() - start,
      },
      { status: 500 }
    );
  }
}

// Export the enhanced types for external use
export type { ProgressCallback, PricingData, ApplicationData };