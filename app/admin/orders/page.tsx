// signature-trader/app/admin/orders/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
// Lucide Icons
import { ShoppingBag, Loader2, Download, User, Phone, MapPin } from 'lucide-react';
// Firestore
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot, orderBy, doc, updateDoc } from 'firebase/firestore';
// Shadcn Components
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
// Utilities
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import jsPDF from 'jspdf';

// FIX: Updated Interface to include all shipping details saved during checkout
interface Order {
    id: string;
    user_name: string;
    shipping_phone: string; // <-- NEW
    shipping_address: string; // <-- NEW
    total_amount: number;
    subtotal: number; // For detailed summary
    tax_amount: number; // For detailed summary
    shipping_cost: number; // For detailed summary
    status: 'pending' | 'shipped' | 'delivered' | 'cancelled';
    created_at: string; // ISO Date string
    items: Array<{ name: string; quantity: number; price: number }>;
}

export default function AdminOrdersListPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState(''); // State for search input

    // --- Real-Time Orders Fetch (READ) ---
    useEffect(() => {
        // Query to fetch all orders, ordered by newest first
        const ordersQuery = query(collection(db, 'orders'), orderBy('created_at', 'desc'));

        const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
            const ordersList: Order[] = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            } as Order));

            setOrders(ordersList);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching admin orders:", error);
            toast.error("Failed to fetch orders. Check Firestore security rules or network.");
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // --- Update Order Status (UPDATE) ---
    const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
        try {
            const orderRef = doc(db, 'orders', orderId);
            await updateDoc(orderRef, { status: newStatus });
            toast.success(`Order ${orderId.slice(0, 8)}... status updated to ${newStatus}.`);
        } catch (error) {
            console.error("Error updating order status:", error);
            toast.error("Failed to update order status. Please try again.");
        }
    };

    // --- Generate Order Slip PDF (FIXED LOGIC) ---
    const generateOrderSlip = (order: Order) => {
        const doc = new jsPDF();
        let y = 10;
        const margin = 10;

        doc.setFontSize(18);
        doc.text("Signature Trader Order Slip", margin, y);
        y += 10;
        doc.setFontSize(12);
        
        // Customer Details
        doc.text(`Order ID: ${order.id}`, margin, y); y += 6;
        doc.text(`Date: ${formatDate(order.created_at)}`, margin, y); y += 10;

        doc.setFontSize(14);
        doc.text("CUSTOMER & SHIPPING DETAILS", margin, y); y += 8;
        doc.setFontSize(12);

        doc.text(`Name: ${order.user_name}`, margin, y); y += 6;
        doc.text(`Phone: ${order.shipping_phone}`, margin, y); y += 6;
        doc.text(`Address: ${order.shipping_address}`, margin, y); y += 10;

        // Items Table Header (Manual)
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text("Qty", margin, y);
        doc.text("Item Name", 30, y);
        doc.text("Price", 180, y, { align: 'right' });
        y += 6;
        doc.setFont('helvetica', 'normal');
        doc.line(margin, y, 190, y); // Draw a line
        y += 6;

        // Items List
        order.items.forEach((item, index) => {
            const itemTotal = item.price * item.quantity;
            doc.text(String(item.quantity), margin, y);
            // Handle long item names
            const itemText = doc.splitTextToSize(item.name, 140); 
            doc.text(itemText, 30, y);
            doc.text(`PKR ${item.price.toLocaleString()} (@ ${item.quantity})`, 180, y, { align: 'right' });
            y += (itemText.length * 5) + 1; // Adjust Y based on lines used
        });

        y += 5;
        doc.line(120, y, 190, y); // Draw total line
        y += 6;
        
        // Financial Summary
        doc.setFontSize(10);
        doc.text(`Subtotal:`, 140, y, { align: 'right' }); doc.text(`PKR ${order.subtotal.toLocaleString()}`, 180, y, { align: 'right' }); y += 5;
        doc.text(`Tax:`, 140, y, { align: 'right' }); doc.text(`PKR ${order.tax_amount.toLocaleString()}`, 180, y, { align: 'right' }); y += 5;
        doc.text(`Shipping:`, 140, y, { align: 'right' }); doc.text(`PKR ${order.shipping_cost.toLocaleString()}`, 180, y, { align: 'right' }); y += 7;

        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text(`TOTAL COD:`, 140, y, { align: 'right' }); 
        doc.text(`PKR ${order.total_amount.toLocaleString()}`, 180, y, { align: 'right' });

        doc.save(`order-slip-${order.id.slice(0, 8)}.pdf`);
    };

    // --- Utility Functions ---
    const formatDate = (isoString: string) => {
        return new Date(isoString).toLocaleString('en-PK', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getStatusClass = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-400';
            case 'shipped': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-400';
            case 'delivered': return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400';
            case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400';
            default: return 'bg-gray-100 text-gray-800';
        }
    };
    
    // --- Filtering Logic ---
    const filteredOrders = orders.filter(order =>
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.user_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8">
            <h2 className="text-3xl font-bold mb-4 text-red-600 flex items-center gap-2">
                <ShoppingBag className="w-6 h-6" /> All Orders
            </h2>
            <p className="text-muted-foreground">Process, ship, and manage all customer transactions.</p>

            {/* Search and Count Header (Responsive) */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <p className="text-lg font-medium">{filteredOrders.length} Orders Found</p>
                <Input 
                    placeholder="Search by Order ID or Customer Name..." 
                    className="w-full sm:w-64" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {loading ? (
                <div className="text-center py-10">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-red-500" />
                    <p className="text-muted-foreground mt-2">Loading all orders...</p>
                </div>
            ) : orders.length === 0 ? (
                <div className="text-center py-6 text-sm text-muted-foreground italic border border-border rounded-lg bg-muted/50">
                    No orders have been placed yet.
                </div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    {/* --- 1. Mobile/Small Screen Card View (Hidden on MD+) --- */}
                    <div className="space-y-4 md:hidden">
                        {filteredOrders.map((order) => (
                            <div key={order.id} className="p-4 border border-border rounded-lg shadow-sm bg-card space-y-3">
                                <div className="flex justify-between items-center pb-2 border-b border-border/50">
                                    <p className="text-sm font-bold text-red-600">Order #{order.id.slice(0, 8)}...</p>
                                    <p className="text-base font-semibold">PKR {order.total_amount.toLocaleString()}</p>
                                </div>

                                {/* Customer and Status */}
                                <div className="space-y-1 text-sm">
                                    <p className="flex items-center justify-between">
                                        <span className="flex items-center gap-2 font-medium"><User className="w-4 h-4 text-blue-500" />{order.user_name}</span>
                                        <span className="text-muted-foreground">{formatDate(order.created_at)}</span>
                                    </p>
                                    <p className="flex items-center gap-2 text-muted-foreground">
                                        <Phone className="w-4 h-4 text-green-500" /> {order.shipping_phone}
                                    </p>
                                    <p className="flex items-center gap-2 text-muted-foreground leading-tight">
                                        <MapPin className="w-4 h-4 text-purple-500 flex-shrink-0" /> {order.shipping_address}
                                    </p>
                                </div>

                                {/* Actions */}
                                <div className="flex flex-col gap-2 pt-3 border-t border-border/50">
                                    <Select
                                        value={order.status}
                                        onValueChange={(value: Order['status']) => updateOrderStatus(order.id, value)}
                                    >
                                        <SelectTrigger className={cn(
                                            "w-full text-sm capitalize",
                                            getStatusClass(order.status)
                                        )}>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {['pending', 'shipped', 'delivered', 'cancelled'].map(status => (
                                                <SelectItem key={status} value={status} className="capitalize">
                                                    {status}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => generateOrderSlip(order)}
                                        className="w-full flex items-center gap-2 mt-1"
                                    >
                                        <Download className="w-4 h-4" /> Download Slip
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>


                    {/* --- 2. Desktop/Tablet Table View (Hidden on Small Screens) --- */}
                    <div className="hidden md:block overflow-x-auto border border-border rounded-lg shadow-sm">
                        <table className="min-w-full divide-y divide-border">
                            <thead className="bg-muted/50">
                                <tr>
                                    {["Order ID", "Customer", "Amount", "Status", "Date", "Slip"].map(header => (
                                        <th key={header} className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                            {header}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {filteredOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-muted/10 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-red-600">{order.id.slice(0, 8)}...</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex items-center gap-1">
                                                <User className='w-4 h-4 text-blue-500' />
                                                {order.user_name}
                                            </div>
                                            <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                                                {order.shipping_address}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">PKR {order.total_amount.toLocaleString()}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <Select
                                                value={order.status}
                                                onValueChange={(value: Order['status']) => updateOrderStatus(order.id, value)}
                                            >
                                                <SelectTrigger className={cn(
                                                    "w-[120px] text-xs capitalize",
                                                    getStatusClass(order.status)
                                                )}>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {['pending', 'shipped', 'delivered', 'cancelled'].map(status => (
                                                        <SelectItem key={status} value={status} className="capitalize">
                                                            {status}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                            {formatDate(order.created_at)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => generateOrderSlip(order)}
                                                className="flex items-center gap-2"
                                            >
                                                <Download className="w-4 h-4" />
                                                Slip
                                            </Button>
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