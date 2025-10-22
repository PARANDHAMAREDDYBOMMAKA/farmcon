// Firebase Admin SDK for server-side operations
import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  try {
    // Check if we have the service account credentials
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    if (serviceAccount) {
      // Initialize with service account (production)
      admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(serviceAccount)),
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'farmcon-7d1b1',
      });
    } else {
      // Initialize with application default credentials (development)
      // You'll need to set up a service account key for production
      admin.initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'farmcon-7d1b1',
      });
    }

    console.log('Firebase Admin initialized successfully');
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
  }
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
export default admin;
