'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, DollarSign } from 'lucide-react';
import EnhancedPricingDisplay from './EnhancedPricingDisplay';
import { doc, getDoc } from 'firebase/firestore';
import { getFirebaseDb } from '@/utils/config'; // Adjust path as needed

interface PricingInfo {
    confidence: string;
    dataPoints: number;
    priceRange?: string;
    marketValueRange?: { low: number; high: number };
    disbursedAmount: number;
    insights?: string[];
    offerAmountRange?: { low: number; high: number };
}

interface ItemData {
    id: string;
    dynamicFields?: Record<string, any>;
    condition?: string;
    category?: string;
    photos?: string[];
}

interface SelectedMatch {
    image?: string;
    title?: string;
    structuredAttributes?: Record<string, any>;
    [key: string]: any;
}

interface PricingDisplayProps {
    applicationId: string;
    selectedItem: ItemData | null;
    selectedMatch: SelectedMatch | null;
}

const PricingDisplay: React.FC<PricingDisplayProps> = ({
                                                           applicationId,
                                                           selectedItem,
                                                           selectedMatch,
                                                       }) => {
    const [pricing, setPricing] = useState<PricingInfo | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // We only read pricing data from Firestore, we don't initiate calculations
    useEffect(() => {
        const fetchPricingData = async () => {
            if (!applicationId || !selectedItem) {
                setLoading(false);
                setError('Missing required data');
                return;
            }

            try {
                setLoading(true);
                setError(null);

                // Get the application document from Firestore
                const db = getFirebaseDb();
                const applicationRef = doc(db, 'applications', applicationId);
                const applicationDoc = await getDoc(applicationRef);

                if (!applicationDoc.exists()) {
                    throw new Error('Application not found');
                }

                const appData = applicationDoc.data();

                // Check if pricing data exists for this item
                if (appData.pricingData && appData.pricingData[selectedItem.id]) {
                    setPricing(appData.pricingData[selectedItem.id]);
                } else {
                    // No pricing data available yet
                    setError('Pricing calculation in progress...');
                }
            } catch (err: any) {
                console.error('Error fetching pricing data:', err);
                setError(err.message || 'Error retrieving pricing data');
            } finally {
                setLoading(false);
            }
        };

        fetchPricingData();
    }, [applicationId, selectedItem]);

    if (loading) {
        return (
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
                <div className="flex items-center justify-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600 mr-2" />
                    <span className="text-lg text-gray-800">Loading pricing information...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
                <div className="text-center py-6">
                    <h3 className="text-lg font-medium text-gray-800 mb-2">Pricing In Progress</h3>
                    <p className="text-gray-700">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            <h3 className="text-xl font-medium text-blue-700 flex items-center mb-4">
                <DollarSign className="h-5 w-5 mr-1" />
                Your Estimated Offer
            </h3>
            <EnhancedPricingDisplay
                pricingInfo={pricing}
                itemData={selectedItem}
                selectedMatch={selectedMatch}
            />
            <p className="text-xs text-gray-700 mt-3 italic text-center">
                This is a preliminary estimate subject to verification.
            </p>
        </div>
    );
};

export default PricingDisplay;
