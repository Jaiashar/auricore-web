import React, { FC } from 'react';
import { Loader2, Clock, Search, Calculator, BrainCircuit } from 'lucide-react';

export type Stage = 'initializing' | 'searching' | 'analyzing' | 'calculating' | 'complete';

interface PricingStageProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    active?: boolean;
}

const PricingStage: FC<PricingStageProps> = ({
                                                 icon,
                                                 title,
                                                 description,
                                                 active = false,
                                             }) => {
    return (
        <div
            className={`flex items-center p-3 rounded-lg mb-2 ${
                active ? 'bg-blue-50 border border-blue-100' : 'bg-gray-50 border border-gray-100'
            }`}
        >
            <div
                className={`w-8 h-8 rounded-full ${
                    active ? 'bg-blue-100' : 'bg-gray-100'
                } flex items-center justify-center mr-3`}
            >
                {icon}
            </div>
            <div>
                <h4 className={`text-sm font-medium ${active ? 'text-blue-700' : 'text-gray-500'}`}>
                    {title}
                </h4>
                <p className={`text-xs ${active ? 'text-blue-600' : 'text-gray-500'}`}>
                    {description}
                </p>
            </div>
        </div>
    );
};

interface ItemPricingSkeletonProps {
    stage: any;
    estimatedTotalTime: number;
    showSubStages: boolean;
    initialElapsedTime?: number; // Added this property
}

const ItemPricingSkeleton: FC<ItemPricingSkeletonProps> = ({ stage = 'initializing' }) => {
    // Map stage to display info
    const stageInfo = {
        initializing: {
          title: 'Initializing',
          description: 'Setting up pricing analysis',
          icon: <Clock className="h-4 w-4 text-blue-600" />
        },
        searching: {
          title: 'Finding Comparable Items',
          description: 'Searching for similar items in the market',
          icon: <Search className="h-4 w-4 text-blue-600" />
        },
        analyzing: {
          title: 'Analyzing Market Data',
          description: 'Evaluating market prices and conditions',
          icon: <BrainCircuit className="h-4 w-4 text-blue-600" />
        },
        calculating: {
          title: 'Calculating Offer',
          description: 'Determining your personalized offer range',
          icon: <Calculator className="h-4 w-4 text-blue-600" />
        },
        complete: {
          title: 'Processing Complete',
          description: 'Your offer is ready to view',
          icon: <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
        }
      };

    // Define all possible stages
    const allStages: Stage[] = ['initializing', 'searching', 'analyzing', 'calculating', 'complete'];
    
    // Validate the stage prop - if it's not a valid stage, default to 'initializing'
    const validStage: Stage = allStages.includes(stage as Stage) ? stage as Stage : 'initializing';
    
    const currentStageIndex = allStages.indexOf(validStage);

    return (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            {/* Item Details Skeleton */}
            <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-medium text-gray-900 mb-4">Item Details</h3>
                <div className="flex items-start">
                    <div className="w-28 h-28 flex-shrink-0 mr-4 rounded-lg overflow-hidden bg-gray-100 animate-pulse" />
                    <div className="flex-1">
                        <div className="h-6 bg-gray-200 rounded w-3/4 mb-2 animate-pulse" />
                        <div className="h-4 bg-gray-200 rounded w-1/2 mb-3 animate-pulse" />
                        <div className="space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
                            <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse" />
                            <div className="h-4 bg-gray-200 rounded w-4/6 animate-pulse" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Pricing Section Skeleton with Stage Indicators */}
            <div className="p-6">
                <div className="mb-4">
                    <h3 className="text-xl font-medium text-gray-900 mb-1">Your Offer Range</h3>
                    <p className="text-sm text-gray-700">Based on our analysis of the current market</p>
                </div>

                <div className="bg-blue-50 p-5 rounded-lg border border-blue-100 flex flex-col justify-center mb-4">
                    <div className="text-sm text-blue-700 mb-1 font-medium">{stageInfo[validStage].title}</div>
                    <div className="flex items-center justify-center space-x-2">
                        <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
                        <span className="text-blue-700 font-medium">{stageInfo[validStage].description}</span>
                    </div>
                </div>

                {/* Display the stages with the current one highlighted */}
                <div className="mb-4 border border-gray-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Pricing Progress</h4>
                    <div className="space-y-2">
                        {allStages.map((stageItem, index) => (
                            <PricingStage
                                key={stageItem}
                                title={stageInfo[stageItem].title}
                                description={index <= currentStageIndex ? stageInfo[stageItem].description : ''}
                                icon={stageInfo[stageItem].icon}
                                active={stageItem === validStage}
                            />
                        ))}
                    </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg border border-green-100 text-center mt-6">
                    <p className="text-green-800 font-medium">Get cash now while keeping your item</p>
                    <p className="text-sm text-green-700">
                        Our team will contact you within 1–2 business days to finalize your offer.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ItemPricingSkeleton;