// API route with Anthropic Claude integration

import { NextRequest, NextResponse } from 'next/server';
import {
    buildLooseQuery,
    fetchInitialMatches,
    enhanceMatchesWithClaude,
    ensureDistinctResults,
    handlePreciousMetals // Import the new function
} from '@/utils/queryBuilder';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, addDoc, doc, getDoc } from 'firebase/firestore';
import pLimit from 'p-limit';

// Define interfaces for the expected data structure
interface ItemField {
    fieldId: string;
    weight: number;
}

interface CategoryMeta {
    parameterWeights?: ItemField[];
    [key: string]: any;
}

interface Item {
    id?: string;
    category: string;
    condition?: string;
    photos?: string[];
    dynamicFields?: Record<string, any>;
    [key: string]: any;
}

interface CustomerInfo {
    name: string;
    email: string;
    phone: string;
    address: string;
    [key: string]: any;
}

interface RequestBody {
    customerInfo: CustomerInfo;
    items: Item[];
    categories?: Record<string, CategoryMeta>;
}

interface MatchResult {
    title?: string;
    thumbnail?: string;
    image?: string;
    link?: string;
    source?: string;
    extracted_price?: number;
    [key: string]: any;
}

// Firebase configuration - REPLACE WITH YOUR ACTUAL CONFIG
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Singleton Firebase app initialization
function getFirebaseApp() {
    try {
        // Check if an app is already initialized
        if (getApps().length === 0) {
            return initializeApp(firebaseConfig);
        }
        return getApp();
    } catch (error) {
        console.error('Firebase App Initialization Error:', error);
        throw new Error('Failed to initialize Firebase');
    }
}

// Singleton Firestore initialization
function getFirebaseFirestore() {
    try {
        const app = getFirebaseApp();
        return getFirestore(app);
    } catch (error) {
        console.error('Firestore Initialization Error:', error);
        throw new Error('Failed to get Firestore instance');
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json() as RequestBody;
        const { customerInfo, items, categories = {} } = body;

        // Create a limit with 4 concurrent calls
        const limit = pLimit(4);

        // Process matches with controlled concurrency
        const suggestedMatches = await Promise.all(
            items.map((item: Item, index: number) =>
                limit(async () => {
                    // Special handling for precious metals
                    if (item.category === 'preciousMetals') {
                        console.log('🥇 Processing precious metals item with special handling');
                        
                        // Use our specialized function instead of the normal matching pipeline
                        const metalMatches = await handlePreciousMetals(item);
                        
                        // Strip out any unwanted fields from the item that might leak into the UI
                        const sanitizedItem = {
                            id: item.id,
                            category: 'preciousMetals',
                            dynamicFields: {
                                metalType: item.dynamicFields?.metalType,
                                form: item.dynamicFields?.form
                                // Deliberately not copying weight, purity, or other fields
                            }
                        };
                        
                        return {
                            itemId: item.id || `item-${index}`,
                            item: sanitizedItem, // Use the sanitized item
                            matches: metalMatches,
                            queryUsed: 'precious-metals-display'
                        };
                    }
                    
                    // Normal processing for other categories
                    const categoryMeta = categories[item.category];
                    const parameterWeights = categoryMeta?.parameterWeights || [];

                    const query = buildLooseQuery(item, parameterWeights);

                    const serpResults = await fetchInitialMatches(query);
                    console.log(`Found ${serpResults.length} shopping results`);

                    let matches = serpResults
                        .filter((r: MatchResult) => r.extracted_price)
                        .slice(0, 15) // Just take top 15 results from SerpAPI
                        .map((r: MatchResult) => ({
                            title: r.title,
                            image: r.thumbnail || r.image || null,
                            link: r.link,
                            source: r.source || 'Unknown',
                            queryUsed: query
                        }));

                    try {
                        const enhancedMatches = await enhanceMatchesWithClaude(matches, item);
                        matches = enhancedMatches && enhancedMatches.length > 0
                            ? ensureDistinctResults(enhancedMatches, 8)
                            : matches.slice(0, 8);
                    } catch (err) {
                        console.error('Claude enhancement error:', err);
                        matches = matches.slice(0, 8);
                    }

                    return {
                        itemId: item.id || `item-${index}`,
                        item,
                        matches,
                        queryUsed: query
                    };
                })
            )
        );

        console.log("✅ Suggested matches returned from API");

        // Create a unique ID for this application
        let applicationId;

        try {
            const db = getFirebaseFirestore();

            console.log("✅ Firebase initialized");

            // Prepare data to store in Firestore
            const rawApplicationData = {
                customerInfo,
                items,
                suggestedMatches,
                createdAt: new Date().toISOString(),
                status: 'pending'
            };

            const applicationData = stripUndefined(rawApplicationData);

            // Additional logging to help with debugging
            console.log("🔄 Preparing to save to Firestore...");

            // Add document to Firestore and get the document reference with its ID
            const applicationsRef = collection(db, "applications");
            const docRef = await addDoc(applicationsRef, applicationData);

            // Get the Firestore document ID
            applicationId = docRef.id;
            console.log("✅ Saved to Firestore with ID:", applicationId);
        } catch (firestoreError) {
            // Log the specific Firestore error but continue with a fallback UUID
            console.error("[FIRESTORE_ERROR]", firestoreError);

            // Generate a fallback ID
            applicationId = `fallback-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
            console.log("⚠️ Using fallback ID:", applicationId);
        }

        return NextResponse.json({
            success: true,
            applicationId: applicationId,
            suggestedMatches
        });
    } catch (error: any) {
        // More detailed error logging
        console.error('[INTAKE_API_ERROR]', error.message);
        console.error('[INTAKE_API_STACK]', error.stack);
        return NextResponse.json({
            error: 'Server error: ' + error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status: 500 });
    }
}

function stripUndefined(obj: any): any {
    if (Array.isArray(obj)) {
        return obj.map(stripUndefined);
    } else if (obj !== null && typeof obj === 'object') {
        return Object.entries(obj).reduce((acc, [key, value]) => {
            if (value !== undefined) {
                acc[key] = stripUndefined(value);
            }
            return acc;
        }, {} as Record<string, any>);
    }
    return obj;
}