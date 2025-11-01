// signature-trader/app/account/orders/page.tsx (NEW FILE)
"use client";

import { motion } from 'framer-motion';

export default function OrdersPage() {
    return (
        <div className="space-y-8">
            <h2 className="text-3xl font-bold mb-4 text-[#FFCE00]">Orders</h2>
            
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="overflow-x-auto"
            >
                <table className="min-w-full divide-y divide-border">
                    <thead className="bg-muted/50">
                        <tr>
                            {["Sr.No", "Order id", "Total Item", "Amount", "Status"].map(header => (
                                <th key={header} className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    {header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-card divide-y divide-border">
                        {/* Placeholder for order rows - replace with actual data mapping */}
                        <tr>
                            <td colSpan={5} className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground italic">
                                You have not placed any orders yet.
                            </td>
                        </tr>
                    </tbody>
                </table>
            </motion.div>
        </div>
    );
}