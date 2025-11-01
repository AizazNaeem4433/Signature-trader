// signature-trader/app/account/page.tsx
"use client";

import { ShoppingCart, Package, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils'; // <--- FIX: Import cn from your utilities file

// Dummy data structure - replace with data fetched from Firestore/API
const statCards = [
    { title: "Total Orders", value: "0", Icon: Package, color: "text-blue-500", bg: "bg-blue-500/10" },
    { title: "Items in Cart", value: "0", Icon: ShoppingCart, color: "text-purple-500", bg: "bg-purple-500/10" },
    { title: "Lifetime Spend", value: "PKR 0.00", Icon: DollarSign, color: "text-green-500", bg: "bg-green-500/10" },
];

export default function DashboardPage() {
    return (
        <div className="space-y-8">
            <h2 className="text-3xl font-bold mb-4 text-[#FFCE00]">Dashboard</h2>
            
            {/* Stat Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {statCards.map((card, index) => (
                    <motion.div
                        key={card.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.1 }}
                        className="p-4 rounded-xl flex items-center justify-between border border-border bg-muted/20"
                    >
                        <div>
                            <p className="text-sm text-muted-foreground">{card.title}</p>
                            <p className="text-2xl font-bold text-foreground mt-1">{card.value}</p>
                        </div>
                        {/* FIX: cn is now defined and used correctly */}
                        <div className={cn("p-3 rounded-full", card.bg)}>
                            <card.Icon className={cn("w-6 h-6", card.color)} />
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Recent Orders Table */}
            <div>
                <h3 className="text-xl font-semibold mb-4 text-foreground">Recent Orders</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-border">
                        <thead className="bg-muted/50">
                            <tr>
                                {["Sr.No", "Order id", "Total Item", "Amount"].map(header => (
                                    <th key={header} className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        {header}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-card divide-y divide-border">
                            {/* Placeholder for order rows */}
                            <tr>
                                <td colSpan={4} className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground italic">
                                    No recent orders found.
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}