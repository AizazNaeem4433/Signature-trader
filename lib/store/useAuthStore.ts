// signature-trader/lib/store/useAuthStore.ts (Complete Code)
import { create } from 'zustand';
import { type User as FirebaseUser } from "firebase/auth";
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

// Define the User Profile Data structure read from Firestore
interface UserProfile {
    displayName: string;
    email: string;
    role: 'user' | 'admin';
}

// Define the shape of your store state
interface AuthState {
  user: FirebaseUser | null;
  isLoggedIn: boolean;
  role: 'user' | 'admin' | null;
  isInitialized: boolean; 
  // This interface signature is correct
  setAuthUser: (user: FirebaseUser | null) => void; 
}

// The inner function in the implementation must match the interface exactly
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoggedIn: false,
  role: null, 
  isInitialized: false, 
  
  // FIX: The signature in the implementation block is correct and robustly handles the single 'user' argument.
  setAuthUser: async (user) => { 
    const isLoggedIn = !!user;
    let userRole: 'user' | 'admin' | null = null;

    if (user) {
      try {
        const userDocRef = doc(db, 'users', user.uid);
        
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const data = userDoc.data() as UserProfile;
          userRole = data.role || 'user'; 
        } else {
            console.warn("User document not found in Firestore. Assuming 'user' role.");
            userRole = 'user';
        }
      } catch (error) {
        console.error("Error fetching user role from Firestore:", error);
        userRole = 'user'; 
      }
    }
    
    set({
      user,
      isLoggedIn,
      role: userRole,
      isInitialized: true, 
    });
  },
}));