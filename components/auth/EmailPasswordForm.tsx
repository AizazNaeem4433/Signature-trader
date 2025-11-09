// signature-trader/components/auth/EmailPasswordForm.tsx (Complete Code)
"use client";

import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification // <-- NAYA IMPORT
} from "firebase/auth";
import { auth, createUserProfileDocument, db } from "@/lib/firebase"; 
import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useNotificationStore } from "@/lib/store/useNotificationStore"; 

interface EmailPasswordFormProps {
  isSignUp: boolean;
  toggleMode: () => void;
  redirectPath: string;
}

export default function EmailPasswordForm({
  isSignUp,
  toggleMode,
  redirectPath,
}: EmailPasswordFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { addNotification } = useNotificationStore(); 

  const actionText = isSignUp ? "Sign Up" : "Sign In";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let userCredential;

      if (isSignUp) {
        if (!fullName.trim()) {
            throw new Error('auth/missing-full-name');
        }

        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // --- NAYA CODE: Verification email send karein ---
        // Profile document bananay se pehle email bhej dein
        await sendEmailVerification(userCredential.user);
        // --- NAYA CODE END ---

        await createUserProfileDocument(userCredential.user, { displayName: fullName.trim() });
        
        // Notification ko update karein
        addNotification(`Welcome, ${fullName.trim()}! A verification email has been sent.`, "success"); 

      } else {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
          await auth.signOut();
          throw new Error('auth/user-profile-missing');
        }
        
        const userData = userDoc.data() as { displayName?: string };
        const name = userData.displayName || user.displayName || 'User';

        addNotification(`Signed in successfully! Welcome back, ${name}.`, "success");
      }
      
      router.push(redirectPath);

    } catch (err: any) {
      let customMessage = "An unexpected network or system error occurred.";
      
      if (typeof err === 'object' && err !== null && 'code' in err) {
        const firebaseError = err as { code: string, message: string };
        
        switch (firebaseError.code) {
          case 'auth/missing-full-name': 
            customMessage = 'Please enter your full name to create an account.';
            break;
          case 'auth/user-profile-missing': 
            customMessage = 'Account not found. Please create a new account.';
            break;
          case 'auth/invalid-email':
          case 'auth/user-not-found':
          case 'auth/wrong-password':
          case 'auth/invalid-credential':
            customMessage = 'Invalid email or password.';
            break;
          case 'auth/email-already-in-use':
            customMessage = 'This email is already in use.';
            break;
          case 'auth/weak-password':
            customMessage = 'Password should be at least 6 characters.';
            break;
          case 'auth/operation-not-allowed':
             customMessage = 'Sign-in method not allowed. Please contact support.';
             break;
          default:
            const messagePart = firebaseError.message.split('(')[0].trim();
            customMessage = messagePart || "An unknown error occurred.";
        }
      } 
      setError(customMessage);
      addNotification(customMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className={isSignUp ? '' : 'hidden'}>
        <Label htmlFor="fullName">Full Name</Label>
        <Input
          id="fullName"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="e.g., John Doe"
          required={isSignUp} 
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="********"
          required
          className="mt-1"
        />
      </div>

      {error && (
        <p className="text-sm text-destructive font-medium bg-destructive/10 p-2 rounded-md border border-destructive/30">
          {error}
        </p>
      )}

      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-[#FFCE00] hover:bg-[#e6b800] text-black font-semibold"
      >
        {loading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          actionText
        )}
      </Button>
      
      <p className="text-center text-sm text-muted-foreground">
        {isSignUp
          ? "Already have an account?"
          : "Don't have an account?"}{" "}
        <button
          type="button"
          onClick={toggleMode}
          className="text-[#FFCE00] font-medium hover:underline transition-colors"
        >
          {isSignUp ? "Sign In" : "Create Account"}
        </button>
      </p>
    </form>
  );
}