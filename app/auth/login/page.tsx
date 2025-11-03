// signature-trader/app/auth/login/page.tsx (Complete Code)
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MoveLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image"; 
import { useRouter, useSearchParams } from "next/navigation"; 
import { useTheme } from "next-themes";
import EmailPasswordForm from "@/components/auth/EmailPasswordForm";
import GoogleSignInButton from "@/components/auth/GoogleSignInButton";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";


export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const { isLoggedIn, isInitialized } = useAuthStore(); 
  const router = useRouter();
  const searchParams = useSearchParams(); 
  const { theme } = useTheme(); 
  const [mounted, setMounted] = useState(false); 
  
  const toggleMode = () => setIsSignUp(!isSignUp);

  const redirectPath = searchParams.get('redirect') || '/'; 

  useEffect(() => {
    setMounted(true);
    // Redirect logic relies on isInitialized
    if (isInitialized && isLoggedIn) {
        router.push(redirectPath); 
    }
    // We keep the onAuthStateChanged in Navbar, but here's a defensive setup:
    const unsubscribe = onAuthStateChanged(auth, (user) => {
        useAuthStore.getState().setAuthUser(user);
    });
    return () => unsubscribe();
  }, [isInitialized, isLoggedIn, router, redirectPath]);

  const logoSrc = mounted && theme === "dark" ? "/signature-logo-white.png" : "/signature-logo.png";


  const title = isSignUp ? "Create Your Account" : "Welcome Back";
  const subtitle = isSignUp ?  "Sign up to your Shopping Store.": "Sign in to start Shopping";

  // Show loading state until global store is initialized
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#FFCE00]" />
      </div>
    );
  }

  // If initialized and NOT logged in, show the form
  return (
    <section className="min-h-screen bg-background text-foreground flex items-center justify-center py-12 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md p-8 space-y-8 bg-card rounded-2xl shadow-xl border border-border"
      >
        <div className="flex justify-start">
          <Link
            href="/"
            className="text-muted-foreground hover:text-foreground flex items-center gap-2 transition-colors"
          >
            <MoveLeft className="w-4 h-4" /> Back to Home
          </Link>
        </div>

        {/* LOGO SECTION */}
        <div className="flex justify-center -mt-4 mb-4">
            {mounted && (
                <Image
                    src={logoSrc}
                    alt="Signature Trader Logo"
                    width={180}
                    height={40}
                    className="h-10 sm:h-12 w-auto object-contain"
                />
            )}
        </div>
        
        <div className="text-center">
          <h1 className="text-3xl font-bold text-[#FFCE00]">{title}</h1>
          <p className="text-muted-foreground mt-2">{subtitle}</p>
        </div>

        {/* Google Sign-in/Sign-up Button */}
        <GoogleSignInButton 
            redirectPath={redirectPath} 
            isSignUpMode={isSignUp} // <-- PASS THE CURRENT MODE
        /> 

        <div className="relative flex items-center">
          <div className="grow border-t border-border" />
          <span className="shrink mx-4 text-muted-foreground text-sm">
            OR
          </span>
          <div className="grow border-t border-border" />
        </div>

        {/* Email/Password Form */}
        <EmailPasswordForm
          isSignUp={isSignUp}
          toggleMode={toggleMode}
          redirectPath={redirectPath} 
        />
      </motion.div>
    </section>
  );
}