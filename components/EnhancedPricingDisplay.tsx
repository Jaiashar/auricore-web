
import React from 'react';
import Image from 'next/image';
import { 
    Check, 
    Clock, 
    AlertCircle, 
    Shield, 
    DollarSign, 
    Scale,
    Info
} from 'lucide-react';
import ItemPricingSkeleton from './ItemPricingSkeleton';

// ------------------------------
// Type Definitions
// ------------------------------
interface CustomerInfo {
    name: string;
    email: string;
    phone: string;
    address: string;
}

interface PricingInfo {
    confidence: string; // e.g.: 'High', 'Medium', 'None', etc.
    dataPoints: number;
    // Instead of marketValue, we now provide an offer range
    priceRange?: string;
    marketValueRange?: { low: number; high: number }; // fallback range if priceRange is not provided
    marketValue?: number;
    disbursedAmount: number; // not used for display now
    insights?: string[];
    // Added property to avoid the error when using offerAmountRange
    offerAmountRange?: { low: number; high: number };
    // Precious metal specific fields
    metalType?: string;
    pureTroyOunces?: number;
    purityDecimal?: number;
    spotPrice?: number;
    spotPriceTimestamp?: string;
}

interface ItemData {
    dynamicFields?: Record<string, any>;
    condition?: string;
    category?: string;
    photos?: string[];
}

interface SelectedMatch {
    image?: string;
    title?: string;
    structuredAttributes?: Record<string, any>;
    criticalAttributes?: Record<string, any>;
    isPreciousMetalDisplay?: boolean;
    [key: string]: any;
}

interface FieldOption {
    value: string;
    label: string;
    purityDecimal?: number;
}

type FieldType = 'select' | 'textarea' | 'number' | 'text';

interface Field {
    id: string;
    label: string;
    required?: boolean;
    type: FieldType;
    placeholder?: string;
    options?: FieldOption[];
    dynamicOptions?: Record<string, FieldOption[]>;
    showOnlyForForms?: string[];
    helpText?: string;
}

interface ParameterWeight {
    fieldId: string;
    weight: number;
}

interface Category {
    id?: string;
    label: string;
    description?: string;
    excludeInfo?: string;
    fields?: Field[];
    parameterWeights?: ParameterWeight[];
}

interface Attribute {
    id: string;
    label: string;
    value: string;
    source: 'match' | 'user';
    weight: number;
}

interface ConfidenceDisplay {
    color: string;
    bg: string;
    icon: React.ReactElement;
    text: string;
    description: string;
}

interface MetalColorInfo {
    symbol: string;
    bgColor: string;
    textColor: string;
    borderColor: string;
}

interface EnhancedPricingDisplayProps {
    pricingInfo: PricingInfo | null;
    itemData: ItemData | null;
    selectedMatch: SelectedMatch | null;
    // categoryMetadata may be a record or a single Category
    categoryMetadata?: Record<string, Category> | Category | null;
    isLoading?: boolean;
}

// Default fallback image - update this with your actual default image path
const DEFAULT_FALLBACK_IMAGE = '/images/default-item-placeholder.png';

// ------------------------------
// Custom Image component with fallback
// ------------------------------
interface ItemImageProps {
    image?: string;
    alt: string;
    width: number;
    height: number;
    className?: string;
    showReferenceLabel?: boolean;
}

const ItemImage: React.FC<ItemImageProps> = ({ 
    image, 
    alt, 
    width, 
    height, 
    className,
    showReferenceLabel = false
}) => {
    // If there's no image, show fallback
    if (!image) {
        return (
            <div className={`flex items-center justify-center bg-gray-100 ${className || 'w-full h-full'}`}>
                <span className="text-gray-600 text-xs">No image</span>
            </div>
        );
    }
    
    // Use Next.js Image with error handling
    try {
        return (
            <div className="relative">
                <Image
                    src={image}
                    alt={alt}
                    width={width}
                    height={height}
                    className={className || 'w-full h-full object-cover'}
                    // Handle invalid images by showing fallback
                    onError={(e) => {
                        // Replace broken image with fallback
                        (e.target as HTMLImageElement).src = DEFAULT_FALLBACK_IMAGE;
                    }}
                />
                {showReferenceLabel && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 px-1 py-0.5">
                        <p className="text-white text-xs text-center">Reference image</p>
                    </div>
                )}
            </div>
        );
    } catch (error) {
        // Fallback for any other errors
        return (
            <div className={`flex items-center justify-center bg-gray-100 ${className || 'w-full h-full'}`}>
                <span className="text-gray-600 text-xs">Image unavailable</span>
            </div>
        );
    }
};

// ------------------------------
// Component Implementation
// ------------------------------
const EnhancedPricingDisplay: React.FC<EnhancedPricingDisplayProps> = ({
    pricingInfo,
    itemData,
    selectedMatch,
    categoryMetadata,
    isLoading = false
}) => {
    // Extract item data
    const { dynamicFields = {}, condition = '', category = '', photos = [] } = itemData || {};
    
    // Check if this is a precious metal - MOVED THIS UP before it's used
    const isPreciousMetal = category === 'preciousMetals' || 
                           selectedMatch?.isPreciousMetalDisplay === true;

    // Show skeleton loader if explicitly loading or if we're waiting for pricing data
    if (isLoading || (!pricingInfo && itemData)) {
        return (
            <ItemPricingSkeleton
                stage="initializing" 
                estimatedTotalTime={0}
                showSubStages={false} 
                />
        );
    }

    // Fallback if insufficient pricing info
    if (!pricingInfo || pricingInfo.confidence === 'None' || (pricingInfo.dataPoints < 2 && !isPreciousMetal)) {
        return (
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
                <div className="text-center py-3">
                    <h3 className="text-lg font-medium text-gray-800 mb-2">Detailed Valuation Required</h3>
                    <p className="text-gray-700 mb-4">
                        We need more information to provide an accurate valuation for your item.
                        Our team will review your submission and contact you with a personalized offer.
                    </p>
                    <div className="bg-blue-50 p-4 rounded-lg inline-block border border-blue-100">
                        <Shield className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                        <p className="text-blue-800 font-medium">
                            You can still get cash while keeping your item
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Helper to format numbers as USD currency
    const formatCurrency = (value: number): string => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value || 0);
    };

    // Retrieve category metadata if available
    const getCategoryMetadata = (): Category | null => {
        if (categoryMetadata && category) {
            if (typeof categoryMetadata === 'object' && !('label' in categoryMetadata)) {
                const catMeta = categoryMetadata as Record<string, Category>;
                if (catMeta[category]) {
                    return catMeta[category];
                }
            }
            if ('label' in (categoryMetadata as Category) && (categoryMetadata as Category).id === category) {
                return categoryMetadata as Category;
            }
        }
        return null;
    };

    const categoryData = getCategoryMetadata();

    const getFieldLabel = (fieldId: string, value: any): string => {
        if (!categoryData || !categoryData.fields) return String(value);
        const field = categoryData.fields.find((f) => f.id === fieldId);
        if (!field || !field.options) return String(value);
        const option = field.options.find((opt) => opt.value === value);
        return option ? option.label : String(value);
    };

    // Check image availability
    const userHasUploadedPhoto = photos && photos.length > 0;
    const matchImage = selectedMatch?.image || null;

    // Determine icon and color for precious metals
    const getMetalIconAndColor = (type?: string): MetalColorInfo => {
        const metalType = type?.toLowerCase() || '';
        switch (metalType) {
            case 'gold':
                return { symbol: 'Au', bgColor: 'bg-amber-100', textColor: 'text-amber-700', borderColor: 'border-amber-200' };
            case 'silver':
                return { symbol: 'Ag', bgColor: 'bg-gray-100', textColor: 'text-gray-700', borderColor: 'border-gray-200' };
            case 'platinum':
                return { symbol: 'Pt', bgColor: 'bg-blue-50', textColor: 'text-blue-700', borderColor: 'border-blue-200' };
            case 'palladium':
                return { symbol: 'Pd', bgColor: 'bg-indigo-50', textColor: 'text-indigo-700', borderColor: 'border-indigo-200' };
            default:
                return { symbol: 'M', bgColor: 'bg-amber-100', textColor: 'text-amber-700', borderColor: 'border-amber-200' };
        }
    };

    // Extract metal-specific properties
    const metalType = isPreciousMetal ? (dynamicFields.metalType || pricingInfo.metalType) : null;
    const metalColor = isPreciousMetal ? getMetalIconAndColor(metalType) : null;
    const purityValue = isPreciousMetal ? dynamicFields.purity : null;
    
    // Extract precious metal specific details from pricing info
    const purityDecimal = pricingInfo.purityDecimal;
    const pureTroyOunces = pricingInfo.pureTroyOunces;
    const spotPrice = pricingInfo.spotPrice;

    // Build item title and subtitle
    let itemTitle = '';
    const itemSubtitle: string[] = [];

    if (isPreciousMetal) {
        // For precious metals, construct title from metal type and form
        const metalTypeDisplay = metalType 
            ? String(metalType).charAt(0).toUpperCase() + String(metalType).slice(1)
            : '';
        itemTitle = `${metalTypeDisplay} ${dynamicFields.form || 'Metal'}`;
    } else if (selectedMatch && selectedMatch.title) {
        itemTitle = selectedMatch.title;
    } else if (dynamicFields.brand && (dynamicFields.model || dynamicFields.modelName)) {
        itemTitle = `${dynamicFields.brand} ${dynamicFields.model || dynamicFields.modelName}`;
    } else if (selectedMatch && selectedMatch.structuredAttributes) {
        const attrs = selectedMatch.structuredAttributes;
        if (attrs.brand && (attrs.model || attrs.modelName)) {
            itemTitle = `${attrs.brand} ${attrs.model || attrs.modelName}`;
        }
    }

    // Clean up the title text
    const cleanupTitle = (title: string): string => {
        if (!title) return '';
        let cleanTitle = title.replace(/\s+in\s+not\s+specified/gi, '');
        cleanTitle = cleanTitle.replace(/\s*\(?not specified\)?/gi, '').trim();
        cleanTitle = cleanTitle.replace(/\s+/g, ' ').trim();
        let words = cleanTitle.split(/\s+/).filter(Boolean);
        for (let i = 0; i < words.length - 1; i++) {
            if (words[i].toLowerCase() === words[i + 1].toLowerCase()) {
                words.splice(i, 1);
                i--;
            }
        }
        for (let i = 0; i < words.length - 2; i++) {
            if (words[i].toLowerCase() === words[i + 2].toLowerCase()) {
                if (!/\d/.test(words[i]) && words[i].length > 2) {
                    words.splice(i + 2, 1);
                    i--;
                }
            }
        }
        const sizeWords = ['small', 'medium', 'large', 'mini', 'micro', 'maxi'];
        for (let i = 0; i < words.length - 1; i++) {
            if (sizeWords.includes(words[i].toLowerCase()) && sizeWords.includes(words[i + 1].toLowerCase())) {
                words.splice(i + 1, 1);
                i--;
            }
        }
        const genericTerms = ['custom', 'edition', 'limited', 'special', 'exclusive', 'authentic'];
        words = words.filter(word => !genericTerms.includes(word.toLowerCase()));
        if (words.length > 1) {
            const lastWord = words[words.length - 1];
            if ((lastWord.startsWith('"') && lastWord.endsWith('"')) ||
                (lastWord.startsWith("'") && lastWord.endsWith("'"))) {
                const quotedText = lastWord.slice(1, -1);
                if (words.slice(0, -1).some(w => w.toLowerCase().includes(quotedText.toLowerCase()))) {
                    words.pop();
                }
            }
        }
        let result = words.join(' ').trim();
        result = result.replace(/supreme canvas/gi, 'Supreme Canvas');
        result = result.replace(/\bin\s+([a-z]+)$/i, '- $1');
        const brandAbbreviations = ['GG', 'YSL', 'LV', 'CC'];
        for (const abbr of brandAbbreviations) {
            const regex = new RegExp(`\\b${abbr.toLowerCase()}\\b`, 'gi');
            result = result.replace(regex, abbr);
        }
        return result;
    };

    if (itemTitle) {
        itemTitle = cleanupTitle(itemTitle);
    }
    
    // Only populate subtitle for non-precious metal items
    if (!isPreciousMetal) {
        if (categoryData && categoryData.label && !itemSubtitle.includes(categoryData.label)) {
            itemSubtitle.unshift(categoryData.label);
        } else if (category && !itemSubtitle.includes(category)) {
            itemSubtitle.unshift(category);
        }
        if (dynamicFields.size && !itemSubtitle.includes(dynamicFields.size)) {
            itemSubtitle.push(dynamicFields.size);
        } else if (selectedMatch?.structuredAttributes?.size &&
            !itemSubtitle.includes(selectedMatch.structuredAttributes.size)) {
            itemSubtitle.push(selectedMatch.structuredAttributes.size);
        }
        if (dynamicFields.color && !itemSubtitle.includes(dynamicFields.color)) {
            itemSubtitle.push(dynamicFields.color);
        } else if (selectedMatch?.structuredAttributes?.color &&
            !itemSubtitle.includes(selectedMatch.structuredAttributes.color)) {
            itemSubtitle.push(selectedMatch.structuredAttributes.color);
        }
    }

    const isKeyAttribute = (fieldId: string): boolean => {
        if (!categoryData) return false;
        if (categoryData.parameterWeights) {
            const topFields = categoryData.parameterWeights.slice(0, 2).map(param => param.fieldId);
            return topFields.includes(fieldId);
        }
        return ['brand', 'model', 'modelName'].includes(fieldId);
    };

    const attributesList: Attribute[] = [];
    
    // Only collect attributes for non-precious metal items
    if (!isPreciousMetal) {
        if (selectedMatch && selectedMatch.structuredAttributes) {
            const structuredItems: Attribute[] = [];
            Object.entries(selectedMatch.structuredAttributes).forEach(([key, value]) => {
                if (['size', 'color', 'edition', 'year'].includes(key.toLowerCase())) return;
                if (isKeyAttribute(key)) return;
                if (value && typeof value !== 'object') {
                    const formattedKey = key
                        .replace(/([A-Z])/g, ' $1')
                        .replace(/^./, str => str.toUpperCase());
                    structuredItems.push({
                        id: key,
                        label: formattedKey,
                        value: String(value),
                        source: 'match',
                        weight: 0,
                    });
                }
            });
            attributesList.push(...structuredItems);
        }
        
        const userAttributes: Attribute[] = [];
        Object.entries(dynamicFields || {}).forEach(([key, value]) => {
            if (selectedMatch?.structuredAttributes && selectedMatch.structuredAttributes[key] !== undefined) return;
            if (value && typeof value !== 'object') {
                if (['size', 'color'].includes(key.toLowerCase())) {
                    if (!itemSubtitle.some(item => String(item).toLowerCase() === String(value).toLowerCase())) {
                        itemSubtitle.push(String(value));
                    }
                    return;
                }
                if (isKeyAttribute(key)) return;
                const formattedKey = key
                    .replace(/([A-Z])/g, ' $1')
                    .replace(/^./, str => str.toUpperCase());
                let weight = 0;
                if (categoryData && categoryData.parameterWeights) {
                    const paramWeight = categoryData.parameterWeights.find(p => p.fieldId === key);
                    if (paramWeight) weight = paramWeight.weight;
                }
                const displayValue = getFieldLabel(key, value);
                if (!attributesList.some(attr => attr.id === key)) {
                    userAttributes.push({
                        id: key,
                        label: formattedKey,
                        value: String(displayValue),
                        source: 'user',
                        weight,
                    });
                }
            }
        });
        attributesList.push(...userAttributes);
        attributesList.sort((a, b) => b.weight - a.weight);
    }

    // Determine confidence display
    const getConfidenceDisplay = (confidence: string): ConfidenceDisplay => {
        switch (confidence) {
            case 'High':
                return {
                    color: 'text-green-700',
                    bg: 'bg-green-100',
                    icon: <Check className="h-4 w-4 mr-1" />,
                    text: 'High',
                    description: isPreciousMetal 
                        ? 'Based on current market spot prices for precious metals.'
                        : 'Our valuation is based on multiple current market listings for identical items.'
                };
            case 'Medium':
                return {
                    color: 'text-amber-700',
                    bg: 'bg-amber-100',
                    icon: <Clock className="h-4 w-4 mr-1" />,
                    text: 'Medium',
                    description: isPreciousMetal
                        ? 'Based on recent market data with some price fluctuations.'
                        : 'Our valuation is based on market data for similar items in comparable condition.'
                };
            default:
                return {
                    color: 'text-gray-700',
                    bg: 'bg-gray-100',
                    icon: <AlertCircle className="h-4 w-4 mr-1" />,
                    text: 'Standard',
                    description: isPreciousMetal
                        ? 'Based on standard market analysis with limited data points.'
                        : 'Based on our market analysis of similar items.'
                };
        }
    };

    const getMatchAttribute = (key: string): any => {
        if (!selectedMatch) return null;
        if (selectedMatch.structuredAttributes && Object.prototype.hasOwnProperty.call(selectedMatch.structuredAttributes, key)) {
            return selectedMatch.structuredAttributes[key];
        }
        if (Object.prototype.hasOwnProperty.call(selectedMatch, key)) {
            return selectedMatch[key];
        }
        return null;
    };

    const confidenceDisplay = getConfidenceDisplay(pricingInfo.confidence);

    // Extract offer information - Use offerAmountRange if available, fall back to calculated values
    const offerRange = pricingInfo.offerAmountRange 
        ? `${formatCurrency(pricingInfo.offerAmountRange.low)} - ${formatCurrency(pricingInfo.offerAmountRange.high)}`
        : formatCurrency(pricingInfo.disbursedAmount);

    return (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            {/* Item Details */}
            <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-medium text-gray-800 mb-4">Item Details</h3>
                <div className="flex items-start">
                    {/* Item Image or Metal Icon */}
                    <div className="w-28 h-28 flex-shrink-0 mr-4 rounded-lg overflow-hidden bg-gray-100">
                        {isPreciousMetal && metalColor ? (
                            // Show metal symbol for precious metals
                            <div className={`w-full h-full flex items-center justify-center ${metalColor.bgColor} ${metalColor.textColor} border ${metalColor.borderColor}`}>
                                <div className="font-bold text-3xl">
                                    {metalColor.symbol}
                                </div>
                            </div>
                        ) : userHasUploadedPhoto ? (
                            // User uploaded photo
                            <ItemImage
                                image={photos[0]}
                                alt="User uploaded"
                                width={112}
                                height={112}
                                className="w-full h-full object-cover"
                            />
                        ) : matchImage ? (
                            // Reference image from match
                            <ItemImage
                                image={matchImage}
                                alt="Similar item"
                                width={112}
                                height={112}
                                className="w-full h-full object-cover"
                                showReferenceLabel={true}
                            />
                        ) : (
                            // No image fallback
                            <div className="w-full h-full flex items-center justify-center">
                                <span className="text-gray-600 text-xs">No image</span>
                            </div>
                        )}
                    </div>
                    <div className="flex-1">
                        <h4 className="text-lg font-medium text-gray-900">{itemTitle}</h4>
                        
                        {/* Different display for precious metals vs regular items */}
                        {isPreciousMetal ? (
                            <div className="text-sm text-gray-700 mt-2 space-y-1">
                                {metalType && (
                                    <div>
                                        <span className="font-medium">Metal Type: </span>
                                        <span>{metalType}</span>
                                    </div>
                                )}
                                {dynamicFields.form && (
                                    <div>
                                        <span className="font-medium">Form: </span>
                                        <span>{dynamicFields.form}</span>
                                    </div>
                                )}
                                {pureTroyOunces && (
                                    <div>
                                        <span className="font-medium">Pure Weight: </span>
                                        <span>{pureTroyOunces.toFixed(4)} troy oz</span>
                                    </div>
                                )}
                                {purityValue && (
                                    <div>
                                        <span className="font-medium">Purity: </span>
                                        <span>
                                            {purityValue} 
                                            {purityDecimal && ` (${(purityDecimal * 100).toFixed(1)}%)`}
                                        </span>
                                    </div>
                                )}
                                {/* Removed spot price display that was here previously */}
                            </div>
                        ) : (
                            // Regular item display
                            <>
                                <div className="text-sm text-gray-700 mb-2">
                                    {itemSubtitle.filter(Boolean).join(' • ')}
                                </div>
                                {condition && (
                                    <div className="mb-2">
                                        <span className="text-sm text-gray-700">Condition: </span>
                                        <span className="text-sm font-medium text-gray-800">
                                            {getMatchAttribute('condition') || getFieldLabel('condition', condition)}
                                        </span>
                                    </div>
                                )}
                                {itemData &&
                                    itemData.dynamicFields &&
                                    itemData.dynamicFields.brand &&
                                    (itemData.dynamicFields.model || itemData.dynamicFields.modelName) &&
                                    `${itemData.dynamicFields.brand} ${itemData.dynamicFields.model || itemData.dynamicFields.modelName}`.trim() !== itemTitle && (
                                        <div className="mt-1 text-xs text-gray-700">
                                            <span>Originally entered as: </span>
                                            <span className="text-gray-800">
                                                {`${itemData.dynamicFields.brand} ${itemData.dynamicFields.model || itemData.dynamicFields.modelName}`.trim()}
                                            </span>
                                        </div>
                                    )}
                                {attributesList.map((attr, index) => {
                                    let displayValue = attr.value;
                                    if (['brand', 'model', 'modelName'].includes(attr.id) && selectedMatch) {
                                        const matchValue = getMatchAttribute(attr.id);
                                        if (matchValue) {
                                            displayValue = matchValue;
                                        }
                                    }
                                    return (
                                        <div key={index} className="text-sm">
                                            <span className="text-gray-700">{attr.label}: </span>
                                            <span className="text-gray-800 font-medium">{displayValue}</span>
                                        </div>
                                    );
                                })}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Pricing Section */}
            <div className="p-6">
                <div className="mb-4">
                    <h3 className="text-xl font-medium text-gray-800 mb-1">Your Offer Range</h3>
                    <p className="text-sm text-gray-700">
                        {isPreciousMetal 
                            ? "Based on current precious metal market prices" 
                            : "Based on our analysis of the current market"
                        }
                    </p>
                </div>

                {/* REMOVED Market Value Display Section */}

                {/* Confidence Badge */}
                <div className="flex justify-between items-center mb-4">
                    <div className="text-sm text-gray-600 flex items-center">
                        <Scale className="h-4 w-4 mr-1" />
                        <span>Confidence</span>
                    </div>
                    <div className={`px-2 py-1 text-xs font-medium rounded-full ${confidenceDisplay.color.replace('text-', 'bg-').replace('700', '100')} ${confidenceDisplay.color}`}>
                        {confidenceDisplay.text}
                    </div>
                </div>

                {/* Offer Box */}
                <div className="bg-blue-50 p-5 rounded-lg border border-blue-100 flex flex-col justify-center">
                    <div className="text-sm text-blue-700 mb-1 font-medium">
                        {isPreciousMetal 
                            ? `${metalType ? metalType.charAt(0).toUpperCase() + metalType.slice(1) : 'Metal'} 
                               ${dynamicFields.form || ''} 
                               ${pureTroyOunces ? `(${pureTroyOunces.toFixed(4)} troy oz)` : ''}`
                            : "Offer Range"}
                    </div>
                    <div className="text-3xl font-bold text-blue-700">
                        {offerRange}
                    </div>
                    <div className="flex items-center text-xs text-blue-700 mt-1">
                        {confidenceDisplay.icon}
                        <span>
                            {confidenceDisplay.text} confidence
                            {isPreciousMetal && <span className="ml-2">• Final offer subject to authentication</span>}
                        </span>
                    </div>
                </div>

                {/* Confidence Info */}
                <div className={`p-4 rounded-lg my-4 ${confidenceDisplay.bg} border ${confidenceDisplay.color === 'text-green-700' ? 'border-green-200' : confidenceDisplay.color === 'text-amber-700' ? 'border-amber-200' : 'border-gray-200'}`}>
                    <div className="flex items-center mb-1">
                        {confidenceDisplay.icon}
                        <span className={`font-medium ${confidenceDisplay.color}`}>
                            {confidenceDisplay.text} Confidence Rating
                        </span>
                    </div>
                    <p className={`text-sm ${confidenceDisplay.color}`}>{confidenceDisplay.description}</p>
                </div>

                {/* Deal Benefits */}
                <div className="bg-green-50 p-4 rounded-lg border border-green-100 text-center mt-6">
                    <div className="flex items-center justify-center mb-1">
                        <Shield className="h-4 w-4 mr-1 text-green-700" />
                        <p className="text-green-800 font-medium">
                            Get cash now while keeping your item
                        </p>
                    </div>
                    <p className="text-sm text-green-700">
                        Our team will contact you within 1-2 business days to finalize your offer.
                    </p>
                </div>

                {/* Additional Insights */}
                {pricingInfo.insights && pricingInfo.insights.length > 0 && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                        <div className="flex items-start">
                            <Info className="h-4 w-4 text-blue-700 mt-0.5 mr-2 flex-shrink-0" />
                            <div className="text-xs text-blue-700">
                                {pricingInfo.insights.map((insight, index) => (
                                    <p key={index} className="mb-1">{insight}</p>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Terms */}
                <div className="text-sm text-gray-700 mt-4">
                    <p>
                        This offer is valid for 7 days. Final valuation requires verification of item condition.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default EnhancedPricingDisplay;