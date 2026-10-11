import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import * as admin from 'firebase-admin';
import config from '@/utils/config';
import { generateCustomerConfirmationEmail, generateInternalNotificationEmail, sendEmail } from '@/utils/emailTemplates';

// Interfaces for type safety
interface CustomerInfo {
    name?: string;
    email?: string;
    [key: string]: any;
}

interface DynamicFields {
    brand?: string;
    model?: string;
    condition?: string;
    [key: string]: any;
}

interface Item {
    category?: string;
    condition?: string;
    dynamicFields?: DynamicFields;
    [key: string]: any;
}

interface StructuredAttributes {
    brand?: string;
    model?: string;
    [key: string]: any;
}

interface SelectedMatch {
    title?: string;
    structuredAttributes?: StructuredAttributes;
    [key: string]: any;
}

interface PricingData {
    confidence?: 'High' | 'Medium' | 'Low';
    marketValue?: number;
    disbursedAmount?: number;
    [key: string]: any;
}

interface ApplicationData {
    customerInfo?: CustomerInfo;
    items?: Item[];
    selectedMatch?: SelectedMatch;
    finalPricing?: {
        pricingData?: PricingData;
        selectedMatch?: SelectedMatch;
    };
    pricingData?: PricingData;
    // Add useCase and surveyUseCase fields
    useCase?: string;
    surveyUseCase?: string;
    [key: string]: any;
}

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

export async function POST(request: NextRequest) {
    try {
        const body = await request.json() as {
            applicationId?: string;
            email?: string;
        };

        const { applicationId, email } = body;

        if (!applicationId) {
            return NextResponse.json(
                { error: 'Missing application ID' },
                { status: 400 }
            );
        }

        // Get the application data from Firestore
        const applicationRef = db.collection('applications').doc(applicationId);
        const applicationDoc = await applicationRef.get();

        if (!applicationDoc.exists) {
            return NextResponse.json(
                { error: 'Application not found' },
                { status: 404 }
            );
        }

        const applicationData = applicationDoc.data() as ApplicationData | undefined;

        // Safely check for pricing data
        const pricingData =
            applicationData?.pricingData ||
            applicationData?.finalPricing?.pricingData;

        if (!pricingData) {
            return NextResponse.json(
                { error: 'Pricing data not available yet', status: 'pending' },
                { status: 202 }
            );
        }

        // Get customer info and pricing data
        const customerInfo = applicationData?.customerInfo || {};
        const customerName = customerInfo.name || 'Valued Customer';
        const customerEmail = email || customerInfo.email;

        if (!customerEmail) {
            return NextResponse.json(
                { error: 'Customer email not found' },
                { status: 400 }
            );
        }

        // Extract the use case from the application data
        // Check surveyUseCase first, then fall back to useCase or default to 'loan'
        const customerUseCase = applicationData?.surveyUseCase || 
                              applicationData?.useCase || 
                              customerInfo?.useCase || 
                              'loan';

        // Prepare items data
        const items = applicationData?.items || [];
        const selectedMatch =
            applicationData?.selectedMatch ||
            applicationData?.finalPricing?.selectedMatch;

        const pricingDataMap = applicationData?.pricingData; // This is the mapping of pricing data keyed by item id

        // Enhance items with pricing and match info
        const enhancedItems = items.map(item => {
            // Lookup pricing for this item using its id.
            const itemPricing = pricingDataMap ? pricingDataMap[item.id] : {};

            return {
                raw: item,
                cleaned: {
                    brand: item.dynamicFields?.brand ||
                        selectedMatch?.structuredAttributes?.brand ||
                        '',
                    model: item.dynamicFields?.model ||
                        selectedMatch?.structuredAttributes?.model ||
                        selectedMatch?.title ||
                        '',
                    category: item.category || '',
                    condition: item.condition ||
                        item.dynamicFields?.condition ||
                        '',
                    // You can include additional fields if needed
                },
                // Use the per-item pricing data here
                marketValue: itemPricing?.marketValue || 0,
                disbursedAmount: itemPricing?.disbursedAmount || 0,
                // Use the offerAmountRange from the pricing data. If not available, default to zero.
                offerAmountRange: itemPricing?.offerAmountRange || { low: 0, high: 0 }
            };
        });

        // Generate email HTML - pass the useCase parameter
        const customerEmailHtml = generateCustomerConfirmationEmail(
            customerName,
            customerEmail,
            applicationId,
            enhancedItems,
            customerUseCase // Pass the use case to the email generator
        );

        // Generate internal notification email
        const internalEmailHtml = generateInternalNotificationEmail(
            customerInfo,
            applicationId,
            enhancedItems
        );

        // Customize email subject based on use case
        let emailSubject = "Your Auricore Application Confirmation";
        
        if (customerUseCase === 'resell') {
            emailSubject = "Your Resale Valuation from Auricore";
        } else if (customerUseCase === 'price') {
            emailSubject = "Your Item Valuation from Auricore";
        } else if (customerUseCase === 'loan') {
            emailSubject = "Your Auricore Loan Offer";
        }

        // Send customer confirmation email
        const customerEmailResult = await sendEmail(
            customerEmail,
            emailSubject,
            customerEmailHtml
        );

        // Also send internal notification
        const internalEmailResult = await sendEmail(
            process.env.ADMIN_EMAIL || 'info@auricore.ai',
            `New Application Received: ${customerName} (${customerUseCase})`,
            internalEmailHtml
        );

        // Update application with email send status
        await applicationRef.update({
            emailSent: true,
            emailSentAt: admin.firestore.FieldValue.serverTimestamp(),
            emailStatus: customerEmailResult.success ? 'sent' : 'failed'
        });

        return NextResponse.json({
            success: customerEmailResult.success,
            message: customerEmailResult.success ? 'Confirmation email sent successfully' : 'Failed to send email',
            customerEmail: customerEmailResult,
            internalEmail: internalEmailResult
        });

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Error sending confirmation email:', error);
        return NextResponse.json(
            { error: 'Internal server error', message: errorMessage },
            { status: 500 }
        );
    }
}