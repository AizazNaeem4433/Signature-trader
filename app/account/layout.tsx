// signature-trader/app/account/layout.tsx (NEW FILE)
"use client";

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Loader2, LogOut, User, Package, LayoutDashboard, Phone, MapPin } from 'lucide-react'; // Added phone and map for profile example
import { useAuthStore } from '@/lib/store/useAuthStore';
import { useNotificationStore } from '@/lib/store/useNotificationStore';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { cn } from '@/lib/utils';

// Array defining the sidebar navigation links
const navItems = [
    { name: 'Dashboard', href: '/account', Icon: LayoutDashboard },
    { name: 'Profile', href: '/account/profile', Icon: User },
    { name: 'Orders', href: '/account/orders', Icon: Package },
];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
    const { isLoggedIn, isInitialized, user } = useAuthStore();
    const { addNotification } = useNotificationStore();
    const router = useRouter();
    const pathname = usePathname();

    // 1. Client-Side Protection (redirects non-logged-in users)
    useEffect(() => {
        if (isInitialized && !isLoggedIn) {
            router.push("/auth/login?redirect=/account");
        }
    }, [isInitialized, isLoggedIn, router]);

    // 2. Logout Handler
    const handleLogout = async () => {
        await signOut(auth);
        addNotification("You have been successfully logged out.", "info");
        router.push('/');
    };

    // Show Loader while authenticating/initializing
    if (!isInitialized || !isLoggedIn) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#FFCE00]" />
                <p className="ml-4 text-muted-foreground">Loading account...</p>
            </div>
        );
    }

    // Determine the active path for highlighting the sidebar item
    const isActive = (href: string) => 
        pathname === href || (href === '/account' && pathname === '/account');

    // 3. Render Layout (only for logged-in users)
    return (
        <motion.main
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="max-w-7xl mx-auto px-4 sm:px-6 py-12 min-h-screen"
        >
            <h1 className="sr-only">User Account Dashboard</h1>
            
            <div className="grid md:grid-cols-[250px_1fr] gap-8">
                
                {/* === STATIC SIDEBAR NAVIGATION === */}
                <aside className="bg-card p-6 rounded-xl shadow-lg border border-border sticky top-28 h-fit">
                    <nav className="space-y-2">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors",
                                    isActive(item.href)
                                        ? "bg-[#FFCE00] text-black shadow-md"
                                        : "text-foreground hover:bg-muted/60 dark:hover:bg-muted/30"
                                )}
                            >
                                <item.Icon className="w-5 h-5" />
                                {item.name}
                            </Link>
                        ))}
                    </nav>
                    
                    {/* Logout Button */}
                    <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={handleLogout}
                        className="w-full mt-6 flex items-center justify-center gap-3 bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-3 rounded-lg transition-colors shadow-md"
                    >
                        <LogOut className="w-5 h-5" />
                        Logout
                    </motion.button>
                </aside>

                {/* === DYNAMIC CONTENT AREA === */}
                <section className="bg-card p-6 rounded-xl shadow-lg border border-border">
                    {children}
                </section>
            </div>
        </motion.main>
    );
}