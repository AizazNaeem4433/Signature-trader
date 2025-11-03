// signature-trader/app/account/orders/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { Loader2, Package, Calendar, Tag, DollarSign } from 'lucide-react'; // Added icons for card view
import { cn } from '@/lib/utils';
import Link from 'next/link'; // Assuming you'll link to order details later

// Interface matching the Firestore document structure
interface UserOrder {
    id: string;
    total_amount: number;
    status: 'pending' | 'shipped' | 'delivered' | 'cancelled'; // Ensure status is correctly typed
    created_at: string; // ISO Date string
    items: Array<{ name: string; quantity: number; price: number }>;
}

export default function OrdersPage() {
    const { user } = useAuthStore();
    const [orders, setOrders] = useState<UserOrder[]>([]);
    const [loading, setLoading] = useState(true);

    // --- Real-Time Orders Fetch (READ) ---
    useEffect(() => {
        if (!user || !user.uid) {
            setLoading(false);
            return;
        }

        const ordersQuery = query(
            collection(db, 'orders'), 
            where('user_id', '==', user.uid),
            orderBy('created_at', 'desc')
        );

        const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
            const ordersList: UserOrder[] = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            } as UserOrder));

            setOrders(ordersList);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching user orders:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    // Utility function to format the ISO date string
    const formatDate = (isoString: string) => {
        try {
            return new Date(isoString).toLocaleDateString('en-PK');
        } catch {
            return 'N/A';
        }
    };

    const getStatusClass = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-400';
            case 'shipped': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-400';
            case 'delivered': return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400';
            case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700/50 dark:text-gray-300';
        }
    };

    const StatusBadge = ({ status }: { status: UserOrder['status'] }) => (
        <span className={cn(
            "px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full capitalize",
            getStatusClass(status)
        )}>
            {status}
        </span>
    );

    return (
        <div className="space-y-8">
            <h2 className="text-3xl font-bold mb-4 text-[#FFCE00]">Your Orders 📦</h2>
            <p className="text-muted-foreground">View the status and history of your placed orders.</p>

            {/* Loading / Empty States */}
            {loading ? (
                <div className="text-center py-10">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#FFCE00]" />
                    <p className="text-muted-foreground mt-2">Loading your orders...</p>
                </div>
            ) : orders.length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed border-border rounded-xl bg-muted/20">
                    <p className="text-xl font-semibold text-muted-foreground">You haven't placed any orders yet.</p>
                </div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    {/* --- 1. Mobile/Small Screen Card View (Responsive Enhancement) --- */}
                    <div className="space-y-4 md:hidden">
                        {orders.map((order) => (
                            <Link href={`/account/orders/${order.id}`} key={order.id} className="block">
                                <div className="p-4 border border-border rounded-lg shadow-sm hover:bg-muted/50 transition-colors">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-sm font-semibold flex items-center gap-1 text-foreground">
                                            <Package className="w-4 h-4 text-[#FFCE00]" /> Order #{order.id.slice(0, 8)}...
                                        </p>
                                        <StatusBadge status={order.status} />
                                    </div>
                                    <div className="text-sm space-y-1">
                                        <p className="flex justify-between text-muted-foreground">
                                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Date:</span> 
                                            <span>{formatDate(order.created_at)}</span>
                                        </p>
                                        <p className="flex justify-between text-muted-foreground">
                                            <span className="flex items-center gap-1"><Tag className="w-3 h-3" /> Items:</span> 
                                            <span>{order.items.length}</span>
                                        </p>
                                        <p className="flex justify-between text-lg font-bold pt-1">
                                            <span className="flex items-center gap-1"><DollarSign className="w-4 h-4" /> Total:</span>
                                            <span>PKR {order.total_amount.toLocaleString()}</span>
                                        </p>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>


                    {/* --- 2. Desktop/Tablet Table View (Hidden on Small Screens) --- */}
                    <div className="hidden md:block overflow-x-auto border border-border rounded-lg shadow-sm">
                        <table className="min-w-full divide-y divide-border">
                            <thead className="bg-muted/50">
                                <tr>
                                    {["Order ID", "Date", "Items", "Amount", "Status"].map(header => (
                                        <th key={header} className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                            {header}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-card divide-y divide-border">
                                {orders.map((order) => (
                                    <tr key={order.id} className="hover:bg-muted/10 transition-colors cursor-pointer">
                                        {/* Link to order details (optional) */}
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                                            <Link href={`/account/orders/${order.id}`}>{order.id.slice(0, 8)}...</Link>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{formatDate(order.created_at)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">{order.items.length} items</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">PKR {order.total_amount.toLocaleString()}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <StatusBadge status={order.status} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            )}
        </div>
    );
}