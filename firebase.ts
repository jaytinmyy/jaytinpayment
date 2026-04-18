import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// Enhanced Firestore configuration to handle stream timeouts in sandboxed/proxy environments
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  useFetchStreams: false,
}, firebaseConfig.firestoreDatabaseId);

export const auth = getAuth(app);

// CRITICAL: Test connectivity on boot
async function testConnection() {
  try {
    await getDocFromServer(doc(db, '_connection_test_', 'init'));
    console.log("Firebase Connectivity: OK");
  } catch (error: any) {
    if (error?.message?.includes('the client is offline')) {
      console.error("Please check your Firebase configuration or internet connection.");
    } else if (error?.code !== 'permission-denied') { // permission-denied is expected for the dummy doc
      console.error("Firestore connectivity warning:", error);
    }
  }
}

testConnection();
