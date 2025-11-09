// signature-trader/app/checkout/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, ArrowRight, Mail, Phone, User, CheckCircle, ArrowLeft, MapPin } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCartStore } from '@/lib/store/useCartStore';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { useNotificationStore } from '@/lib/store/useNotificationStore';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, addDoc, updateDoc, increment } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import Link from 'next/link';
// NEW: Import promo logic helper
import { getValidPromoCodeByCode } from '@/lib/firestore-helpers/promo-logic';

// Interface for user profile data fetched from Firestore
interface UserProfileDetails {
  displayName: string;
  email: string;
  phone?: string;
  address?: string;
}

// Helper component for Summary Rows
function SummaryRow({ label, value, isTotal = false, isPlaceholder = false }: { label: string; value: string; isTotal?: boolean; isPlaceholder?: boolean }) {
    return (
        <div className={cn("flex justify-between")}>
            <span className={cn("text-sm", { "font-semibold text-lg text-red-600": isTotal, "text-muted-foreground italic": isPlaceholder })}>{label}</span>
            <span className={cn("font-medium", { "font-extrabold text-red-600 text-lg": isTotal, "font-semibold text-green-600": label.includes('Discount'), "text-muted-foreground italic": isPlaceholder })}>{value}</span>
        </div>
    );
}

export default function CheckoutPage() {
  const router = useRouter();
  // FIX: Import discount and promo state/actions
  const { items, subtotal, total, taxRate, promoCode, discountAmount, applyPromoCode, removePromoCode } = useCartStore(); 
  const { user: authUser, isLoggedIn, isInitialized } = useAuthStore();
  const { addNotification } = useNotificationStore();

  // FIX: Set SHIPPING_COST to 0 (Free Shipping)
  const SHIPPING_COST = 0; 
  // FIX: Final total comes directly from store.total + SHIPPING_COST
  const finalOrderTotal = total + SHIPPING_COST; 

  const [shippingDetails, setShippingDetails] = useState({
    fullName: authUser?.displayName || '',
    email: authUser?.email || '',
    phone: '',
    address: '',
  });
  const [loadingData, setLoadingData] = useState(true);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  
  // NEW: Promo Code State
  const [promoInput, setPromoInput] = useState(promoCode || '');
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);

  // Helper to format currency consistently (PKR)
  const formatCurrency = (amount: number) => `PKR ${amount.toLocaleString('en-PK', { minimumFractionDigits: 0 })}`;


  // Route Protection & Prefill (Unchanged)
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loadingData) {
        addNotification("Taking too long to load. Please try refreshing.", "error");
        setLoadingData(false);
      }
    }, 10000);

    if (isInitialized) {
      if (!isLoggedIn) {
        router.push("/auth/login?redirect=/checkout");
      } else if (items.length === 0) {
        addNotification("Your cart is empty. Cannot checkout.", "info");
        router.push("/products"); 
      } else {
        const fetchDetails = async () => {
          if (authUser) {
            const userRef = doc(db, 'users', authUser.uid);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
              const data = userSnap.data() as UserProfileDetails;
              setShippingDetails(prev => ({
                ...prev,
                fullName: authUser.displayName || data.displayName || authUser.email || '',
                email: authUser.email || '',
                phone: data.phone || '',
                address: data.address || '',
              }));
            }
          }
          setLoadingData(false);
        };
        fetchDetails();
      }
    }

    return () => clearTimeout(timeout);
  }, [isInitialized, isLoggedIn, items.length, router, authUser, addNotification, loadingData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setShippingDetails(prev => ({ ...prev, [name]: value }));
  };
  
  // NEW: Promo Code Application Handler
  const handleApplyPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    setPromoError(null);
    if (!promoInput.trim()) {
        removePromoCode();
        addNotification("Promo code removed.", "info");
        return;
    }
    
    setIsApplyingPromo(true);

    try {
        // Use subtotal for minOrder check
        const validCoupon = await getValidPromoCodeByCode(promoInput, subtotal);

        if (!validCoupon) {
            setPromoError("Invalid, expired, or minimum order not met.");
            removePromoCode();
            addNotification("Invalid promo code.", "error");
            return;
        }

        let discount = 0;
        if (validCoupon.type === 'percent') {
            discount = subtotal * (validCoupon.value / 100);
            discount = Math.min(discount, subtotal); // Max discount is subtotal
        } else {
            discount = validCoupon.value; // Fixed amount
            discount = Math.min(discount, subtotal); // Max discount is subtotal
        }
        
        // Apply the discount to the global state
        applyPromoCode(validCoupon.code, discount);
        setPromoInput(validCoupon.code); // Ensure input reflects applied code
        addNotification(`Applied promo code ${validCoupon.code}! Saved ${formatCurrency(discount)}.`, "success");

    } catch (error) {
        console.error("Promo application failed:", error);
        setPromoError("Failed to verify code. Try again.");
        removePromoCode();
    } finally {
        setIsApplyingPromo(false);
    }
  };


  // Submit Order (updated to use discount/correct total)
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isPlacingOrder || items.length === 0 || !authUser) return;

    setIsPlacingOrder(true);

    try {
      const orderDoc = {
        user_id: authUser.uid,
        user_name: shippingDetails.fullName,
        user_email: shippingDetails.email,
        shipping_address: shippingDetails.address.trim(),
        shipping_phone: shippingDetails.phone.trim(),
        items: items.map(item => ({
          productId: item.productId, // Product ID ko yahan save karein
          name: item.name,
          quantity: item.quantity,
          price: item.totalPrice, // Yeh price per item hai (after variant adjustments)
          variants: item.selectedVariants,
        })),
        subtotal, // Subtotal (sum of item prices)
        tax_amount: subtotal * taxRate, // FIX: This is now 0 * subtotal
        shipping_cost: SHIPPING_COST, // FIX: This is now 0
        total_amount: finalOrderTotal, 
        payment_method: 'Cash on Delivery',
        status: 'pending',
        created_at: new Date().toISOString(),
        // NEW: Save promo code and discount
        promo_code: promoCode,
        discount_amount: discountAmount,
      };

      // 1. Order ko database mein save karein
      const addedDoc = await addDoc(collection(db, 'orders'), orderDoc);
      const orderId = addedDoc.id;

      // 2. Har item ke stock ko update karein (Atomic update)
      for (const item of orderDoc.items) {
        const productRef = doc(db, 'products', item.productId);
        
        await updateDoc(productRef, {
          stock: increment(-item.quantity)
        });
      }

      // REMOVED FIX: Clear cart is now handled ONLY on the success page to prevent redirect race condition

      addNotification(`Order placed successfully! Order ID: ${orderId.slice(-8)}`, "success");
      
      // 3. Success page par redirect karein
      router.push(`/checkout/success/${orderId}`); 

    } catch (error) {
      console.error("Failed to place order or update stock:", error);
      addNotification("Failed to place order. Please try again or contact support.", "error");

    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (loadingData || !isLoggedIn || items.length === 0) {
    return (
      <div className={cn("min-h-screen flex items-center justify-center")}>
        <Loader2 className={cn("h-8 w-8 animate-spin text-[#FFCE00]")} />
      </div>
    );
  }

  return (
    <main className={cn("max-w-7xl mx-auto px-6 py-12 min-h-screen")}>
      <Link href="/cart" className={cn("flex items-center text-red-600 hover:underline mb-6")}>
        <ArrowLeft className={cn('w-4 h-4 mr-2')} /> Back to Cart
      </Link>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={cn("text-4xl font-bold mb-10")}
      >
        Checkout
      </motion.h1>

      <div className={cn("grid grid-cols-1 lg:grid-cols-5 gap-8")}>
        {/* LEFT: Shipping Form (Unchanged) */}
        <div className={cn("lg:col-span-3 bg-card p-6 rounded-xl shadow-lg border border-border")}>
          <h2 className={cn("text-2xl font-bold mb-6 text-red-600")}>1. Shipping Information</h2>

          <form onSubmit={handlePlaceOrder} className={cn("space-y-6")}>
            <div className={cn("grid md:grid-cols-2 gap-4")}>
              <div>
                <Label htmlFor="fullName" className={cn("flex items-center gap-1")}><User className={cn('w-4 h-4')}/> Full Name</Label>
                <Input name="fullName" value={shippingDetails.fullName} onChange={handleChange} required />
              </div>
              <div>
                <Label htmlFor="email" className={cn("flex items-center gap-1")}><Mail className={cn('w-4 h-4')}/> Email (Read-only)</Label>
                <Input name="email" value={shippingDetails.email} readOnly disabled className={cn("bg-muted/50")} />
              </div>
            </div>

            <div>
              <Label htmlFor="phone" className={cn("flex items-center gap-1")}><Phone className={cn('w-4 h-4')}/> Phone Number *</Label>
              <Input name="phone" value={shippingDetails.phone} onChange={handleChange} placeholder="e.g. +92 300 1234567" required />
            </div>

            <div>
              <Label htmlFor="address" className={cn("flex items-center gap-1")}><MapPin className={cn('w-4 h-4')}/> Full Address *</Label>
              <Textarea name="address" value={shippingDetails.address} onChange={handleChange} placeholder="House/Apartment, Street, City" rows={3} required />
            </div>

            <h2 className={cn("text-2xl font-bold pt-6 text-red-600")}>2. Payment Method</h2>

            <div className={cn("border border-[#FFCE00] bg-[#FFCE00]/20 p-4 rounded-lg flex items-center gap-3")}>
              <CheckCircle className={cn("w-5 h-5 text-red-600")} />
              <p className={cn("font-semibold text-foreground")}>Cash on Delivery (PKR) - Pay on arrival</p>
            </div>

            <Button
              type="submit"
              disabled={isPlacingOrder}
              className={cn("w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 text-lg")}
            >
              {isPlacingOrder ? (
                <Loader2 className={cn("w-5 h-5 mr-2 animate-spin")} />
              ) : (
                <>Place Order (COD) <ArrowRight className={cn("w-5 h-5 ml-2")} /></>
              )}
            </Button>
          </form>
        </div>

        {/* RIGHT: Order Summary */}
        <div className={cn("lg:col-span-2 p-6 rounded-xl bg-muted/50 border border-border shadow-lg space-y-6 sticky top-28 h-fit")}>
          <h2 className={cn("text-2xl font-bold mb-4")}>Order Summary ({items.length} Items)</h2>

          <div className={cn("space-y-4 max-h-60 overflow-y-auto pr-2")}>
            {items.map((item, index) => (
              <div key={index} className={cn("flex gap-4 items-center")}>
                <img src={item.mediaUrl} alt={item.name} className={cn("w-12 h-12 rounded-md object-cover shrink-0")} />
                <div className={cn("grow")}>
                  <p className={cn("text-sm font-medium line-clamp-1")}>{item.name}</p>
                  <p className={cn("text-xs text-muted-foreground")}>{item.quantity} x {formatCurrency(item.totalPrice)}</p>
                </div>
                <p className={cn("text-sm font-semibold text-foreground")}>
                  {formatCurrency(item.totalPrice * item.quantity)}
                </p>
              </div>
            ))}
          </div>

          
          {/* NEW: Promo Code Area */}
          <div className={cn("pt-4 border-t border-border")}>
            <form onSubmit={handleApplyPromo} className={cn("flex gap-2")}>
                <Input
                    type="text"
                    placeholder={promoCode || "Enter promo code"}
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                    className={cn("h-10")}
                />
                <Button 
                    type="submit" 
                    variant={promoCode ? 'destructive' : 'default'} 
                    disabled={isApplyingPromo}
                    className={cn("w-28 shrink-0")}
                >
                    {isApplyingPromo ? (
                        <Loader2 className={cn("w-4 h-4 animate-spin")} />
                    ) : promoCode ? (
                        "Remove"
                    ) : (
                        "Apply"
                    )}
                </Button>
            </form>
            {promoError && <p className={cn("text-xs text-red-500 mt-2")}>* {promoError}</p>}
            {promoCode && !promoError && (
                 <p className={cn("text-xs text-green-600 mt-2")}>✅ Applied: {promoCode}</p>
            )}
          </div>
          

          <div className={cn("space-y-2 border-y border-border py-4")}>
            
            <SummaryRow label="Subtotal" value={formatCurrency(subtotal)} />
            
            {/* NEW: Discount Row */}
            {discountAmount > 0 && (
                <SummaryRow label={`Discount (${promoCode || 'Applied'})`} value={`-${formatCurrency(discountAmount)}`} isPlaceholder />
            )}
            
            {/* REMOVED TAX ROW */}
            
            {/* FIX: Shipping is 0 */}
            <SummaryRow label="Shipping" value={`FREE`} isPlaceholder /> 
          </div>

          <SummaryRow label="Order Total" value={formatCurrency(finalOrderTotal)} isTotal />
          <p className={cn("text-xs text-muted-foreground pt-2")}>
            Shipping is FREE. {discountAmount > 0 && `Your discount of ${formatCurrency(discountAmount)} has been applied.`}
          </p>
        </div>
      </div>
    </main>
  );
}