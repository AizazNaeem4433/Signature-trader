// signature-trader/components/auth/GoogleSignInButton.tsx
"use client";

import { auth, provider, createUserProfileDocument, db } from "@/lib/firebase";
import { signInWithPopup } from "firebase/auth";
import { doc, getDoc } from 'firebase/firestore';
import { FcGoogle } from "react-icons/fc";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useNotificationStore } from "@/lib/store/useNotificationStore"; 

interface GoogleSignInButtonProps {
    redirectPath: string;
    isSignUpMode: boolean; // <-- NEW PROP
}

export default function GoogleSignInButton({ 
  redirectPath,
  isSignUpMode, // <-- Use the new prop
}: GoogleSignInButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter(); 
  const { addNotification } = useNotificationStore();

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // --- VALIDATION CHECK ---
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        // User document found (Existing user): Update profile and proceed to Sign In.
        await createUserProfileDocument(user); 
        addNotification("Signed in with Google successfully!", "success");

      } else if (isSignUpMode) {
        // User is new (only exists in Auth, not Firestore) AND we are in Sign Up mode:
        // Finalize registration by creating the Firestore document.
        await createUserProfileDocument(user);
        addNotification(`Account created with Google successfully! Welcome, ${user.displayName || 'User'}.`, "success");

      } else {
        // User is new but clicked the "Sign In" button: Force sign out and guide them to Sign Up.
        await auth.signOut();
        throw new Error('auth/user-profile-missing');
      }
      
      router.push(redirectPath);

    } catch (err: any) {
      console.error(err);
      
      let errorMessage = "An error occurred during Google sign-in.";
      
      if (err.code === 'auth/popup-closed-by-user') {
          errorMessage = 'Sign-in window closed. Please try again.'; 
          addNotification(errorMessage, "info");
      } else if (err.message && err.message.includes('auth/user-profile-missing')) {
          errorMessage = 'Account not found. Please use the Sign Up option.';
          addNotification(errorMessage, "error");
      } else {
          errorMessage = err.message || errorMessage;
          addNotification(errorMessage, "error");
      }
      
    } finally {
      setLoading(false);
    }
  };

  const buttonText = isSignUpMode ? "Sign up with Google" : "Sign in with Google";

  return (
    <button
      onClick={handleGoogleSignIn}
      disabled={loading}
      className="w-full flex items-center justify-center gap-2 border border-gray-300 rounded-md px-4 py-2 hover:bg-gray-50 transition"
    >
      <FcGoogle className="text-xl" />
      {loading ? "Processing..." : buttonText}
    </button>
  );
}