// signature-trader/components/CartSidebar.tsx
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, X, Trash2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useCartStore } from "@/lib/store/useCartStore";
import { useNotificationStore } from "@/lib/store/useNotificationStore";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function CartSidebar() {
  const { items, isCartOpen, closeCart, subtotal, total, taxRate, removeItem } = useCartStore();
  const { addNotification } = useNotificationStore();

  const handleRemoveItem = (productId: string, itemKey: string, itemName: string) => {
    removeItem(productId, itemKey);
    addNotification(`${itemName} removed from cart.`, "info");
  };

  // Helper to create a consistent key (must match the helper in useCartStore.ts)
  const getCartItemKey = (productId: string, variants: Record<string, string>): string => {
    const sortedVariants = Object.keys(variants).sort().map(key => `${key}:${variants[key]}`).join('|');
    return `${productId}|${sortedVariants}`;
  };
  
  const formattedSubtotal = subtotal.toLocaleString('en-PK', { minimumFractionDigits: 0 });
  const formattedTotal = total.toLocaleString('en-PK', { minimumFractionDigits: 0 });
  
  // Tax amount is now calculated as 0
  const taxAmount = subtotal * taxRate;
  
  // Fixed Shipping Cost (PKR 250 from checkout/cart pages)
  const SHIPPING_COST = 250; 
  const finalOrderTotal = total + SHIPPING_COST; // Total including shipping
  const formattedFinalOrderTotal = finalOrderTotal.toLocaleString('en-PK', { minimumFractionDigits: 0 });


  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className={cn("fixed inset-0 z-[99] bg-black/50 backdrop-blur-sm")}
          />

          {/* Sidebar Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 200, damping: 30 }}
            className={cn("fixed top-0 right-0 z-[100] w-full max-w-md h-full bg-card shadow-2xl flex flex-col")}
          >
            {/* Header */}
            <div className={cn("sticky top-0 z-10 p-5 flex justify-between items-center border-b border-border bg-background")}>
              <h2 className={cn("text-xl font-bold flex items-center gap-2")}>
                <ShoppingCart className={cn("w-5 h-5 text-[#FFCE00]")} />
                Your Cart ({items.length})
              </h2>
              <Button onClick={closeCart} variant="ghost" size="icon" aria-label="Close Cart">
                <X className={cn("w-5 h-5")} />
              </Button>
            </div>

            {/* Content */}
            {items.length === 0 ? (
              <div className={cn("flex flex-col items-center justify-center p-8 text-center flex-grow")}>
                <ShoppingCart className={cn("w-12 h-12 text-muted-foreground mb-4")} />
                <p className={cn("text-lg text-muted-foreground")}>Your cart is empty.</p>
                <Link href="/products" onClick={closeCart} className={cn("mt-4 text-red-600 hover:underline")}>
                  Start Shopping
                </Link>
              </div>
            ) : (
              <>
                {/* Items List */}
                <div className={cn("flex-grow overflow-y-auto p-5 space-y-4")}>
                  <AnimatePresence initial={false}>
                    {items.map((item) => {
                      const itemKey = getCartItemKey(item.productId, item.selectedVariants);
                      const variantString = Object.keys(item.selectedVariants).map(key => item.selectedVariants[key]).join(' / ');
                      
                      return (
                        <motion.div
                          key={itemKey}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -50 }}
                          className={cn("flex items-center gap-3 border-b border-border/50 pb-3")}
                        >
                          <img src={item.mediaUrl} alt={item.name} className={cn("w-16 h-16 object-cover rounded-md flex-shrink-0")} />
                          <div className={cn("flex-grow min-w-0")}>
                            <Link href={`/products/${item.slug}`} onClick={closeCart} className={cn("font-semibold text-sm hover:text-[#FFCE00] transition-colors line-clamp-1")}>
                              {item.name}
                            </Link>
                            <p className={cn("text-xs text-muted-foreground truncate")}>{variantString}</p>
                            <p className={cn("text-sm font-medium text-red-600")}>
                              PKR {(item.totalPrice * item.quantity).toLocaleString()}
                              <span className={cn("text-xs text-gray-500 ml-2")}>x {item.quantity}</span>
                            </p>
                          </div>
                          <Button 
                            variant="destructive" 
                            size="icon-sm" 
                            onClick={() => handleRemoveItem(item.productId, itemKey, item.name)}
                            className={cn("flex-shrink-0")}
                          >
                            <Trash2 className={cn("w-4 h-4")} />
                          </Button>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>

                {/* Footer Summary & Checkout Button */}
                <div className={cn("p-5 border-t border-border bg-background")}>
                  <div className={cn("space-y-2 mb-4")}>
                    <div className={cn("flex justify-between text-sm text-muted-foreground")}>
                        <span>Subtotal</span>
                        <span>PKR {formattedSubtotal}</span>
                    </div>
                    {/* Add Shipping Cost */}
                     <div className={cn("flex justify-between text-sm text-muted-foreground")}>
                        <span>Shipping</span>
                        <span>PKR {SHIPPING_COST.toLocaleString()}</span>
                    </div>
                    {/* Tax row removed, but can be re-added here if taxRate > 0 */}
                    
                    <div className={cn("flex justify-between font-bold text-lg pt-2 border-t border-border/50")}>
                        <span>Order Total</span>
                        <span className={cn("text-red-600")}>PKR {formattedFinalOrderTotal}</span>
                    </div>
                  </div>
                  
                  <Link href="/checkout" onClick={closeCart} passHref>
                    <Button className={cn("w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 text-lg")}>
                      Proceed to Checkout <ArrowRight className={cn("w-5 h-5 ml-2")} />
                    </Button>
                  </Link>
                  <Link href="/cart" onClick={closeCart} className={cn("mt-2 block text-center text-sm text-muted-foreground hover:text-foreground")}>
                    View Full Cart
                  </Link>
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}