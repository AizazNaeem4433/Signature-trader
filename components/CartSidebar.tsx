// signature-trader/components/CartSidebar.tsx
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, X, ArrowRight, Minus, Plus } from "lucide-react"; 
import Link from "next/link";
import { useCartStore } from "@/lib/store/useCartStore";
import { useNotificationStore } from "@/lib/store/useNotificationStore";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Image from "next/image"; 

export default function CartSidebar() {
  // updateQuantity ko store se nikal lein
  const { items, isCartOpen, closeCart, subtotal, total, removeItem, updateQuantity, discountAmount, promoCode } = useCartStore();
  const { addNotification } = useNotificationStore();

  const handleRemoveItem = (productId: string, itemKey: string, itemName: string) => {
    removeItem(productId, itemKey);
    addNotification(`${itemName} removed from cart.`, "info");
  };

  const getCartItemKey = (productId: string, variants: Record<string, string>): string => {
    const sortedVariants = Object.keys(variants).sort().map(key => `${key}:${variants[key]}`).join('|');
    return `${productId}|${sortedVariants}`;
  };
  
  const formatCurrency = (amount: number) => amount.toLocaleString('en-PK', { minimumFractionDigits: 0 });
  
  const formattedSubtotal = formatCurrency(subtotal);
  
  // FIX: Shipping Cost is 0
  const SHIPPING_COST = 0; 
  const finalOrderTotal = total + SHIPPING_COST; 
  const formattedFinalOrderTotal = formatCurrency(finalOrderTotal);


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
            className={cn("fixed inset-0 z-99 bg-black/50 backdrop-blur-sm")}
          />

          {/* Sidebar Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 200, damping: 30 }}
            className={cn("fixed top-0 right-0 z-100 w-full max-w-md h-full bg-card shadow-2xl flex flex-col")}
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
              <div className={cn("flex flex-col items-center justify-center p-8 text-center grow")}>
                <ShoppingCart className={cn("w-12 h-12 text-muted-foreground mb-4")} />
                <p className={cn("text-lg text-muted-foreground")}>Your cart is empty.</p>
                <Link href="/products" onClick={closeCart} className={cn("mt-4 text-red-600 hover:underline")}>
                  Start Shopping
                </Link>
              </div>
            ) : (
              <>
                {/* Items List */}
                <div className={cn("grow overflow-y-auto p-5 space-y-4")}>
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
                          transition={{ duration: 0.3 }}
                          className={cn("flex items-center gap-3 border-b border-border/50 pb-3")}
                        >
                          <div className={cn("relative w-16 h-16 rounded-md shrink-0 overflow-hidden")}>
                            {/* Removed Image tag and used img for simple src */}
                            <img 
                                src={item.mediaUrl} 
                                alt={item.name} 
                                className={cn("object-cover w-full h-full")} 
                            />
                          </div>

                          <div className={cn("grow min-w-0 pr-2 ")}>
                            <Link href={`/products/${item.slug}`} onClick={closeCart} className={cn("font-semibold text-sm hover:text-[#FFCE00] transition-colors line-clamp-1")}>
                              {item.name}
                            </Link>
                            <p className={cn("text-xs text-muted-foreground truncate mb-1")}>{variantString}</p>
                            
                            {/* --- QUANTITY CONTROLS --- */}
                            <div className="flex items-center gap-1">
                                <Button 
                                    size="icon-sm" 
                                    variant="outline" 
                                    className="w-5 h-5 p-0 curser-pointer"
                                    onClick={() => updateQuantity(item.productId, itemKey, item.quantity - 1)}
                                    disabled={item.quantity <= 1}
                                >
                                    <Minus className="w-3 h-3" />
                                </Button>
                                <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                                <Button 
                                    size="icon-sm" 
                                    variant="outline" 
                                    className="w-5 h-5 p-0 curser-pointer"
                                    onClick={() => updateQuantity(item.productId, itemKey, item.quantity + 1)}
                                >
                                    <Plus className="w-3 h-3 curser-pointer" />
                                </Button>
                            </div>
                            {/* --- END QUANTITY CONTROLS --- */}

                          </div>
                          
                          <div className='flex flex-col items-end shrink-0'>
                            <Button 
                                variant="ghost" 
                                size="icon-sm" 
                                className='p-0 w-6 h-6 hover:bg-transparent text-muted-foreground hover:text-red-600 self-end mb-2'
                                onClick={() => handleRemoveItem(item.productId, itemKey, item.name)}
                                aria-label="Remove item"
                            >
                                <X className={cn("w-4 h-4 ")} />
                            </Button>
                            <p className={cn("text-sm font-bold text-red-600 mt-auto")}>
                              PKR {formatCurrency(item.totalPrice * item.quantity)}
                            </p>
                          </div>
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
                    {/* Discount Row */}
                    {discountAmount > 0 && (
                        <div className={cn("flex justify-between text-sm text-muted-foreground")}>
                            <span className='font-medium'>Discount ({promoCode || 'Applied'})</span>
                            <span className="font-semibold text-green-600">-PKR {formatCurrency(discountAmount)}</span> 
                        </div>
                    )}
                     <div className={cn("flex justify-between text-sm text-muted-foreground")}>
                        <span>Shipping</span>
                        <span className="font-semibold text-green-600">FREE</span> 
                    </div>
                    
                    <div className={cn("flex justify-between font-bold text-lg pt-2 border-t border-border/50")}>
                        <span>Order Total</span>
                        <span className={cn("text-red-600")}>PKR {formattedFinalOrderTotal}</span>
                    </div>
                  </div>
                  
                  <Link href="/checkout" onClick={closeCart} passHref>
                    <Button className={cn("w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 text-lg ")}>
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