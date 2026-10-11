'use client';

import React from 'react';
import { Loader2, ChevronRight } from 'lucide-react';

/**
 * Props for the LoadingOverlay component
 */
interface LoadingOverlayProps {
    message?: string;
    subMessage?: string;
    progress?: number | null;
    isFullScreen?: boolean;
    itemProgress?: {
        current: number;
        total: number;
    };
    steps?: {
        label: string;
        completed: boolean;
        active: boolean;
    }[];
    estimatedTime?: string;
}

/**
 * Enhanced loading overlay component with step indicators, item progress, and time estimates
 */
const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
                                                           message = 'Processing your request...',
                                                           subMessage = 'This may take a moment.',
                                                           progress = null,
                                                           isFullScreen = true,
                                                           itemProgress = null,
                                                           steps = null,
                                                           estimatedTime = null
                                                       }) => {
    return (
        <div className={`
            flex items-center justify-center bg-gray-900 bg-opacity-70 z-50
            ${isFullScreen ? 'fixed inset-0' : 'rounded-xl p-6'}
        `}>
            <div className="bg-white rounded-xl p-8 max-w-md w-full shadow-2xl">
                <div className="text-center">
                    <div className="mb-6">
                        <Loader2 className="animate-spin h-12 w-12 text-blue-500 mx-auto" />
                    </div>

                    <h3 className="text-xl font-semibold text-gray-800 mb-2">
                        {message}
                    </h3>

                    <p className="text-sm text-gray-600 mb-4">
                        {subMessage}
                    </p>

                    {/* Item Progress Indicator */}
                    {itemProgress && (
                        <div className="mb-4 bg-blue-50 rounded-lg p-3 border border-blue-100">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-blue-700 text-sm font-medium">Processing items...</span>
                                <span className="text-blue-700 font-medium">{itemProgress.current} of {itemProgress.total}</span>
                            </div>
                            <div className="w-full bg-blue-100 rounded-full h-2">
                                <div
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${(itemProgress.current / itemProgress.total) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    )}

                    {/* Process Steps Indicator */}
                    {steps && steps.length > 0 && (
                        <div className="mb-6 mt-2">
                            <div className="flex flex-col space-y-2">
                                {steps.map((step, index) => (
                                    <div
                                        key={index}
                                        className={`flex items-center p-2 rounded-lg text-left ${
                                            step.active ? 'bg-blue-50' :
                                                step.completed ? 'bg-green-50 opacity-70' : 'opacity-50'
                                        }`}
                                    >
                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center mr-3 ${
                                            step.completed
                                                ? 'bg-green-100 text-green-600 border border-green-300'
                                                : step.active
                                                    ? 'bg-blue-100 text-blue-600 border border-blue-300'
                                                    : 'bg-gray-100 text-gray-400 border border-gray-300'
                                        }`}>
                                            {step.completed ? (
                                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                                                </svg>
                                            ) : step.active ? (
                                                <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                                            ) : (
                                                <ChevronRight className="w-3 h-3" />
                                            )}
                                        </div>
                                        <span className={`text-sm ${
                                            step.completed
                                                ? 'text-green-700 line-through'
                                                : step.active
                                                    ? 'text-blue-700 font-medium'
                                                    : 'text-gray-500'
                                        }`}>
                                            {step.label}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Main Progress Bar */}
                    {progress !== null && progress !== undefined && (
                        <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden mb-2">
                            <div
                                className="bg-blue-500 h-full transition-all duration-1000 ease-out"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    )}

                    {/* Estimated Time */}
                    {estimatedTime && (
                        <div className="mt-2 text-xs text-gray-500">
                            Estimated time: {estimatedTime}
                        </div>
                    )}

                    {/* Progress Phase Text */}
                    {progress !== null && progress !== undefined && (
                        <div className="mt-1 text-xs text-gray-500">
                            {progress < 25 && "Starting process..."}
                            {progress >= 25 && progress < 50 && "Finding matches..."}
                            {progress >= 50 && progress < 75 && "Processing items..."}
                            {progress >= 75 && progress < 90 && "Almost there..."}
                            {progress >= 90 && "Finalizing..."}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LoadingOverlay;
