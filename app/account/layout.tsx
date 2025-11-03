// signature-trader/app/account/layout.tsx (NEW FILE)
"use client";

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Loader2, LogOut, User, Package, LayoutDashboard } from 'lucide-react'; 
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
    // Uses startsWith to handle nested routes like /account/orders/123
    const isActive = (href: string) => 
        pathname === href || (href !== '/account' && pathname.startsWith(href)) || (href === '/account' && pathname === '/account');

    // 3. Render Layout (only for logged-in users)
    return (
        <motion.main
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            // Max width and padding
            className="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-12 min-h-screen" 
        >
            <h1 className="sr-only">User Account Dashboard</h1>
            
            {/* Responsive Grid:
              - Mobile/Small: Stacks the two columns (sidebar is full-width nav row, then content below)
              - Medium+ (md): Grid layout: 250px sidebar on the left, 1fr content on the right
            */}
            <div className="space-y-8 md:grid md:grid-cols-[250px_1fr] md:gap-8">
                
                {/* === RESPONSIVE NAVIGATION/SIDEBAR === */}
                <aside className="
                    bg-card p-4 md:p-6 rounded-xl shadow-lg border border-border 
                    sticky md:top-28 md:h-fit 
                    w-full 
                ">
                    <nav 
                        // Mobile: flex row with wrap, scrollable if necessary
                        className="flex md:block space-x-2 md:space-x-0 md:space-y-2 overflow-x-auto pb-2 md:pb-0" 
                    >
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center justify-center md:justify-start gap-2 md:gap-3 px-3 py-2 md:px-4 md:py-3 rounded-lg font-medium transition-colors flex-shrink-0", // Added flex-shrink-0
                                    isActive(item.href)
                                        ? "bg-[#FFCE00] text-black shadow-md"
                                        : "text-foreground hover:bg-muted/60 dark:hover:bg-muted/30"
                                )}
                            >
                                <item.Icon className="w-5 h-5" />
                                {/* Mobile: Hide name, show only icon. Only show name on medium+ screens */}
                                <span className="hidden md:inline">{item.name}</span> 
                            </Link>
                        ))}
                    </nav>
                    
                    {/* Logout Button: Always full width on mobile/desktop */}
                    <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={handleLogout}
                        // Added margin top utility for both mobile and desktop
                        className="w-full mt-4 md:mt-6 flex items-center justify-center gap-3 bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-3 rounded-lg transition-colors shadow-md text-sm md:text-base"
                    >
                        <LogOut className="w-5 h-5" />
                        Logout
                    </motion.button>
                </aside>

                {/* === DYNAMIC CONTENT AREA === */}
                <section className="bg-card p-4 sm:p-6 rounded-xl shadow-lg border border-border"> 
                    {children}
                </section>
            </div>
        </motion.main>
    );
}