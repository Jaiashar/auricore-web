// File: app/api/create-lender/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import * as admin from 'firebase-admin';
import {
  sendEmail,
  generateLenderConfirmationEmail,
  generateInternalLenderNotificationEmail,
} from '@/utils/emailTemplates';

/* ================================
   Firebase Admin Initialization
   ================================ */
if (!admin.apps.length) {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    const svc = JSON.parse(
      Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64!, 'base64').toString()
    );
    admin.initializeApp({ credential: admin.credential.cert(svc) });
  } else {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
        privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
      } as admin.ServiceAccount),
    });
  }
}

const db = getFirestore();

export async function POST(request: NextRequest) {
  try {
    const { 
      firstName, 
      lastName, 
      email, 
      amount, 
      isRateBoosted, 
      promoCode 
    } = (await request.json()) as {
      firstName?: string;
      lastName?: string;
      email?: string;
      amount?: number;
      isRateBoosted?: boolean;
      promoCode?: string | null;
    };

    if (
      !firstName ||
      !lastName ||
      !email ||
      typeof amount !== 'number' ||
      amount < 500
    ) {
      return NextResponse.json(
        { error: 'Missing fields or amount too low' },
        { status: 400 }
      );
    }

    // Additional server-side validation for promo codes
    // In a real application, you might want to fetch valid codes from the database
    const validPromoCodes = ["CODEBOOST", "VIP2025", "PREMIUM"];
    
    // Verify the rate boost is legitimate
    let rateBoostVerified = false;
    if (isRateBoosted && promoCode) {
      rateBoostVerified = validPromoCodes.includes(promoCode.trim().toUpperCase());
    }

    const lendersRef = db.collection('lenders');
    const existing = await lendersRef.where('email', '==', email).limit(1).get();

    let lenderId: string;
    if (!existing.empty) {
      // update existing
      lenderId = existing.docs[0].id;
      await lendersRef.doc(lenderId).update({
        amount, // overwrite or you could arrayUnion
        isRateBoosted: rateBoostVerified,
        promoCode: rateBoostVerified ? promoCode : null,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } else {
      // create new
      const docRef = lendersRef.doc();
      lenderId = docRef.id;
      await docRef.set({
        id: lenderId,
        firstName,
        lastName,
        email,
        amount,
        isRateBoosted: rateBoostVerified,
        promoCode: rateBoostVerified ? promoCode : null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    // send confirmation to lender
    const userEmailResult = await sendEmail(
      email,
      'Welcome to Auricore (Lender Signup)',
      generateLenderConfirmationEmail(firstName, lastName, email, amount, rateBoostVerified)
    );

    // send internal notification
    const internalEmailResult = await sendEmail(
      process.env.ADMIN_EMAIL || 'info@auricore.ai',
      `New Lender Signup: ${firstName} ${lastName}${rateBoostVerified ? ' (RATE BOOSTED)' : ''}`,
      generateInternalLenderNotificationEmail(firstName, lastName, email, amount, rateBoostVerified, promoCode)
    );

    return NextResponse.json({
      success: true,
      lenderId,
      isRateBoosted: rateBoostVerified,
      userEmail: userEmailResult,
      internalEmail: internalEmailResult,
    });
  } catch (err: any) {
    console.error('Error in create-lender:', err);
    return NextResponse.json(
      { error: 'Internal server error', message: err.message },
      { status: 500 }
    );
  }
}