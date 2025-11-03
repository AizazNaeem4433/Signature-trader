// signature-trader/app/admin/layout.tsx
"use client";

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Loader2, Shield, LayoutDashboard, Boxes, List, Users, ShoppingBag, Percent } from 'lucide-react';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { useNotificationStore } from '@/lib/store/useNotificationStore';
import { cn } from '@/lib/utils';

const adminNavItems = [
    { name: 'Analytics', href: '/admin', Icon: LayoutDashboard },
    { name: 'Products', href: '/admin/products', Icon: Boxes },
    { name: 'Categories', href: '/admin/categories', Icon: List },
    { name: 'Orders', href: '/admin/orders', Icon: ShoppingBag },
    { name: 'Users & Roles', href: '/admin/users', Icon: Users },
    { name: 'Promo Codes', href: '/admin/promos', Icon: Percent },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { isLoggedIn, isInitialized, role } = useAuthStore();
    const router = useRouter();
    const pathname = usePathname();

    // 1. Client-Side Role Protection (Client fallback)
    useEffect(() => {
        if (isInitialized && (!isLoggedIn || role !== 'admin')) {
            // Insufficient permissions: redirect home and notify
            useNotificationStore.getState().addNotification("Access Denied: Administrator required.", "error");
            router.push('/');
        }
    }, [isInitialized, isLoggedIn, role, router]);

    // Show Loader while initialization/role check is ongoing
    if (!isInitialized || role !== 'admin') {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-red-500" />
                <p className="ml-4 text-red-500">Authenticating Admin Access...</p>
            </div>
        );
    }

    // Determine the active path (using startsWith for better routing)
    const isActive = (href: string) => 
        pathname === href || 
        (href !== '/admin' && pathname.startsWith(href)) || 
        (href === '/admin' && pathname === '/admin');


    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            // Added padding and fixed max-width for overall layout
            className="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-12 min-h-screen"
        >
            {/* Header: Always full width */}
            <h1 className="text-3xl sm:text-4xl font-bold mb-6 text-red-600 flex items-center gap-3">
                <Shield className='w-7 h-7 sm:w-8 sm:h-8' /> Admin CMS Dashboard
            </h1>
            
            {/* Responsive Grid: Stacks vertically on mobile, side-by-side on MD+ */}
            <div className="space-y-6 md:grid md:grid-cols-[200px_1fr] md:gap-8">
                
                {/* === RESPONSIVE NAVIGATION/SIDEBAR === */}
                <aside className="
                    bg-card p-4 rounded-xl shadow-lg border border-border 
                    sticky md:top-28 md:h-fit 
                    w-full 
                ">
                    <nav 
                        // Mobile: flex row with horizontal scroll, Desktop: vertical stack
                        className="flex md:block space-x-2 md:space-x-0 md:space-y-2 overflow-x-auto pb-2 md:pb-0" 
                    >
                        {adminNavItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center justify-center md:justify-start gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex-shrink-0",
                                    isActive(item.href)
                                        ? "bg-red-600 text-white shadow-md hover:bg-red-700" // Enhanced active state
                                        : "text-foreground hover:bg-muted/60 dark:hover:bg-muted/30"
                                )}
                            >
                                <item.Icon className="w-4 h-4" />
                                {/* Hide text on extra small mobile screens for maximum compactness, show on small+ (sm:) if space allows */}
                                <span className="hidden sm:inline">{item.name}</span> 
                            </Link>
                        ))}
                    </nav>
                </aside>

                {/* === DYNAMIC CONTENT AREA === */}
                <section className="bg-card p-4 sm:p-6 rounded-xl shadow-lg border border-border">
                    {children}
                </section>
            </div>
        </motion.div>
    );
}