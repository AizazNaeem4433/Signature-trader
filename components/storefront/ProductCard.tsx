// signature-trader/components/storefront/ProductCard.tsx
"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState, useRef } from "react";
import { useCartStore } from "@/lib/store/useCartStore"; 
import { useNotificationStore } from "@/lib/store/useNotificationStore"; 

// --- INTERFACES (Source of Truth) ---
interface VariantOption {
    id: number;
    value: string; 
    linkedMediaId: number | null; 
}
interface VariantType {
    name: string;
    options: VariantOption[];
}
interface ProductMedia {
    id: number;
    url: string;
    alt: string;
    type: 'image' | 'video';
}
// FIX 1: ADD 'id' to the main interface definition
interface ProductCardProps {
    id: string; 
    slug: string;
    name: string;
    basePrice: number;
    cutPrice?: number; 
    media: ProductMedia[];
    variantTypes: VariantType[]; 
    shortDescription: string;
}

// --- UTILITY: Dynamic Color Class Generator (Unchanged) ---
const getColorClass = (colorName: string): string => {
    const name = colorName.toLowerCase();
    
    if (name.includes('red')) return 'bg-red-600';
    if (name.includes('blue')) return 'bg-blue-600';
    if (name.includes('green')) return 'bg-green-600';
    if (name.includes('yellow') || name.includes('gold')) return 'bg-[#FFCE00]';
    if (name.includes('black')) return 'bg-black';
    if (name.includes('white')) return 'bg-white border border-gray-300';
    if (name.includes('silver') || name.includes('gray')) return 'bg-gray-400';
    if (name.includes('brown')) return 'bg-amber-800';
    if (name.includes('pink')) return 'bg-pink-400';
    
    return 'bg-gray-400'; // Default fallback
};


export default function ProductCard({
    id, // FIX 2: Destructure 'id' from props
    slug,
    name,
    basePrice,
    cutPrice,
    media,
    variantTypes,
    shortDescription,
}: ProductCardProps) {
    
    const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const { addItem: addToCart } = useCartStore(); 
    const { addNotification } = useNotificationStore(); 

    const colorVariants = variantTypes.find(vt => vt.name.toLowerCase().includes('color'))?.options || [];
    
    const displayPrice = basePrice.toLocaleString('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 });
    const displayCutPrice = cutPrice && cutPrice > basePrice 
        ? cutPrice.toLocaleString('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 }) 
        : null;
    
    const discount = cutPrice && cutPrice > basePrice 
        ? Math.round(((cutPrice - basePrice) / cutPrice) * 100) 
        : 0;

    // --- Media Hover Logic (Unchanged) ---
    const startHoverCycle = () => {
        if (media.length > 1 && !intervalRef.current) {
            intervalRef.current = setInterval(() => {
                setCurrentMediaIndex(prevIndex => (prevIndex + 1) % media.length);
            }, 1000); 
        }
    };

    const stopHoverCycle = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
            setCurrentMediaIndex(0); 
        }
    };
    
    const currentMediaUrl = media[currentMediaIndex]?.url || '/placeholder.png';
    
    // --- Quick Add Handler (Unchanged) ---
    const handleQuickAdd = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();

        const selectedVariants: Record<string, string> = {};
        variantTypes.forEach(vt => {
            if (vt.options.length > 0) {
                selectedVariants[vt.name] = vt.options[0].value; 
            }
        });

        const cartItem = {
            productId: id,
            name: name,
            slug: slug,
            basePrice: basePrice, 
            quantity: 1,
            selectedVariants: selectedVariants,
            mediaUrl: media[0]?.url || '/placeholder.png' 
        };
        
        addToCart(cartItem); 
        addNotification(`1 x ${name} added to cart!`, "success");
    };


    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className={cn("bg-card border border-border rounded-xl shadow-lg overflow-hidden flex flex-col h-full hover:shadow-xl transition-all duration-300")}
        >
            {/* Image & Quick Actions */}
            <Link 
                href={`/products/${slug}`} 
                className={cn("relative block group aspect-4/5 overflow-hidden")}
                onMouseEnter={startHoverCycle}
                onMouseLeave={stopHoverCycle} 
            >
                <motion.img 
                    key={currentMediaUrl} 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }} 
                    src={currentMediaUrl} 
                    alt={name}
                    className={cn("w-full h-full object-cover")}
                />
                
                {/* Discount Tag */}
                {discount > 0 && (
                    <div className={cn("absolute top-3 left-3 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-md")}>
                        {discount}% OFF
                    </div>
                )}

                {/* Quick Add to Cart Button */}
                <motion.div 
                    className={cn("absolute bottom-0 w-full p-3 bg-black/50 backdrop-blur-sm transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 flex justify-center")}
                >
                    <Button 
                        size="sm" 
                        onClick={handleQuickAdd} 
                        className={cn("bg-[#FFCE00] text-black hover:bg-[#e6b800] w-full")}
                    >
                        <ShoppingCart className={cn("w-4 h-4 mr-2")} /> Quick Add
                    </Button>
                </motion.div>
            </Link>

            {/* Content and Prices */}
            <div className={cn("p-4 flex flex-col grow")}>
                <h3 className={cn("text-xl font-semibold mb-1 text-foreground hover:text-[#FFCE00] transition-colors")}>
                    <Link href={`/products/${slug}`}>{name}</Link>
                </h3>
                
                <p className={cn("text-sm text-muted-foreground mb-3 grow line-clamp-2")}>{shortDescription}</p>

                {/* Pricing Block */}
                <div className={cn("mt-auto")}>
                    <div className={cn("flex items-center gap-2")}>
                        <p className={cn("text-xl font-extrabold text-red-600")}>
                            {displayPrice}
                        </p>
                        {displayCutPrice && (
                            <p className={cn("text-xs text-gray-500 line-through")}>
                                {displayCutPrice}
                            </p>
                        )}
                    </div>
                </div>
                
                {/* Color Variants (Dynamic Swatches) */}
                {colorVariants.length > 0 && (
                    <div className={cn("flex gap-2 mt-3 items-center")}>
                        {colorVariants.map((variant) => {
                            const colorClass = getColorClass(variant.value);
                            // Note: isSelected is not needed here as it's just showing colors available on the card.
                            return (
                                <button 
                                    key={variant.id}
                                    title={variant.value}
                                    className={cn(
                                        "w-5 h-5 rounded-full border-2 transition-all shadow-md",
                                        colorClass,
                                        // isSelected logic removed as it's not applicable here
                                        { 
                                            "bg-gray-200 border-gray-400": colorClass.includes('bg-white'),
                                        }
                                    )}
                                />
                            );
                        })}
                    </div>
                )}
            </div>
        </motion.div>
    );
}