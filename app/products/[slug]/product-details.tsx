// signature-trader/app/products/[slug]/product-details.tsx
/* eslint-disable no-alert, quotes */
"use client"; // <-- Yeh client component hai

import { useEffect, useState, useMemo } from 'react';
// Firestore/Params imports yahan se hata diye gaye hain
import { Loader2, ShoppingCart, ArrowRight, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label'; 
import ProductCard from '@/components/storefront/ProductCard'; 
import { useCartStore } from '@/lib/store/useCartStore'; 
import { useNotificationStore } from '@/lib/store/useNotificationStore'; 

// --- INTERFACES (Yahan dubara define karein) ---
interface ProductMedia { id: number; url: string; alt: string; type: 'image' | 'video'; }
interface VariantOption { id: number; value: string; priceAdjustment: number; linkedMediaId: number | null; }
interface VariantType { id: number; name: string; options: VariantOption[]; }
export interface ProductData { // 'export' add kiya taake page.tsx bhi istemal kar sakay
    id: string;
    name: string;
    slug: string;
    basePrice: number;
    cutPrice: number;
    shortDescription: string;
    detailedDescription: string;
    stock: number;
    media: ProductMedia[];
    variantTypes: VariantType[];
    category_id: string;
    isActive: boolean;
}
interface PriceCalculation {
    finalPrice: number;
    totalAdjustment: number;
    currentStock: number;
    linkedMedia: ProductMedia | undefined;
}

// --- Props jo Server Component (page.tsx) se aayein gay ---
interface ProductDetailClientProps {
  product: ProductData;
  relatedProducts: ProductData[];
}

export default function ProductDetailClient({ product, relatedProducts }: ProductDetailClientProps) {
    
    // --- State ab props se initialize ho gi ---
    const [mainMedia, setMainMedia] = useState<ProductMedia | null>(product.media[0] || null);
    const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>(() => {
        const initialSelections: Record<string, string> = {};
        product.variantTypes.forEach((vt: VariantType) => { 
            if (vt.options.length > 0) { initialSelections[vt.name] = vt.options[0].value; }
        });
        return initialSelections;
    });
    const [quantity, setQuantity] = useState(1);
    
    // Cart and Notification Stores
    const { addItem: addToCart } = useCartStore(); 
    const { addNotification } = useNotificationStore(); 

    // --- Data fetching useEffect() hata diya gaya hai ---

    // --- UTILITY: Dynamic Color Class Generator ---
    const getColorClass = (colorName: string): string => {
        const name = colorName.toLowerCase();
        if (name.includes('red')) return 'bg-red-600';
        if (name.includes('blue')) return 'bg-blue-600';
        if (name.includes('green')) return 'bg-green-600';
        if (name.includes('yellow') || name.includes('gold')) return 'bg-[#FFCE00]';
        if (name.includes('black')) return 'bg-black';
        if (name.includes('white')) return 'bg-white border border-gray-300';
        return 'bg-gray-400';
    };

    // --- 2. Dynamic Price & Media Calculation (unchanged) ---
    const priceData: PriceCalculation = useMemo(() => {
        if (!product) return { finalPrice: 0, totalAdjustment: 0, currentStock: 0, linkedMedia: undefined };

        let adjustment = 0;
        let linkedMediaId: number | null = null;
        let stock = product.stock; 
        
        product.variantTypes.forEach((vt: VariantType) => {
            const selectedValue = selectedVariants[vt.name];
            const selectedOption = vt.options.find((opt: VariantOption) => opt.value === selectedValue);
            
            if (selectedOption) {
                adjustment += selectedOption.priceAdjustment;
                
                if (selectedOption.linkedMediaId !== null) {
                    linkedMediaId = selectedOption.linkedMediaId;
                }
            }
        });

        const currentLinkedMedia = linkedMediaId !== null ? product.media.find(m => m.id === linkedMediaId) : undefined;

        return {
            finalPrice: product.basePrice + adjustment,
            totalAdjustment: adjustment,
            currentStock: stock,
            linkedMedia: currentLinkedMedia, 
        };
    }, [product, selectedVariants]);

    // --- 3. Separate Effect for Image Switching based on Variants (unchanged) ---
    useEffect(() => {
        if (priceData.linkedMedia && mainMedia?.id !== priceData.linkedMedia.id) {
            setMainMedia(priceData.linkedMedia);
        } else if (!priceData.linkedMedia && product && product.media.length > 0 && mainMedia?.id !== product.media[0].id) {
            setMainMedia(product.media[0]);
        }
    }, [product, priceData.linkedMedia, mainMedia]);
    
    
    // --- 4. Add To Cart Logic ---
    const handleAddToCart = () => {
        if (!product || quantity <= 0 || quantity > priceData.currentStock) {
            addNotification("Please select a valid quantity and ensure the item is in stock.", "error");
            return;
        }
        
        const cartItem = {
            productId: product.id,
            name: product.name,
            slug: product.slug,
            basePrice: priceData.finalPrice, 
            quantity: quantity,
            selectedVariants: selectedVariants,
            mediaUrl: product.media[0]?.url || '/placeholder.png' 
        };
        
        addToCart(cartItem); 
    };

    const handleVariantClick = (vtName: string, optValue: string) => {
        setSelectedVariants(prev => ({ ...prev, [vtName]: optValue }));
    };


    // Separate Variant Render (To use swatches/buttons)
    const renderVariantSelector = (vt: VariantType) => {
        const isColorSwatch = vt.name.toLowerCase().includes('color') || vt.name.toLowerCase().includes('colour');
        
        return (
            <div key={vt.name} className={cn("space-y-2")}>
                <Label className={cn("text-sm font-medium block")}>
                    {vt.name}: <span className={cn("font-semibold text-foreground")}>{selectedVariants[vt.name]}</span>
                </Label>
                
                <div className={cn("flex flex-wrap gap-2")}>
                    {vt.options.map((opt) => {
                        const isSelected = selectedVariants[vt.name] === opt.value;
                        
                        if (isColorSwatch) {
                            const colorClass = getColorClass(opt.value);
                            return (
                                <motion.button
                                    key={opt.id}
                                    whileTap={{ scale: 0.95 }}
                                    title={opt.value}
                                    onClick={() => handleVariantClick(vt.name, opt.value)}
                                    className={cn(
                                        "w-8 h-8 rounded-full border-2 transition-all shadow-md",
                                        colorClass,
                                        { 
                                            "ring-4 ring-offset-2 ring-[#FFCE00]": isSelected,
                                            "hover:ring-2 hover:ring-gray-400": !isSelected,
                                            "bg-gray-200 border-gray-400": colorClass.includes('bg-white'), 
                                        }
                                    )}
                                />
                            );
                        } else {
                            return (
                                <motion.button
                                    key={opt.id}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleVariantClick(vt.name, opt.value)}
                                    className={cn(
                                        "px-4 py-1.5 rounded-md text-sm font-medium border transition-all",
                                        {
                                            "bg-red-600 text-white border-red-600 shadow-sm": isSelected,
                                            "bg-background text-foreground hover:bg-muted/50 dark:border-gray-700": !isSelected,
                                        }
                                    )}
                                >
                                    {opt.value}
                                </motion.button>
                            );
                        }
                    })}
                </div>
            </div>
        );
    };

    // --- Final Render Setup ---
    // Loading/Error states hata diye gaye hain, kyunki parent (page.tsx) yeh handle karay ga

    const displayCutPrice = product.cutPrice && product.cutPrice > product.basePrice 
        ? product.cutPrice.toLocaleString('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 }) 
        : null;
        
    const displayFinalPrice = priceData.finalPrice.toLocaleString('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 });

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className={cn("max-w-7xl mx-auto px-6 py-12 min-h-screen")}
        >
            <div className={cn("grid grid-cols-1 lg:grid-cols-2 gap-12")}>
                
                {/* --- LEFT: Media Gallery --- */}
                <div className={cn("space-y-6")}>
                    <div className={cn("aspect-square rounded-xl overflow-hidden bg-muted/50 shadow-xl")}>
                        {mainMedia && mainMedia.type === 'video' ? (
                             <video controls autoPlay muted loop className={cn("w-full h-full object-cover")}>
                                <source src={mainMedia.url} type="video/mp4" />
                                Your browser does not support the video tag.
                             </video>
                        ) : (
                            <img 
                                src={mainMedia?.url || '/placeholder.png'} 
                                alt={mainMedia?.alt || product.name} 
                                className={cn("w-full h-full object-cover")}
                            />
                        )}
                    </div>
                    
                    <div className={cn("flex gap-3 overflow-x-auto pb-2")}>
                        {product.media.map((mediaItem) => (
                            <motion.div 
                                key={mediaItem.id}
                                whileHover={{ scale: 1.05 }}
                                className={cn(
                                    "w-20 h-20 shrink-0 rounded-lg overflow-hidden border-2 cursor-pointer transition-colors",
                                    mainMedia?.id === mediaItem.id ? "border-[#FFCE00]" : "border-transparent hover:border-gray-300"
                                )}
                                onClick={() => setMainMedia(mediaItem)}
                            >
                                {mediaItem.type === 'video' ? (
                                    <video muted className={cn("w-full h-full object-cover")} src={mediaItem.url} />
                                ) : (
                                    <img src={mediaItem.url} alt={mediaItem.alt} className={cn("w-full h-full object-cover")} />
                                )}
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* --- RIGHT: Details and Purchase --- */}
                <div className={cn("space-y-8")}>
                    <div className={cn("border-b border-border pb-4")}>
                        <h1 className={cn("text-3xl font-extrabold text-foreground mb-2")}>{product.name}</h1>
                        <p className={cn("text-lg text-muted-foreground")}>{product.shortDescription}</p>
                    </div>

                    <div className={cn("space-y-1")}>
                        {displayCutPrice && (
                             <p className={cn("text-xl text-gray-500 line-through")}>
                                {displayCutPrice}
                            </p>
                        )}
                        <p className={cn("text-4xl font-extrabold text-red-600 flex items-baseline gap-2")}>
                            {displayFinalPrice}
                            {priceData.totalAdjustment !== 0 && (
                                <span className={cn("text-base font-semibold text-gray-500")}>
                                    ({priceData.totalAdjustment > 0 ? '+' : ''}{priceData.totalAdjustment.toLocaleString()} Adj)
                                </span>
                            )}
                        </p>
                    </div>

                    <div className={cn("space-y-4 pt-4")}>
                        {product.variantTypes.map((vt) => renderVariantSelector(vt))}
                    </div>
                    
                    <div className={cn("flex items-center gap-6 pt-4")}>
                        <Label>Quantity:</Label>
                        <Input
                            type="number"
                            min="1"
                            max={priceData.currentStock}
                            value={quantity}
                            onChange={(e) => setQuantity(Number(e.target.value))}
                            className={cn("w-20 text-center")}
                        />
                        <span className={cn("text-sm font-medium", priceData.currentStock > 0 ? "text-green-600" : "text-red-600")}>
                            {priceData.currentStock > 0 ? `${priceData.currentStock} in stock` : "Out of Stock"}
                        </span>
                    </div>

                    <Button
                        onClick={handleAddToCart}
                        disabled={priceData.currentStock <= 0 || quantity > priceData.currentStock}
                        className={cn("w-full md:w-96 mt-6 bg-[#FFCE00] hover:bg-[#e6b800] text-black text-lg font-bold shadow-md")}
                    >
                        <ShoppingCart className={cn("w-5 h-5 mr-3")} /> Add to Cart
                    </Button>
                    
                    <div className={cn("pt-6 border-t border-border mt-8")}>
                        <h3 className={cn("text-xl font-semibold mb-3")}>Product Details</h3>
                        <p className={cn("text-muted-foreground leading-relaxed whitespace-pre-wrap")}>
                            {product.detailedDescription}
                        </p>
                    </div>
                </div>
            </div>

            {/* --- Related Products Section --- */}
            {relatedProducts.length > 0 && (
                <section className={cn("mt-20")}>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        viewport={{ once: true }}
                        className={cn("text-3xl font-bold mb-8 text-foreground text-center")}
                    >
                        You May Also Like
                    </motion.h2>
                    
                    <div className={cn("grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6")}>
                        {relatedProducts.map((p) => (
                            <ProductCard
                                key={p.id}
                                id={p.id} 
                                slug={p.slug}
                                name={p.name}
                                basePrice={p.basePrice}
                                cutPrice={p.cutPrice}
                                shortDescription={p.shortDescription}
                                media={p.media}
                                variantTypes={p.variantTypes}
                            />
                        ))}
                    </div>
                </section>
            )}
        </motion.div>
    );
}