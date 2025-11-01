// signature-trader/app/admin/page.tsx
"use client";

import { useAuthStore } from "@/lib/store/useAuthStore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { Loader2, Shield } from "lucide-react";
import { motion } from "framer-motion";

export default function AdminPage() {
  const { role, isLoggedIn, isInitialized } = useAuthStore();
  const router = useRouter();

  // Client-side protection logic
  useEffect(() => {
    // Wait until the store is initialized (role is loaded) before checking access
    if (isInitialized) {
        if (!isLoggedIn || role !== 'admin') {
            // Redirect non-admins or logged-out users to the home page
            router.push('/'); 
        }
    }
  }, [role, isLoggedIn, isInitialized, router]);

  // Show a loading screen until the role is definitively determined
  if (!isInitialized || (isLoggedIn && role === null)) {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#FFCE00]" />
            <p className="ml-4 text-muted-foreground">Verifying administrator access...</p>
        </div>
    );
  }
  
  // If initialized, but access is denied (should be caught by useEffect, but rendered briefly)
  if (role !== 'admin') {
     return (
        <div className="min-h-screen flex items-center justify-center">
            <p className="text-xl font-medium text-destructive">🛑 Access Denied</p>
        </div>
     );
  } 

  // Admin content - Rendered only if role === 'admin'
  return (
    <motion.main 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-7xl mx-auto px-6 py-20 min-h-screen bg-card text-foreground"
    >
      <h1 className="text-5xl font-bold mb-6 text-red-500 flex items-center gap-3">
        <Shield className="w-10 h-10"/> Admin Dashboard
      </h1>
      <p className="text-lg text-muted-foreground">
        Welcome, Administrator! This is where you manage inventory, orders, and user roles.
      </p>
      
      <div className="mt-12 space-y-6">
        <h2 className="text-3xl font-semibold text-[#FFCE00]">Store Management</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-muted/50 p-6 rounded-lg border border-border">
                <h3 className="font-bold text-xl">Products</h3>
                <p className="text-sm text-muted-foreground">Add, edit, or delete items.</p>
                <Link href="#" className="text-sm text-red-500 hover:underline mt-2 inline-block">Manage Products</Link>
            </div>
            <div className="bg-muted/50 p-6 rounded-lg border border-border">
                <h3 className="font-bold text-xl">Orders</h3>
                <p className="text-sm text-muted-foreground">View and process all customer orders.</p>
                <Link href="#" className="text-sm text-red-500 hover:underline mt-2 inline-block">View Orders</Link>
            </div>
             <div className="bg-muted/50 p-6 rounded-lg border border-border">
                <h3 className="font-bold text-xl">Users & Roles</h3>
                <p className="text-sm text-muted-foreground">Manage user accounts and permissions.</p>
                <Link href="#" className="text-sm text-red-500 hover:underline mt-2 inline-block">Manage Users</Link>
            </div>
        </div>
      </div>
    </motion.main>
  );
}