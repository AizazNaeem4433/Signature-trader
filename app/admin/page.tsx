// signature-trader/app/admin/page.tsx (Modification to include Charts)
"use client";

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Package, Users, DollarSign, Clock, TrendingUp, Loader2 } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, limit, onSnapshot, getCountFromServer } from 'firebase/firestore'; 
import { cn } from '@/lib/utils';
import { useNotificationStore } from '@/lib/store/useNotificationStore';
import PerformanceCharts from './components/PerformanceCharts'; // <-- USE THE RECHARTS COMPONENT

// Interface matching the Firestore document structure for orders
interface Order {
    id: string;
    total_amount: number;
    status: string;
    created_at: { seconds: number, nanoseconds: number }; 
    user_id: string;
}

// Initial state for stat cards
const initialStats = [
    { title: "Total Revenue", value: "0", Icon: DollarSign, color: "text-green-500", bg: "bg-green-500/10", key: 'revenue' },
    { title: "Total Orders", value: "0", Icon: Package, color: "text-blue-500", bg: "bg-blue-500/10", key: 'orders' },
    { title: "Total Users", value: "0", Icon: Users, color: "text-purple-500", bg: "bg-purple-500/10", key: 'users' },
    { title: "Pending Orders", value: "0", Icon: Clock, color: "text-red-500", bg: "bg-red-500/10", key: 'pending' },
];

export default function AdminAnalyticsPage() {
    const { addNotification } = useNotificationStore();
    const [stats, setStats] = useState(initialStats);
    const [latestOrders, setLatestOrders] = useState<Order[]>([]);
    const [loadingOrders, setLoadingOrders] = useState(true);

    // --- UTILITY: Format Timestamp ---
    const formatDate = (timestamp: { seconds: number, nanoseconds: number }) => {
        if (!timestamp) return 'N/A';
        return new Date(timestamp.seconds * 1000).toLocaleString();
    };
    
    // --- 1. Real-Time Latest Orders & Aggregation ---
    useEffect(() => {
        const ordersQuery = query(collection(db, 'orders'), orderBy('created_at', 'desc'), limit(10));

        const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
            let totalRevenue = 0;
            let pendingCount = 0;
            let totalOrders = 0;
            
            const ordersList: Order[] = snapshot.docs.map(doc => {
                const data = doc.data();
                
                totalOrders++;
                // Aggregation logic should ideally run on the entire collection, but here we estimate from the latest 10
                // For a proper Admin Dashboard, you would use cloud functions to calculate actual totals.
                totalRevenue += Number(data.total_amount || 0);
                if (data.status === 'pending') {
                    pendingCount++;
                }

                return { id: doc.id, ...data } as Order;
            });
            
            setLatestOrders(ordersList);
            setLoadingOrders(false);

            // NOTE: The 'orders' and 'revenue' stats will only reflect the latest 10 orders, not the total store data.
            setStats(prev => prev.map(stat => {
                if (stat.key === 'revenue') return { ...stat, value: `PKR ${totalRevenue.toLocaleString()}` };
                if (stat.key === 'pending') return { ...stat, value: String(pendingCount) };
                if (stat.key === 'orders') return { ...stat, value: String(totalOrders) }; 
                return stat;
            }));

        }, (error) => {
            console.error("Error fetching real-time orders:", error);
            addNotification("Failed to load real-time orders data.", "error");
            setLoadingOrders(false);
        });

        return () => unsubscribe();
    }, [addNotification]);
    
    // --- 2. Fetch Total User Count (Server/Total Data) ---
    useEffect(() => {
        const fetchTotalUsers = async () => {
            try {
                const usersQuery = query(collection(db, 'users'));
                const snapshot = await getCountFromServer(usersQuery);
                const totalUsers = snapshot.data().count;
                
                setStats(prev => prev.map(stat => 
                    stat.key === 'users' ? { ...stat, value: String(totalUsers) } : stat
                ));

            } catch(error) {
                console.error("Error fetching total user count:", error);
                setStats(prev => prev.map(stat => 
                    stat.key === 'users' ? { ...stat, value: 'Error' } : stat
                ));
            }
        };
        fetchTotalUsers();
    }, []);


    return (
        // Added max-w-7xl and padding for better layout on all screens
        <div className="space-y-12 p-4 sm:p-6 max-w-7xl mx-auto"> 
            <h2 className="text-3xl font-bold text-red-600 flex items-center gap-2">
                <TrendingUp className='w-6 h-6'/> Store Analytics
            </h2>
            <p className="text-muted-foreground">Overview of key business metrics and real-time activity.</p>
            
            <hr className="border-border" />

            {/* Stat Cards Row: Stacked 1x1 on extra-small, 2x2 on small, 4x1 on large */}
            <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                {stats.map((card, index) => (
                    <motion.div
                        key={card.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.1 }}
                        className="p-4 sm:p-5 rounded-xl border border-border bg-card shadow-sm transition-shadow hover:shadow-lg"
                    >
                        <div className={cn("p-2 rounded-lg w-fit mb-2", card.bg)}>
                            <card.Icon className={cn("w-5 h-5", card.color)} />
                        </div>
                        <p className="text-sm text-muted-foreground">{card.title}</p>
                        <p className="text-xl sm:text-2xl font-extrabold text-foreground mt-1">{card.value}</p>
                    </motion.div>
                ))}
            </div>
            
            {/* --- CHARTS SECTION (Full Width) --- */}
            <h3 className="text-2xl font-semibold mt-10 text-foreground">Sales Performance</h3>
            <div className="bg-card p-4 sm:p-6 rounded-xl border border-border shadow-sm">
                <PerformanceCharts />
            </div>

            <hr className="border-border" />

            {/* REAL-TIME LATEST ORDERS TABLE */}
            <div>
                <h3 className="text-2xl font-semibold mb-4 text-foreground">Real-Time Latest Orders</h3>
                
                {/* Responsive Table Wrapper */}
                <div className="overflow-x-auto border border-border rounded-lg shadow-sm">
                    <table className="min-w-full divide-y divide-border">
                        <thead className="bg-muted/50">
                            <tr>
                                {/* Order ID: Always visible */}
                                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    Order ID
                                </th>
                                {/* Amount: Always visible */}
                                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    Amount
                                </th>
                                {/* Status: Always visible */}
                                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    Status
                                </th>
                                {/* Placed On: Hidden on extra small screens for compactness */}
                                <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    Placed On
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loadingOrders ? (
                                <tr>
                                    <td colSpan={4} className="text-center py-6 text-sm text-muted-foreground">
                                        <Loader2 className="w-5 h-5 animate-spin mx-auto text-red-500" />
                                        Fetching real-time data...
                                    </td>
                                </tr>
                            ) : latestOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="text-center py-4 text-sm text-muted-foreground italic">
                                        No new orders to display.
                                    </td>
                                </tr>
                            ) : (
                                latestOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-muted/20 transition-colors">
                                        {/* Order ID */}
                                        <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm font-medium text-foreground">{order.id.slice(0, 8)}...</td>
                                        {/* Amount */}
                                        <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-foreground">PKR {Number(order.total_amount).toLocaleString()}</td>
                                        {/* Status */}
                                        <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm">
                                            <span className={cn(
                                                "px-2 inline-flex text-xs leading-5 font-semibold rounded-full",
                                                order.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-400' :
                                                order.status === 'shipped' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-400' :
                                                'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400'
                                            )}>
                                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                            </span>
                                        </td>
                                        {/* Placed On (Hidden on extra small) */}
                                        <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                            {formatDate(order.created_at)}
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