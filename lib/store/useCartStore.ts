// signature-trader/lib/store/useCartStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware'; 

// Interface for a single item in the cart
interface CartItem {
    productId: string;
    name: string;
    slug: string;
    basePrice: number;
    quantity: number;
    selectedVariants: Record<string, string>; 
    totalPrice: number;
    mediaUrl: string;
}

// Interface for the overall cart state
interface CartState {
    items: CartItem[];
    subtotal: number;
    taxRate: number; // Stored for future use, but kept at 0
    total: number; // This will now be equal to subtotal if taxRate is 0
    
    isCartOpen: boolean; 
    
    // Actions
    addItem: (item: Omit<CartItem, 'totalPrice'>) => void;
    removeItem: (productId: string, variantsKey: string) => void;
    updateQuantity: (productId: string, variantsKey: string, quantity: number) => void;
    clearCart: () => void;
    
    openCart: () => void;
    closeCart: () => void;
    
    _calculateTotals: (items: CartItem[]) => void;
}

// Helper to create a unique identifier for item + variant combination
const getCartItemKey = (productId: string, variants: Record<string, string>): string => {
    const sortedVariants = Object.keys(variants)
        .sort()
        .map(key => `${key}:${variants[key]}`)
        .join('|');
    return `${productId}|${sortedVariants}`;
};


export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],
            subtotal: 0,
            taxRate: 0, // <-- FIX: Set default tax rate to 0
            total: 0,
            isCartOpen: false, 

            openCart: () => set({ isCartOpen: true }),
            closeCart: () => set({ isCartOpen: false }),

            _calculateTotals: (items) => {
                const subtotal = items.reduce((sum, item) => sum + item.totalPrice * item.quantity, 0);
                
                // NOTE: Tax calculation is still here but will equal 0 with taxRate=0
                const tax = subtotal * get().taxRate; 
                
                // FIX: Total now includes tax (which is currently 0)
                const total = subtotal + tax; 
                
                set({ subtotal, total });
            },

            addItem: (newItem) => {
                const { items, _calculateTotals } = get();
                const newItemKey = getCartItemKey(newItem.productId, newItem.selectedVariants);
                
                let newItems: CartItem[] = [];
                let existingItem = items.find(item => getCartItemKey(item.productId, item.selectedVariants) === newItemKey);

                if (existingItem) {
                    newItems = items.map(item =>
                        item === existingItem
                            ? { ...item, quantity: item.quantity + newItem.quantity }
                            : item
                    );
                } else {
                    const itemWithPrice = { 
                        ...newItem, 
                        totalPrice: newItem.basePrice, 
                    };
                    newItems = [...items, itemWithPrice];
                }
                
                set({ items: newItems, isCartOpen: true }); 
                _calculateTotals(newItems);
            },

            removeItem: (productId, itemKey) => {
                const { items, _calculateTotals } = get();
                const newItems = items.filter(item => getCartItemKey(item.productId, item.selectedVariants) !== itemKey);
                
                set({ items: newItems });
                _calculateTotals(newItems);
            },

            updateQuantity: (productId, itemKey, quantity) => {
                if (quantity <= 0) {
                    get().removeItem(productId, itemKey);
                    return;
                }

                const { items, _calculateTotals } = get();
                const newItems = items.map(item => 
                    getCartItemKey(item.productId, item.selectedVariants) === itemKey
                        ? { ...item, quantity }
                        : item
                );
                
                set({ items: newItems });
                _calculateTotals(newItems);
            },

            clearCart: () => {
                set({ items: [], subtotal: 0, total: 0 });
            }
        }),
        {
            name: 'signature-trader-cart-storage', 
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                items: state.items,
                subtotal: state.subtotal,
                total: state.total,
                taxRate: state.taxRate,
            }),
        }
    )
);