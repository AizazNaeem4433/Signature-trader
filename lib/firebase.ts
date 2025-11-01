// signature-trader/lib/firebase.ts (Complete Code)
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, type User as FirebaseUser } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore"; 


const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID!,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app); 
export default app;

// FIX: Set the default argument explicitly to { displayName: null }
export const createUserProfileDocument = async (user: FirebaseUser, additionalData: { displayName: string | null } = { displayName: null }) => {
    const userRef = doc(db, 'users', user.uid);

    const userSnapshot = await getDoc(userRef);

    if (!userSnapshot.exists()) {
        const { email, displayName, photoURL } = user;
        const createdAt = new Date();
        
        const userData = {
            displayName: displayName || additionalData.displayName || (email ? email.split('@')[0] : 'New User'), 
            email,
            photoURL: photoURL || '',
            createdAt,
            role: 'user', 
        };
        
        try {
            await setDoc(userRef, userData);
        } catch (error) {
            console.error("Error creating user document", error);
        }
    }
    return getDoc(userRef);
};