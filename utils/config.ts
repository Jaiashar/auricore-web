// utils/config.ts

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

export const config = {
    serpApi: {
        apiKey: process.env.SERPAPI_KEY || '',
        baseUrl: 'https://serpapi.com',
    },
    firebase: {
        // Admin credentials (for secure server-side tasks)
        projectId: process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
        privateKey: process.env.FIREBASE_PRIVATE_KEY
            ? process.env.FIREBASE_PRIVATE_KEY
                .replace(/\\n/g, '\n')
                .replace(/^"(.*)"$/, '$1')
            : '',
        // Client-side configuration (used in browser/client components)
        client: {
            apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
            authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
            storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
            messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
            appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
            measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || '',
        },
    },
    openAi: {
        apiKey: process.env.OPENAI_API_KEY || '',
    },
};

export function validateEnvironment() {
    const missingVars = [];
    if (!config.serpApi.apiKey) missingVars.push('SERPAPI_KEY');
    if (!config.firebase.projectId) missingVars.push('FIREBASE_PROJECT_ID');
    if (!config.firebase.clientEmail) missingVars.push('FIREBASE_CLIENT_EMAIL');
    if (!config.firebase.privateKey) missingVars.push('FIREBASE_PRIVATE_KEY');
    if (!config.openAi.apiKey) missingVars.push('OPENAI_API_KEY');

    return {
        isValid: missingVars.length === 0,
        missingVars,
    };
}

/**
 * Initializes and returns a Firebase Firestore instance using the client configuration.
 */
export function getFirebaseDb() {
    // Initialize Firebase using client-specific configuration
    const firebaseClientConfig = config.firebase.client;

    const app = !getApps().length ? initializeApp(firebaseClientConfig) : getApp();
    const db = getFirestore(app);

    return db;
}

export default config;
