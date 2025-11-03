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
import { doc, getDoc, collection, addDoc } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import Link from 'next/link';

// Interface for user profile data fetched from Firestore
interface UserProfileDetails {
  displayName: string;
  email: string;
  phone?: string;
  address?: string;
}

// Helper component for Summary Rows
function SummaryRow({ label, value, isTotal = false }: { label: string; value: string; isTotal?: boolean; }) {
  return (
    <div className={cn("flex justify-between")}>
      <span className={cn("text-sm", { "font-semibold text-lg text-red-600": isTotal })}>{label}</span>
      <span className={cn("font-medium", { "font-extrabold text-red-600 text-lg": isTotal })}>{value}</span>
    </div>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  // We rely on subtotal, taxRate is 0, total is subtotal. We DON'T need clearCart here anymore.
  const { items, subtotal, taxRate } = useCartStore(); 
  const { user: authUser, isLoggedIn, isInitialized } = useAuthStore();
  const { addNotification } = useNotificationStore();

  const SHIPPING_COST = 250;
  // Final order total calculation with fixed shipping (Tax is 0 from store)
  const finalOrderTotal = subtotal + SHIPPING_COST; 

  const [shippingDetails, setShippingDetails] = useState({
    fullName: authUser?.displayName || '',
    email: authUser?.email || '',
    phone: '',
    address: '',
  });
  const [loadingData, setLoadingData] = useState(true);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // Route Protection & Prefill
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
        // This is the logic that was causing the unwanted redirect
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

  // Submit Order
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
          productId: item.productId,
          name: item.name,
          quantity: item.quantity,
          price: item.totalPrice,
          variants: item.selectedVariants,
        })),
        subtotal,
        tax_amount: subtotal * taxRate, // This is 0 but kept for data consistency
        shipping_cost: SHIPPING_COST,
        total_amount: finalOrderTotal,
        payment_method: 'Cash on Delivery',
        status: 'pending',
        created_at: new Date().toISOString(),
      };

      const addedDoc = await addDoc(collection(db, 'orders'), orderDoc);
      const orderId = addedDoc.id;

      // === FIX APPLIED HERE: DO NOT CLEAR CART YET ===
      // clearCart(); 
      
      addNotification(`Order placed successfully! Order ID: ${orderId.slice(-8)}`, "success");
      // This is the correct redirection
      router.push(`/checkout/success/${orderId}`); 
    } catch (error) {
      console.error("Failed to place order:", error);
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
        {/* LEFT: Shipping Form */}
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
                <img src={item.mediaUrl} alt={item.name} className={cn("w-12 h-12 rounded-md object-cover flex-shrink-0")} />
                <div className={cn("flex-grow")}>
                  <p className={cn("text-sm font-medium line-clamp-1")}>{item.name}</p>
                  <p className={cn("text-xs text-muted-foreground")}>{item.quantity} x {item.totalPrice.toLocaleString()}</p>
                </div>
                <p className={cn("text-sm font-semibold text-foreground")}>
                  PKR {(item.totalPrice * item.quantity).toLocaleString()}
                </p>
              </div>
            ))}
          </div>

          <div className={cn("space-y-2 border-y border-border py-4 mt-4")}>
            <SummaryRow label="Subtotal" value={`PKR ${subtotal.toLocaleString()}`} />
            <SummaryRow label="Shipping" value={`PKR ${SHIPPING_COST.toLocaleString()}`} /> 
          </div>

          <SummaryRow label="Order Total" value={`PKR ${finalOrderTotal.toLocaleString()}`} isTotal />
          <p className={cn("text-xs text-muted-foreground pt-2")}>Shipping cost of PKR {SHIPPING_COST} is added to the final total.</p>
        </div>
      </div>
    </main>
  );
}