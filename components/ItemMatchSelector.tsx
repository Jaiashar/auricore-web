'use client';

import React, { useState, useEffect, useCallback } from 'react';
import RetryImage from '@/components/RetryImage';
import SkeletonItemMatch from '@/components/SkeletonItemMatch';
import { Check, Search, AlertTriangle, RefreshCcw, Info } from 'lucide-react';

type Match = Record<string, any>;

interface ItemMatchSelectorProps {
  matches: Match[];
  selectedMatchId: string | number | null;
  onSelectMatch: (m: Match, idx: number) => void;
  onReload: () => void;
  categories: Record<string, any>;
  isLoading?: boolean;
}

/**
 * ItemMatchSelector Component
 * Enhanced to handle precious metals with special display
 */
const ItemMatchSelector: React.FC<ItemMatchSelectorProps> = ({
  matches,
  selectedMatchId,
  onSelectMatch,
  onReload,
  categories,
  isLoading = false,
}) => {
  // State management
  const [displayCount, setDisplayCount] = useState(5);
  const [loadingMatches, setLoadingMatches] = useState(true);

  // Simulate staggered loading for smoother transition
  useEffect(() => {
    if (matches.length > 0) {
      const timer = setTimeout(() => {
        setLoadingMatches(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [matches]);


  // Clean text utility
  const cleanText = (text: string): string => {
    if (!text) return '';

    const cleaned = text
      .replace(/^(not specified|unknown)$/i, '')
      .replace(/\s*\(not specified\)/i, '')
      .replace(/\s*\(unknown\)/i, '')
      .replace(/\sin not specified\b/i, '')
      .trim();

    // Remove duplicate words
    const words = cleaned.split(/\s+/);
    const deduped: string[] = [];

    for (let i = 0; i < words.length; i++) {
      if (i > 0 && words[i].toLowerCase() === words[i - 1].toLowerCase()) {
        continue;
      }
      deduped.push(words[i]);
    }

    const finalWords: string[] = [];
    const seenModels = new Set<string>();
    const brandSeen: Record<string, boolean> = {};

    for (const word of deduped) {
      if (/\d/.test(word)) {
        const low = word.toLowerCase();
        if (!seenModels.has(low)) {
          seenModels.add(low);
          finalWords.push(word);
        }
      } else if (word.length > 2 && /^[a-zA-Z]+$/.test(word)) {
        const low = word.toLowerCase();
        if (!brandSeen[low]) {
          brandSeen[low] = true;
          finalWords.push(word);
        }
      } else {
        finalWords.push(word);
      }
    }

    return finalWords.join(' ');
  };

  // Get category ID safely
  const getCategoryId = (match: Match): string => {
    return match?.originalItem?.category || 'unknown';
  };

  // Format field label
  const getFieldLabel = (fieldId: string, categoryId: string): string => {
    const category = categories[categoryId];
    if (category?.fields) {
      const field = category.fields.find((f: any) => f.id === fieldId);
      if (field?.label) return field.label;
    }
    // Fallback: convert camelCase to Title Case
    return fieldId.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
  };

  // Show skeleton UI during loading
  if (isLoading || loadingMatches) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-8 py-6">
          <div className="h-6 bg-blue-400 rounded w-3/4 mb-3 opacity-50" />
          <div className="h-4 bg-blue-300 rounded w-1/2 opacity-50" />
        </div>
        <div className="p-8">
          <div className="space-y-4 mb-8">
            <SkeletonItemMatch />
            <SkeletonItemMatch />
            <SkeletonItemMatch />
          </div>
        </div>
      </div>
    );
  }

  // No matches received
  if (matches.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
        <div className="text-center py-8">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <p className="text-gray-600">No matches data received.</p>
          <button
            onClick={onReload}
            className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all shadow-md flex items-center mx-auto"
          >
            <RefreshCcw className="w-4 h-4 mr-2" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Our normalized matches array
  const matchesArray: Match[] = matches;

  // Check if we have a precious metals display item
  const hasPreciousMetals = matchesArray.some(
    (match) =>
      match.isPreciousMetalDisplay === true ||
      (match.originalItem?.category === 'preciousMetals')
  );

  // Load more handler
  const loadMore = () => {
    setDisplayCount((prev) => Math.min(prev + 5, matchesArray.length));
  };

  // For precious metals, we'll show a different header and info
  const headerTitle = hasPreciousMetals
    ? 'Precious Metal Asset Confirmation'
    : 'Which item matches yours?';

  const headerDescription = hasPreciousMetals
    ? 'Verify the metal type and form below. Your valuation will be based on your exact specifications.'
    : 'Select the variation that best represents your specific item to ensure accurate assessment.';

  const infoMessage = hasPreciousMetals
    ? 'For precious metals, we do not match to specific products. Your valuation will be based on the weight, purity, and other specifications you provided.'
    : "Don't worry if the image doesn't exactly match your item. Please focus on matching the item details and specifications shown below each item. This helps us price your item more accurately.";

  // Determine icon and color for precious metals
  const getMetalIconAndColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'gold':
        return {
          symbol: 'Au',
          bgColor: 'bg-amber-100',
          textColor: 'text-amber-700',
          borderColor: 'border-amber-200',
        };
      case 'silver':
        return {
          symbol: 'Ag',
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-700',
          borderColor: 'border-gray-200',
        };
      case 'platinum':
        return {
          symbol: 'Pt',
          bgColor: 'bg-blue-50',
          textColor: 'text-blue-700',
          borderColor: 'border-blue-200',
        };
      case 'palladium':
        return {
          symbol: 'Pd',
          bgColor: 'bg-indigo-50',
          textColor: 'text-indigo-700',
          borderColor: 'border-indigo-200',
        };
      default:
        return {
          symbol: 'M',
          bgColor: 'bg-amber-100',
          textColor: 'text-amber-700',
          borderColor: 'border-amber-200',
        };
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-8 py-6 text-white">
        <h2 className="text-2xl font-semibold mb-3 text-center">{headerTitle}</h2>
        <p className="text-blue-100 text-center">{headerDescription}</p>
      </div>

      <div className="p-8">
        {/* Info Box */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start mb-6">
          <Info className="w-5 h-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
          <p className="text-sm text-blue-700 text-left">{infoMessage}</p>
        </div>

        {/* Matches List */}
        <div className="space-y-4 mb-8">
        {matchesArray.slice(0, displayCount).map((match, index) => {
            const key = `match-${index}`;
            const id = index;
            const isActive = selectedMatchId === id;
            const cleaned = cleanText(match.displayTitle || match.title || '');
            const parts = cleaned
              .split(/\s+/)
              .filter((p) => p && !/^(not|specified|unknown)$/i.test(p));
            const displayTitle = parts.length > 0 ? parts.join(' ') : 'Unknown Item';

            const isPreciousMetalDisplay =
              match.isPreciousMetalDisplay === true ||
              (match.originalItem?.category === 'preciousMetals');

            const metalType = isPreciousMetalDisplay
              ? (match.criticalAttributes?.metalType ||
                  match.structuredAttributes?.metalType ||
                  match.originalItem?.dynamicFields?.metalType ||
                  'gold')
              : '';

            const metalColor = isPreciousMetalDisplay
              ? getMetalIconAndColor(metalType)
              : null;

            // Get the category ID safely
            const categoryId = getCategoryId(match);

            return (
              <div
                key={key}
                className={`relative p-4 rounded-lg border
                  ${isActive
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm'
                  } cursor-pointer transition-all`}
                  onClick={() => onSelectMatch(match, index)}
                >

                 <div className="flex items-start">

                  {/* Item Image or Metal Symbol */}
                  {isPreciousMetalDisplay && metalColor ? (
                    <div
                      className={`
                        w-24 h-24 flex-shrink-0 rounded-lg 
                        ${metalColor.bgColor} ${metalColor.textColor} 
                        border ${metalColor.borderColor} mr-4
                      `}
                    >
                      <div className="font-bold text-3xl">{metalColor.symbol}</div>
                    </div>
                  ) : match.thumbnail ? (
                    <div className="w-24 h-24 flex-shrink-0 rounded-lg bg-gray-100 overflow-hidden mr-4 border border-gray-200 shadow-sm">
                      <RetryImage
                        src={match.thumbnail}
                        alt={displayTitle}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-24 h-24 flex-shrink-0 rounded-lg bg-gray-100 flex items-center justify-center mr-4 border border-gray-200">
                      <Search className="w-8 h-8 text-gray-400" />
                    </div>
                  )}

                  <div className="flex-grow">
                    <h3 className="font-semibold text-lg mb-2 text-gray-900">
                      {isPreciousMetalDisplay
                        ? `${
                            metalType.charAt(0).toUpperCase() + metalType.slice(1)
                          } ${match.criticalAttributes?.form || ''}`
                        : displayTitle}
                    </h3>

                    {isPreciousMetalDisplay ? (
                      <div className="text-sm text-gray-600">
                        {match.criticalAttributes?.metalType && (
                          <div className="py-0.5">
                            <span className="font-medium text-gray-700">Metal Type: </span>
                            <span>{match.criticalAttributes.metalType}</span>
                          </div>
                        )}
                        {match.criticalAttributes?.form && (
                          <div className="py-0.5">
                            <span className="font-medium text-gray-700">Form: </span>
                            <span>{match.criticalAttributes.form}</span>
                          </div>
                        )}
                        {match.criticalAttributes?.weightDisplay && (
                          <div className="py-0.5">
                            <span className="font-medium text-gray-700">Weight: </span>
                            <span>{match.criticalAttributes.weightDisplay}</span>
                          </div>
                        )}
                        {match.criticalAttributes?.purity && (
                          <div className="py-0.5">
                            <span className="font-medium text-gray-700">Purity: </span>
                            <span>{match.criticalAttributes.purity}</span>
                          </div>
                        )}

                        <div className="mt-2 inline-block px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                          Representative Image
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-600 grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 mb-2">
                        {match.structuredAttributes && Object.entries(match.structuredAttributes).map(([key, value]) => {
                          // Get label safely with fallback
                          const label = getFieldLabel(key, categoryId);
                          
                          return value ? (
                            <div key={key} className="py-0.5">
                              <span className="font-medium text-gray-700">{label}:</span>{' '}
                              <span>{String(value)}</span>
                            </div>
                          ) : null;
                        })}
                      </div>
                    )}

                    {match.distinctiveFeatures?.length > 0 && !isPreciousMetalDisplay && (
                      <div className="mt-2 text-xs bg-gray-50 p-2 rounded-md border border-gray-100">
                        <span className="font-medium text-gray-700">
                          Notable features:{' '}
                        </span>
                        <span>{match.distinctiveFeatures.join(', ')}</span>
                      </div>
                    )}

                    {isPreciousMetalDisplay && (
                      <div className="mt-2 text-xs bg-yellow-50 p-2 rounded-md border border-yellow-100">
                        <span className="text-yellow-800">
                          <strong>Note:</strong> This image is for display purposes
                          only. Your valuation will be based on the metal type, form,
                          weight, and purity specifications you provided.
                        </span>
                      </div>
                    )}
                  </div>

                  {isActive && (
                    <div className="absolute top-3 right-3 bg-blue-500 text-white rounded-full p-1">
                      <Check className="w-4 h-4" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Show More button */}
        {displayCount < matchesArray.length && (
          <div className="text-center mt-6">
            <button
              onClick={loadMore}
              className="px-6 py-3 bg-white text-blue-600 rounded-full font-medium hover:bg-blue-50 transition-all border border-blue-200 shadow-sm flex items-center mx-auto"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
              Show More Options
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ItemMatchSelector;