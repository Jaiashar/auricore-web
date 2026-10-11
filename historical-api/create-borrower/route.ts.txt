// app/api/create-borrower/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import * as admin from 'firebase-admin';
import config from '@/utils/config';

/* ================================
   Firebase Initialization
   ================================ */
if (!admin.apps.length) {
    try {
        console.log("Initializing Firebase Admin...");
        if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
            console.log("Using Base64 service account approach");
            const serviceAccountString = Buffer.from(
                process.env.FIREBASE_SERVICE_ACCOUNT_BASE64,
                'base64'
            ).toString('utf8');
            const serviceAccount = JSON.parse(serviceAccountString);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
            console.log("Firebase initialized with Base64 service account");
        } else {
            console.log("Using traditional credential approach (fallback)");
            const privateKey = process.env.FIREBASE_PRIVATE_KEY || '';
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
                    privateKey: privateKey.replace(/\\n/g, '\n')
                } as admin.ServiceAccount)
            });
        }
        console.log("Firebase Admin initialized successfully");
    } catch (error) {
        console.error("Firebase admin initialization error:", error);
    }
}

const db = getFirestore();

/* ================================
   Type Definitions (Minimal)
   ================================ */
interface CustomerInfo {
    name?: string;
    email?: string;
}

interface SelectedMatch {
    title?: string;
    criticalAttributes?: {
        title?: string;
        [key: string]: any;
    };
    [key: string]: any;
}

interface PricingData {
    marketValueRange?: { low: number; high: number };
    offerAmountRange?: { low: number; high: number };
    [key: string]: any;
}

interface ApplicationData {
    customerInfo?: CustomerInfo;
    items?: {
        id: string;
        category?: string;
        condition?: string;
        dynamicFields?: Record<string, any>;
        itemDescription?: string;
        photos?: any;
        // Removed title field
    }[];
    selectedMatches?: Record<string, SelectedMatch>;
    selectedMatch?: SelectedMatch;
    pricingData?: Record<string, PricingData>;
    [key: string]: any;
}

/* ================================
   Main Handler
   ================================ */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { applicationId } = body as { applicationId?: string };

        if (!applicationId) {
            return NextResponse.json({ error: 'Missing application ID' }, { status: 400 });
        }

        // Fetch the application document
        const applicationRef = db.collection('applications').doc(applicationId);
        const applicationDoc = await applicationRef.get();
        if (!applicationDoc.exists) {
            return NextResponse.json({ error: 'Application not found' }, { status: 404 });
        }
        const appData = applicationDoc.data() as ApplicationData;
        if (!appData) {
            return NextResponse.json({ error: 'Application data is empty' }, { status: 400 });
        }

        // Ensure pricing data and customer info are available.
        if (!appData.pricingData) {
            return NextResponse.json({ error: 'Pricing data not available yet', status: 'pending' }, { status: 202 });
        }
        if (!appData.customerInfo || !appData.customerInfo.email) {
            return NextResponse.json({ error: 'Customer information not available' }, { status: 400 });
        }

        const customerInfo = appData.customerInfo;
        const pricingData = appData.pricingData;
        const items = appData.items || [];
        // Even though selectedMatches processing was used for title before, it is no longer required.
        // const selectedMatches = appData.selectedMatches || {};

        /* --- Borrower Lookup/Creation (Minimal) --- */
        const borrowersRef = db.collection('borrowers');
        const borrowerQuery = await borrowersRef
            .where('email', '==', customerInfo.email)
            .limit(1)
            .get();
        let borrowerId: string;
        if (!borrowerQuery.empty) {
            // Update existing borrower: add applicationId and items later.
            borrowerId = borrowerQuery.docs[0].id;
            await borrowersRef.doc(borrowerId).update({
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                applications: admin.firestore.FieldValue.arrayUnion(applicationId),
            });
            console.log(`✅ Updated existing borrower: ${borrowerId}`);
        } else {
            // Create new borrower with minimal info.
            const newBorrowerRef = borrowersRef.doc();
            borrowerId = newBorrowerRef.id;
            const borrowerData = {
                id: borrowerId,
                name: customerInfo.name || 'Unknown',
                email: customerInfo.email,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                applications: [applicationId],
                items: []  // Will add item ids later.
            };
            await newBorrowerRef.set(borrowerData);
            console.log(`✅ Created new borrower: ${borrowerId}`);
        }

        /* --- Process Each Item (Storing Full Item Info) --- */
        const itemsCollection = db.collection('items');
        const processedItemIds: string[] = [];
        // For each item, let Firestore assign a random document id.
        for (const item of items) {
            // Get pricing info for this item.
            const itemPricing: PricingData = pricingData[item.id] || {};
            const marketValueRange = itemPricing.marketValueRange || { low: 0, high: 0 };
            const offerAmountRange = itemPricing.offerAmountRange || { low: 0, high: 0 };

            // Build the item document without using a "title" field.
            // Also include the original item id in case it is needed for reference.
            const structuredItem = {
                applicationId,
                originalItemId: item.id,
                category: item.category || '',
                condition: item.condition || '',
                dynamicFields: item.dynamicFields || {},
                itemDescription: item.itemDescription || '',
                photos: item.photos || [],
                pricing: {
                    marketValueRange,
                    offerAmountRange
                },
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            };

            // Let Firestore generate a random ID.
            const itemDocRef = itemsCollection.doc();
            const generatedId = itemDocRef.id;
            await itemDocRef.set(structuredItem);
            processedItemIds.push(generatedId);
            console.log(`✅ Stored item record: ${generatedId} for application: ${applicationId}`);
        }

        /* --- Update Application with Borrower and Item Info --- */
        await applicationRef.update({
            borrower_id: borrowerId,
            borrowerCreatedAt: admin.firestore.FieldValue.serverTimestamp(),
            itemsProcessed: processedItemIds, // List of item document ids
        });
        // Update borrower document with the list of item ids.
        await borrowersRef.doc(borrowerId).update({
            items: admin.firestore.FieldValue.arrayUnion(...processedItemIds)
        });

        return NextResponse.json({
            success: true,
            borrowerId,
            items: processedItemIds,
        });
    } catch (error: any) {
        console.error('Error creating borrower entry:', error);
        return NextResponse.json(
            { error: 'Internal server error', message: error.message },
            { status: 500 }
        );
    }
}
