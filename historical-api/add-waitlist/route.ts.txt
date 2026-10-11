import { NextRequest, NextResponse } from "next/server";
import {
    generateWaitlistConfirmationEmail,
    generateInternalWaitlistNotificationEmail,
} from "@/utils/waitlistEmailTemplates";
import { sendEmail } from "@/utils/emailTemplates";
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Firebase configuration
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function getFirebaseApp() {
    try {
        // Check if an app is already initialized
        if (getApps().length === 0) {
            return initializeApp(firebaseConfig);
        }
        return getApp();
    } catch (error) {
        console.error("Firebase App Initialization Error:", error);
        throw new Error("Failed to initialize Firebase");
    }
}

// Singleton Firestore initialization
function getFirebaseFirestore() {
    try {
        const app = getFirebaseApp();
        return getFirestore(app);
    } catch (error) {
        console.error("Firestore Initialization Error:", error);
        throw new Error("Failed to get Firestore instance");
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = (await request.json()) as {
            email: string;
        };

        const { email } = body;

        if (!email) {
            return NextResponse.json(
                { error: "Missing email" },
                { status: 400 }
            );
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        // If the email is invalid, return an error response
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: "Invalid email format" },
                { status: 400 }
            );
        }

        let firestoreError = null;
        let firestoreSuccess = false;
        try {
            const db = getFirebaseFirestore();

            // Check for existing email
            const emailQuery = query(
                collection(db, "waitlistEmails"),
                where("email", "==", email)
            );
            const existingEmails = await getDocs(emailQuery);

            if (!existingEmails.empty) {
                return NextResponse.json(
                    { error: "Email already registered" },
                    { status: 409 }
                );
            }

            // add new email to firestore
            const firestoreResult = await addDoc(
                collection(db, "waitlistEmails"),
                {
                    email: email,
                    createdAt: new Date(),
                }
            );
            firestoreSuccess = true;
        } catch (error) {
            console.error("Error adding document to Firestore:", error);
            firestoreError = error;
            firestoreSuccess = false;
        }

        // Generate email HTML and send confirmation email to customer
        const customerEmailHtml = generateWaitlistConfirmationEmail(email);
        const customerEmailResult = await sendEmail(
            email,
            "Welcome to the Auricore AI Waitlist",
            customerEmailHtml
        );

        // send internal notification
        const internalEmailResult = await sendEmail(
            process.env.ADMIN_EMAIL || "info@auricore.ai",
            `New Waitlist Signup: ${email}`,
            generateInternalWaitlistNotificationEmail(email)
        );

        return NextResponse.json({
            success: customerEmailResult.success,
            message: customerEmailResult.success
                ? "Confirmation email sent successfully"
                : "Failed to send email",
            customerEmail: customerEmailResult,
            internalEmail: internalEmailResult,
            firestoreSuccess: firestoreSuccess,
            firestoreError: firestoreError,
        });
    } catch (error: unknown) {
        const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
        console.error("Error sending confirmation email:", error);
        return NextResponse.json(
            {
                error: "Internal server error",
                message: errorMessage,
                data: error,
            },
            { status: 500 }
        );
    }
}
