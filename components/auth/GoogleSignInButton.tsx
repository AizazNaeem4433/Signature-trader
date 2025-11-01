// signature-trader/components/auth/GoogleSignInButton.tsx (Complete Code)
"use client";

import { auth, provider, createUserProfileDocument, db } from "@/lib/firebase"; // <-- Import db
import { signInWithPopup } from "firebase/auth";
import { doc, getDoc } from 'firebase/firestore'; // <-- Import Firestore functions
import { FcGoogle } from "react-icons/fc";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function GoogleSignInButton({ 
  redirectPath 
}: { 
  redirectPath: string 
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter(); 

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // --- GOOGLE SIGN-IN VALIDATION CHECK ---
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        // User document found: proceed normally, ensuring document is up-to-date (optional step)
        await createUserProfileDocument(user); // Re-run creation helper to ensure data/role exists
      } else {
        // User exists in Auth but NOT in Firestore: force sign out and redirect to sign-up view.
        await auth.signOut();
        throw new Error('auth/user-profile-missing');
      }
      // --- END GOOGLE SIGN-IN VALIDATION CHECK ---

      router.push(redirectPath);
    } catch (err: any) {
      console.error(err);
      
      let errorMessage = "An error occurred during Google sign-in.";
      if (err.message && err.message.includes('auth/user-profile-missing')) {
          errorMessage = 'Account not fully set up. Please use the Sign Up option.';
      } else if (err.code && err.code.includes('auth/popup-closed-by-user')) {
          // Ignore popup close error
          errorMessage = '';
      }
      
      if (errorMessage) {
          // A simple alert is used here, but for better UX, you might want to integrate this error into the parent page state
          alert(errorMessage); 
      }
      
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleGoogleSignIn}
      disabled={loading}
      className="w-full flex items-center justify-center gap-2 border border-gray-300 rounded-md px-4 py-2 hover:bg-gray-50 transition"
    >
      <FcGoogle className="text-xl" />
      {loading ? "Signing in..." : "Sign in with Google"}
    </button>
  );
}