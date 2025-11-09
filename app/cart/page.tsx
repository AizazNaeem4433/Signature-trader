// signature-trader/app/cart/page.tsx
"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, ArrowRight, Trash2, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { useCartStore } from '@/lib/store/useCartStore';
import { cn } from '@/lib/utils';
import { useNotificationStore } from '@/lib/store/useNotificationStore';

// Helper component for unique key generation
const getCartItemKey = (productId: string, variants: Record<string, string>): string => {
    const sortedVariants = Object.keys(variants)
        .sort()
        .map(key => `${key}:${variants[key]}`)
        .join('|');
    return `${productId}|${sortedVariants}`;
};


export default function CartPage() {
    // Fetch state and actions from the global store
    const { items, subtotal, total, updateQuantity, removeItem, clearCart, discountAmount, promoCode } = useCartStore();
    const { addNotification } = useNotificationStore();

    // Handler to remove all items from cart
    const handleClearCart = () => {
        if (confirm("Are you sure you want to clear your entire cart?")) {
            clearCart();
            addNotification("Your cart has been emptied.", "info");
        }
    };
    
    // Constant for shipping cost 
    // FIX: Shipping Cost must be 0 here
    const SHIPPING_COST = 0; 
    // Total already includes the discount (subtotal - discountAmount + tax) from the store.
    const finalOrderTotal = total + SHIPPING_COST; 
    
    // Helper to format currency consistently (PKR)
    const formatCurrency = (amount: number) => `PKR ${amount.toLocaleString('en-PK', { minimumFractionDigits: 0 })}`;

    return (
        <main className="max-w-7xl mx-auto px-6 py-12 min-h-screen">
            <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-4xl font-bold mb-10 flex items-center gap-3"
            >
                <ShoppingCart className="w-8 h-8 text-[#FFCE00]" /> Your Shopping Cart
            </motion.h1>

            {items.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed border-border rounded-xl bg-muted/20">
                    <p className="text-xl font-semibold text-muted-foreground">Your cart is empty.</p>
                    <Link href="/products" className="mt-4 text-red-600 hover:underline flex items-center justify-center gap-1">
                        Start Shopping <ArrowRight className='w-4 h-4' />
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* --- LEFT: Cart Items List (Col Span 2) --- */}
                    <AnimatePresence>
                        <div className="lg:col-span-2 space-y-6">
                            {items.map((item, index) => {
                                // Unique key generation for removal/update
                                const itemKey = getCartItemKey(item.productId, item.selectedVariants);
                                
                                // Variant display string
                                const variantString = Object.keys(item.selectedVariants).map(key => `${key}: ${item.selectedVariants[key]}`).join(' | ');

                                return (
                                    <motion.div
                                        key={itemKey}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        transition={{ duration: 0.3 }}
                                        className="flex border border-border p-4 rounded-xl bg-card shadow-sm items-center"
                                    >
                                        {/* Item Image */}
                                        <div className="w-24 h-24 shrink-0 overflow-hidden rounded-md mr-4">
                                            <img src={item.mediaUrl} alt={item.name} className="w-full h-full object-cover" />
                                        </div>

                                        {/* Details */}
                                        <div className="grow min-w-0">
                                            <Link href={`/products/${item.slug}`} className="text-lg font-semibold hover:text-[#FFCE00] transition-colors line-clamp-1">
                                                {item.name}
                                            </Link>
                                            <p className="text-xs text-muted-foreground mb-1 truncate">{variantString}</p>
                                            <p className="text-sm font-medium text-red-600">
                                                {formatCurrency(item.totalPrice * item.quantity)}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                @ {formatCurrency(item.totalPrice)} each
                                            </p>
                                        </div>

                                        {/* Quantity Controls */}
                                        <div className="flex items-center gap-2 mx-4">
                                            <Button 
                                                size="icon-sm" 
                                                variant="outline" 
                                                onClick={() => updateQuantity(item.productId, itemKey, item.quantity - 1)}
                                                disabled={item.quantity <= 1}
                                            >
                                                <Minus className="w-4 h-4" />
                                            </Button>
                                            <Input 
                                                type="number" 
                                                value={item.quantity} 
                                                min={1} 
                                                readOnly 
                                                className="w-12 text-center h-9"
                                            />
                                            <Button 
                                                size="icon-sm" 
                                                variant="outline" 
                                                onClick={() => updateQuantity(item.productId, itemKey, item.quantity + 1)}
                                            >
                                                <Plus className="w-4 h-4" />
                                            </Button>
                                        </div>

                                        {/* Remove Button */}
                                        <Button 
                                            variant="destructive" 
                                            size="icon" 
                                            onClick={() => removeItem(item.productId, itemKey)}
                                            className="shrink-0"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </Button>
                                    </motion.div>
                                );
                            })}
                        
                            <div className="flex justify-between pt-4 border-t border-border">
                                <Button variant="link" onClick={handleClearCart} className="text-red-600">
                                    Clear Cart
                                </Button>
                                <Link href="/products" className="flex items-center text-[#FFCE00] hover:underline">
                                    ← Continue Shopping
                                </Link>
                            </div>
                        </div>
                    </AnimatePresence>

                    {/* --- RIGHT: Summary and Checkout (Col Span 1) --- */}
                    <div className="lg:col-span-1 p-6 rounded-xl bg-card border border-border shadow-lg space-y-4 sticky top-28 h-fit">
                        <h2 className="text-2xl font-bold mb-4">Order Summary</h2>
                        
                        <div className="space-y-2 border-b border-border pb-4">
                            
                            <SummaryRow label="Subtotal" value={formatCurrency(subtotal)} />
                            
                            {promoCode && (
                                <SummaryRow label={`Discount (${promoCode})`} value={`-${formatCurrency(discountAmount)}`} isPlaceholder />
                            )}
                            
                            {/* REMOVED TAX ROW */}
                            
                            <SummaryRow label="Shipping" value={`FREE`} isPlaceholder={SHIPPING_COST === 0} /> 
                        </div>
                        
                        <SummaryRow label="Order Total" value={formatCurrency(finalOrderTotal)} isTotal />
                        
                        <Link 
                            href="/checkout" 
                            className="w-full block text-center bg-red-600 hover:bg-red-700 text-white font-bold py-3 text-lg rounded-lg transition-colors"
                        >
                            Proceed to Checkout <ArrowRight className="w-5 h-5 ml-2 inline-block" />
                        </Link>
                        
                    </div>
                </div>
            )}
        </main>
    );
}

// Helper component for Summary Rows
function SummaryRow({ label, value, isTotal = false, isPlaceholder = false }: { label: string; value: string; isTotal?: boolean; isPlaceholder?: boolean }) {
    return (
        <div className="flex justify-between">
            <span className={cn("text-sm", { "font-semibold text-lg": isTotal, "text-red-600": isTotal, "text-muted-foreground italic": isPlaceholder })}>{label}</span>
            <span className={cn("font-medium", { "font-extrabold text-red-600 text-lg": isTotal, "text-muted-foreground italic": isPlaceholder })}>{value}</span>
        </div>
    );
}