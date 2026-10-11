'use client';

import React from 'react';

interface SkeletonMatchItemProps {
    index?: number;
}

const SkeletonMatchItem: React.FC<SkeletonMatchItemProps> = ({ index = 0 }) => {
    return (
        <div
            className="relative p-4 rounded-lg border border-gray-200 bg-white overflow-hidden stagger-item animate-fadeIn"
            style={{ animationDelay: `${index * 150}ms` }}
        >
            <div className="flex items-start">
                {/* Image skeleton */}
                <div className="w-24 h-24 flex-shrink-0 rounded-lg bg-gray-200 mr-4 overflow-hidden">
                    <div className="w-full h-full animate-shimmer"></div>
                </div>

                <div className="flex-grow">
                    {/* Title skeleton */}
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-4 animate-shimmer"></div>

                    {/* Property skeletons */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 mb-2">
                        <div className="h-4 bg-gray-200 rounded w-2/3 animate-shimmer" style={{ animationDelay: `${(index * 150) + 100}ms` }}></div>
                        <div className="h-4 bg-gray-200 rounded w-3/4 animate-shimmer" style={{ animationDelay: `${(index * 150) + 200}ms` }}></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2 animate-shimmer" style={{ animationDelay: `${(index * 150) + 300}ms` }}></div>
                        <div className="h-4 bg-gray-200 rounded w-3/5 animate-shimmer" style={{ animationDelay: `${(index * 150) + 400}ms` }}></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SkeletonMatchItem;
