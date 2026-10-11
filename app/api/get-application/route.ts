// app/api/get-application/route.ts
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
    try {
        console.log("Initializing Firebase Admin...");

        // Prioritize the Base64 service account approach
        if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
            try {
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
            } catch (base64Error) {
                console.error("Error with Base64 approach:", base64Error);
                throw base64Error;
            }
        }
        // Fallback to traditional approach only if Base64 isn't available
        else {
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

export async function GET(request: NextRequest) {
    try {
        // Get application ID from the URL query parameters
        const searchParams = request.nextUrl.searchParams;
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { error: 'Missing application ID parameter' },
                { status: 400 }
            );
        }

        // Get the application data
        console.log("Fetching application with ID:", id);
        const applicationRef = db.collection('applications').doc(id);
        const applicationDoc = await applicationRef.get();

        if (!applicationDoc.exists) {
            return NextResponse.json(
                { error: 'Application not found' },
                { status: 404 }
            );
        }

        const applicationData = applicationDoc.data() as Record<string, any>;

        // Check if applicationData is undefined
        if (!applicationData) {
            return NextResponse.json(
                { error: 'Application data is empty' },
                { status: 400 }
            );
        }

        // If there's a borrower ID, get the borrower data
        let borrowerData = null;
        if (applicationData.borrower_id) {
            const borrowerRef = db.collection('borrowers').doc(applicationData.borrower_id);
            const borrowerDoc = await borrowerRef.get();

            if (borrowerDoc.exists) {
                borrowerData = borrowerDoc.data();
            }
        }

        // Combine the data and return
        return NextResponse.json({
            success: true,
            application: {
                id: applicationDoc.id,
                ...applicationData
            },
            borrower: borrowerData ? {
                id: applicationData.borrower_id,
                ...borrowerData
            } : null
        }, { status: 200 });

    } catch (error: any) {
        console.error('Error retrieving application data:', error);
        return NextResponse.json(
            {
                error: 'Internal server error',
                message: error.message,
                code: error.code || 'unknown',
                details: error.details || 'No additional details'
            },
            { status: 500 }
        );
    }
}
