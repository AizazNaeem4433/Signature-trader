// signature-trader/app/account/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { ShoppingCart, Package, DollarSign, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore'; 
import { useAuthStore } from '@/lib/store/useAuthStore';
import { useCartStore } from '@/lib/store/useCartStore'; 

// Interface for recent orders display
interface RecentOrder {
    id: string;
    total_amount: number;
    created_at: string;
    items: Array<any>;
}

// Initial structure for Stat Cards
const initialStats = [
    { title: "Total Orders", value: "0", Icon: Package, color: "text-blue-500", bg: "bg-blue-500/10", key: 'orders' },
    { title: "Items in Cart", value: "0", Icon: ShoppingCart, color: "text-purple-500", bg: "bg-purple-500/10", key: 'cart' },
    { title: "Lifetime Spend", value: "PKR 0.00", Icon: DollarSign, color: "text-green-500", bg: "bg-green-500/10", key: 'spend' },
];

export default function DashboardPage() {
    const { user } = useAuthStore();
    const cartItemsCount = useCartStore(state => state.items.length); 
    const [stats, setStats] = useState(initialStats);
    const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
    const [loadingData, setLoadingData] = useState(true);

    // --- Data Fetching Effect (Uses onSnapshot for real-time totals) ---
    useEffect(() => {
        if (!user || !user.uid) return;

        const userId = user.uid;
        
        const ordersRef = collection(db, 'orders');
        const ordersQuery = query(
            ordersRef,
            where('user_id', '==', userId), // Filter by current user UID
            orderBy('created_at', 'desc')
        );

        const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
            let totalOrders = 0;
            let lifetimeSpend = 0;
            
            const ordersList: RecentOrder[] = [];

            snapshot.forEach(doc => {
                const data = doc.data();
                
                totalOrders++;
                // Aggregation for Lifetime Spend
                lifetimeSpend += Number(data.total_amount || 0);

                ordersList.push({ id: doc.id, ...data } as RecentOrder);
            });
            
            setRecentOrders(ordersList.slice(0, 5));
            
            // Update Stats State
            setStats(prev => prev.map(stat => {
                if (stat.key === 'orders') return { ...stat, value: String(totalOrders) };
                if (stat.key === 'spend') return { ...stat, value: `PKR ${lifetimeSpend.toLocaleString()}` };
                if (stat.key === 'cart') return { ...stat, value: String(cartItemsCount) };
                return stat;
            }));

            setLoadingData(false);

        }, (error) => {
            console.error("Error fetching user dashboard data:", error);
            setLoadingData(false);
        });

        // Sync cart count
        setStats(prev => prev.map(stat => {
            if (stat.key === 'cart') return { ...stat, value: String(cartItemsCount) };
            return stat;
        }));


        return () => unsubscribe();
    }, [user, cartItemsCount]); 

    // Format Timestamp
    const formatTimestamp = (timestamp: string) => {
        // Ensure proper handling of Firestore Timestamps if they aren't strings
        try {
            return new Date(timestamp).toLocaleDateString('en-PK');
        } catch {
            return 'N/A';
        }
    };

    if (loadingData) {
        return (
            <div className="text-center py-20">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#FFCE00]" />
                <p className="mt-2 text-muted-foreground">Loading account data...</p>
            </div>
        );
    }
    
    return (
        // ADDED: max-w-6xl and mx-auto for better viewing on large screens
        <div className="space-y-10 p-4 sm:p-6 max-w-6xl mx-auto"> 
            <h2 className="text-3xl font-bold mb-4 text-[#FFCE00]">Your Dashboard 📈</h2>
            
            {/* Stat Cards Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6"> 
                {stats.map((card, index) => (
                    <motion.div
                        key={card.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.1 }}
                        className="p-5 rounded-xl flex items-center justify-between border border-border bg-card shadow-sm" // Slightly better card styling
                    >
                        <div>
                            <p className="text-sm text-muted-foreground font-medium">{card.title}</p>
                            <p className="text-3xl font-extrabold text-foreground mt-1">{card.value}</p>
                        </div>
                        <div className={cn("p-3 rounded-full", card.bg)}>
                            <card.Icon className={cn("w-7 h-7", card.color)} /> {/* Slightly larger icons */}
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Recent Orders Section */}
            <div>
                <h3 className="text-2xl font-semibold mb-5 text-foreground">Recent Orders</h3>
                
                {/* Ensure table is fully responsive */}
                <div className="overflow-x-auto border rounded-xl shadow-sm">
                    <table className="min-w-full divide-y divide-border">
                        <thead className="bg-muted/50">
                            <tr>
                                {/* HIDDEN ON SMALL SCREENS for space, visible on MD+ */}
                                <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    Sr.No
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    Order ID
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    Date
                                </th>
                                {/* HIDDEN ON SMALL SCREENS for space, visible on MD+ */}
                                <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    Items
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    Amount
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-card divide-y divide-border">
                            {recentOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-6 text-center text-sm text-muted-foreground italic">
                                        No recent orders found. Time to shop!
                                    </td>
                                </tr>
                            ) : (
                                recentOrders.map((order, index) => (
                                    <tr key={order.id} className="hover:bg-muted/10 transition-colors">
                                        {/* HIDDEN ON SMALL SCREENS */}
                                        <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm">{index + 1}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                                            {order.id.slice(0, 8)}...
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            {formatTimestamp(order.created_at)}
                                        </td>
                                        {/* HIDDEN ON SMALL SCREENS */}
                                        <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm">
                                            {order.items.length}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                                            PKR {Number(order.total_amount).toLocaleString()}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}