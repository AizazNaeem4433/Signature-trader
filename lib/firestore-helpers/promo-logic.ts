// signature-trader/lib/firestore-helpers/promo-logic.ts
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, QueryDocumentSnapshot } from 'firebase/firestore';

// Interface matching the Firestore document structure for easy validation
interface Coupon {
    id: string;
    code: string;
    type: 'percent' | 'fixed';
    value: number;
    minOrder: number;
    isActive: boolean;
    expiresAt: string; // ISO Date string
}

/**
 * Checkout process ke dauraan promo code ko validate karne ke liye main function.
 * Yeh function Firestore mein active aur valid codes ko khojta hai.
 * * @param couponCode - User dwara daala gaya UPPERCASE promo code.
 * @param cartTotal - Coupon apply karne se pehle cart ka total amount.
 * @returns Coupon object agar valid ho, warna null.
 */
export async function getValidPromoCodeByCode(
    couponCode: string,
    cartTotal: number
): Promise<Coupon | null> {
    
    if (!couponCode || cartTotal <= 0) {
        return null;
    }

    const today = new Date().toISOString();
    const normalizedCode = couponCode.toUpperCase().trim();

    // 1. Initial Firestore Query
    // Query Firestore for coupons that are:
    // a) Active
    // b) Matching the input code
    // c) Not yet expired (expiresAt > today)
    const q = query(
        collection(db, 'promos'),
        where('isActive', '==', true),
        where('code', '==', normalizedCode),
        where('expiresAt', '>', today) // This filters out expired or invalid codes
    );

    try {
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            // No active, unexpired coupon found with this code
            return null;
        }

        // 2. Client-Side Validation (Minimum Order Amount)
        let validCoupon: Coupon | null = null;
        
        snapshot.forEach((doc: QueryDocumentSnapshot) => {
            const couponData = { id: doc.id, ...doc.data() } as Coupon;
            
            // Check if the coupon meets the minimum order requirement
            if (cartTotal >= couponData.minOrder) {
                validCoupon = couponData;
            }
        });

        // 3. Return the result
        return validCoupon;

    } catch (error) {
        console.error("Error validating promo code:", error);
        // Safely fail by returning null if database access fails
        return null;
    }
}