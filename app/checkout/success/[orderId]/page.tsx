// signature-trader/app/checkout/success/[orderId]/page.tsx
"use client";

import { motion } from 'framer-motion';
import Link from 'next/link';
import { CheckCircle, Clock, Package, DollarSign, Home, User, Phone, MapPin, XCircle } from 'lucide-react';
import { useParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { useCartStore } from '@/lib/store/useCartStore';

// Interface for order details
interface ConfirmationOrder {
    id: string;
    user_id: string;
    user_name: string;
    shipping_phone: string;
    shipping_address: string;
    total_amount: number;
    subtotal: number;
    tax_amount: number;
    shipping_cost: number;
    status: 'pending' | 'shipped' | 'delivered' | 'cancelled';
    items: Array<{ name: string; quantity: number; price: number }>;
    // NEW: Add discount fields from checkout logic
    promo_code?: string; 
    discount_amount?: number;
}

// Helper Component
function SummaryItem({ Icon, label, value, valueClass }: { Icon: React.ElementType, label: string, value: string, valueClass?: string }) {
    return (
        <div className={cn("flex justify-between text-sm items-center")}>
            <span className={cn("flex items-center gap-2 text-muted-foreground")}><Icon className={cn("w-4 h-4")} /> {label}</span>
            <span className={cn("font-medium text-foreground", valueClass)}>{value}</span>
        </div>
    );
}

export default function OrderConfirmationPage() {
    const params = useParams();
    const orderId = params.orderId as string;
    const { user, isLoggedIn, isInitialized } = useAuthStore();
    const { clearCart } = useCartStore();
    const [order, setOrder] = useState<ConfirmationOrder | null>(null);
    const [loading, setLoading] = useState(true);
    const [isCartCleared, setIsCartCleared] = useState(false);

    useEffect(() => {
        if (!isInitialized) return;
        if (!isLoggedIn) {
            window.location.href = '/auth/login?redirect=/checkout/success/' + orderId;
            return;
        }
        
        if (!orderId || !user?.uid) { 
             if (isLoggedIn && isInitialized) { 
                setLoading(true); 
             } else {
                 setLoading(false); 
             }
             return;
        }

        const fetchOrderWithRetry = async (retries = 3, delay = 1000) => {
            try {
                const orderRef = doc(db, 'orders', orderId);
                const orderSnap = await getDoc(orderRef);

                if (orderSnap.exists()) {
                    const orderData = { id: orderSnap.id, ...orderSnap.data() } as ConfirmationOrder;
                    
                    if (orderData.user_id === user.uid) { 
                        setOrder(orderData);
                        
                        if (!isCartCleared) {
                            clearCart(); 
                            setIsCartCleared(true);
                        }
                        setLoading(false); 
                        
                    } else {
                        setOrder(null); 
                        setLoading(false); 
                    }
                } else if (retries > 0) {
                    setTimeout(() => fetchOrderWithRetry(retries - 1, delay * 2), delay);
                } else {
                    setOrder(null);
                    setLoading(false); 
                }
            } catch (error) {
                console.error("Error fetching order:", error);
                if (retries > 0) {
                    setTimeout(() => fetchOrderWithRetry(retries - 1, delay * 2), delay);
                } else {
                    setOrder(null);
                    setLoading(false); 
                }
            }
        };
        
        fetchOrderWithRetry();

    }, [orderId, isInitialized, isLoggedIn, user, isCartCleared, clearCart]); 

    if (!isInitialized || loading) {
        return (
            <div className={cn("min-h-screen flex items-center justify-center")}>
                <Loader2 className={cn("h-8 w-8 animate-spin text-[#FFCE00]")} />
            </div>
        );
    }

    if (!order) {
        return (
            <div className={cn("min-h-screen flex flex-col items-center justify-center p-8 text-center")}>
                <XCircle className={cn("w-12 h-12 text-red-500 mb-4")} />
                <h1 className={cn("text-2xl font-bold mb-2")}>Error: Order Details Not Found</h1>
                <p className={cn("text-muted-foreground")}>The confirmation link is invalid or you don’t have access to this order.</p>
                <Link href="/account" className={cn("mt-6 text-red-600 hover:underline")}>Go to Dashboard</Link>
            </div>
        );
    }
    
    // --- FIX: Currency format is PKR, Tax is hidden, Shipping is FREE ---
    const formatCurrency = (amount: number) => `PKR ${amount.toLocaleString('en-PK', { minimumFractionDigits: 0 })}`;
    
    const subtotalDisplay = formatCurrency(order.subtotal);
    // Shipping cost will be FREE if 0
    const shippingDisplay = order.shipping_cost === 0 ? "FREE" : formatCurrency(order.shipping_cost); 
    const totalDisplay = formatCurrency(order.total_amount);
    
    // NEW: Discount amount check
    const discountAmount = order.discount_amount || 0;
    const promoCode = order.promo_code;

    return (
        <main className={cn("min-h-screen flex items-center justify-center bg-background py-16 px-4")}>
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 100 }}
                className={cn("w-full max-w-3xl bg-card p-10 rounded-2xl shadow-2xl border border-green-200/50 text-center space-y-8")}
            >
                <CheckCircle className={cn("w-20 h-20 text-green-600 mx-auto")} />
                
                <h1 className={cn("text-3xl md:text-4xl font-extrabold text-foreground")}>
                    Order Confirmed!
                </h1>

                <p className={cn("text-lg text-muted-foreground")}>
                    Thank you for your purchase. Your order has been placed successfully and will be processed shortly.
                </p>

                {/* Summary Box */}
                <div className={cn("bg-muted/50 p-6 rounded-xl space-y-4 border border-border text-left")}>
                    <p className={cn("text-xl font-bold text-foreground flex justify-between items-center")}>
                        Order ID: 
                        <span className={cn("text-red-600 text-2xl")}>{order.id.slice(-8).toUpperCase()}</span>
                    </p>
                    
                    <div className={cn("grid grid-cols-2 gap-4 border-b border-border pb-3 text-sm")}>
                        <SummaryItem Icon={Clock} label="Status" value={order.status.toUpperCase()} valueClass="text-yellow-600 font-semibold" />
                        {/* FIX: Ensure label uses PKR */}
                        <SummaryItem Icon={DollarSign} label="Total (PKR, COD)" value={totalDisplay} valueClass="font-extrabold text-red-600" /> 
                        <SummaryItem Icon={User} label="Recipient" value={order.user_name} />
                        <SummaryItem Icon={Phone} label="Contact" value={order.shipping_phone} />
                    </div>
                    
                    {/* Financial Breakdown */}
                    <div className={cn("space-y-2 border-b border-border pb-3")}>
                        <SummaryItem Icon={DollarSign} label="Subtotal" value={subtotalDisplay} />
                        
                        {/* NEW: Discount Row */}
                        {discountAmount > 0 && (
                            <SummaryItem Icon={DollarSign} label={`Discount (${promoCode || 'Applied'})`} value={`-${formatCurrency(discountAmount)}`} valueClass="text-green-600" />
                        )}
                        
                        <SummaryItem 
                            Icon={Package} 
                            label="Shipping Cost" 
                            value={shippingDisplay} 
                            valueClass={order.shipping_cost === 0 ? "text-green-600" : undefined}
                        />
                        
                        {/* --- FIX: Tax amount 0 hone ki wajah se hide hoga (Original tax row removed) --- */}
                        {order.tax_amount > 0 && 
                            <SummaryItem Icon={DollarSign} label={`Tax (${(order.tax_amount / order.subtotal) * 100}%)`} value={formatCurrency(order.tax_amount)} />
                        }
                    </div>


                    {/* Shipping Address */}
                    <div className={cn("text-sm border-b border-border pb-3")}>
                        <span className={cn("flex items-center gap-2 font-semibold mb-1")}><MapPin className={cn("w-4 h-4 text-red-600")} /> Shipping Address:</span>
                        <p className={cn("text-muted-foreground ml-6")}>{order.shipping_address}</p>
                    </div>

                    {/* Items List */}
                    <div className={cn("space-y-3 pt-3")}>
                        <p className={cn("font-semibold text-foreground")}>Items Ordered:</p>
                        {order.items.map((item, index) => (
                            <div key={index} className={cn("flex justify-between text-sm text-muted-foreground")}>
                                <span>{item.quantity}x {item.name}</span>
                                <span>{formatCurrency(item.price)}</span>
                            </div>
                        ))}
                    </div>
                </div>
                
                {/* Actions */}
                <div className={cn("flex flex-col sm:flex-row justify-center gap-4 pt-4")}>
                    <Link href="/account/orders" passHref>
                        <Button className={cn("w-full sm:w-auto bg-[#FFCE00] hover:bg-[#e6b800] text-black font-semibold")}>
                            View My Orders
                        </Button>
                    </Link>
                    <Link href="/" passHref>
                        <Button variant="outline" className={cn("w-full sm:w-auto")}>
                            <Home className={cn("w-4 h-4 mr-2")} /> Continue Shopping
                        </Button>
                    </Link>
                </div>
            </motion.div>
        </main>
    );
}