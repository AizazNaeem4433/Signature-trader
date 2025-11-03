// signature-trader/app/products/page.tsx
"use client";

import { useEffect, useState, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { Loader2, Filter, X, ShoppingCart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import ProductCard from '@/components/storefront/ProductCard'; 
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// --- INTERFACES (Reused from existing files) ---
interface ProductMedia { id: number; url: string; alt: string; type: 'image' | 'video'; }
interface VariantOption { id: number; value: string; priceAdjustment: number; linkedMediaId: number | null; }
interface VariantType { name: string; options: VariantOption[]; }
interface ProductData {
    id: string;
    name: string;
    slug: string;
    basePrice: number;
    cutPrice?: number;
    shortDescription: string;
    media: ProductMedia[];
    variantTypes: VariantType[];
    category_id: string;
    isActive: boolean;
}
interface Category {
    id: string;
    name: string;
    slug: string;
}

// --- FILTER STATE INTERFACE ---
interface Filters {
    selectedCategory: string | null;
    selectedVariants: Record<string, string[]>; // { 'Color': ['Red', 'Blue'], 'Size': ['S'] }
    priceRange: [number, number];
}

const initialFilters: Filters = {
    selectedCategory: null,
    selectedVariants: {},
    priceRange: [0, 15000], // Default max price
};

// --- UTILITY: Dynamic Color Class Generator (Reused from Product Card) ---
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
    return 'bg-gray-400';
};


export default function AllProductsPage() {
    const [allProducts, setAllProducts] = useState<ProductData[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<Filters>(initialFilters);
    const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

    // --- 1. DATA FETCHING (Products & Categories) ---
    useEffect(() => {
        const productsQuery = query(collection(db, 'products'), orderBy('name', 'asc'));
        const categoriesQuery = query(collection(db, 'categories'), orderBy('name', 'asc'));

        const unsubscribeProducts = onSnapshot(productsQuery, (snapshot) => {
            const productsList = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() } as ProductData))
                .filter(p => p.isActive);
            setAllProducts(productsList);
            setLoading(false);
        });

        const unsubscribeCategories = onSnapshot(categoriesQuery, (snapshot) => {
            setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category)));
        });

        return () => {
            unsubscribeProducts();
            unsubscribeCategories();
        };
    }, []);

    // --- 2. DYNAMICALLY GENERATE FILTER OPTIONS (Max Price and Variant Options) ---
    const filterOptions = useMemo(() => {
        const allVariantOptions: Record<string, Set<string>> = {};
        let maxPrice = initialFilters.priceRange[1]; // Start with default max

        allProducts.forEach(product => {
            // Find max price for the range slider
            const price = product.basePrice > (product.cutPrice || 0) ? product.basePrice : (product.cutPrice || product.basePrice);
            if (price > maxPrice) {
                maxPrice = price;
            }

            // Aggregate all variant options across all products
            product.variantTypes.forEach(vt => {
                const typeName = vt.name;
                if (!allVariantOptions[typeName]) {
                    allVariantOptions[typeName] = new Set();
                }
                vt.options.forEach(opt => {
                    allVariantOptions[typeName].add(opt.value);
                });
            });
        });
        
        // Ensure price range is updated on initial load, but keep user's selection if filtering.
        setFilters(prev => ({
            ...prev,
            priceRange: [prev.priceRange[0], Math.ceil(maxPrice / 100) * 100]
        }));


        // Convert Sets to sorted Arrays for rendering
        const availableVariants: Record<string, string[]> = {};
        for (const typeName in allVariantOptions) {
             availableVariants[typeName] = Array.from(allVariantOptions[typeName]).sort();
        }
        
        return { maxPrice: Math.ceil(maxPrice / 100) * 100, availableVariants };
    }, [allProducts]);

    // --- 3. FILTERING LOGIC ---
    const filteredProducts = useMemo(() => {
        let result = allProducts;

        // --- Filter by Category ---
        if (filters.selectedCategory) {
            const targetCatId = categories.find(c => c.slug === filters.selectedCategory)?.id;
            if (targetCatId) {
                result = result.filter(p => p.category_id === targetCatId);
            }
        }

        // --- Filter by Price Range ---
        result = result.filter(p => p.basePrice >= filters.priceRange[0] && p.basePrice <= filters.priceRange[1]);

        // --- Filter by Variants (Logical AND/OR based on type) ---
        for (const typeName in filters.selectedVariants) {
            const selectedOptions = filters.selectedVariants[typeName];
            if (selectedOptions.length > 0) {
                result = result.filter(product => 
                    // Product must have AT LEAST ONE of the selected options for this type
                    product.variantTypes.some(vt => 
                        vt.name === typeName && 
                        vt.options.some(opt => selectedOptions.includes(opt.value))
                    )
                );
            }
        }

        return result;
    }, [allProducts, categories, filters]);


    // --- HANDLERS ---

    const handleCategoryChange = (slug: string) => {
        setFilters(prev => ({ 
            ...prev, 
            selectedCategory: prev.selectedCategory === slug ? null : slug 
        }));
    };
    
    const handleVariantToggle = (typeName: string, optionValue: string) => {
        setFilters(prev => {
            const currentOptions = prev.selectedVariants[typeName] || [];
            const isSelected = currentOptions.includes(optionValue);
            let newOptions: string[];

            if (isSelected) {
                newOptions = currentOptions.filter(v => v !== optionValue);
            } else {
                newOptions = [...currentOptions, optionValue];
            }
            
            // Remove the variant type entry if no options are selected
            const newSelectedVariants = { ...prev.selectedVariants, [typeName]: newOptions };
            if (newOptions.length === 0) {
                 delete newSelectedVariants[typeName];
            }
            
            return { ...prev, selectedVariants: newSelectedVariants };
        });
    };
    
    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = Number(e.target.value);
        setFilters(prev => ({ 
            ...prev, 
            priceRange: [0, value] // Simple top-down filter for now
        }));
    };

    const handleClearFilters = () => {
        setFilters(prev => ({ 
            ...initialFilters, 
            priceRange: [0, filterOptions.maxPrice] // Reset max price based on current max data
        }));
        setIsMobileFilterOpen(false);
    };
    
    // --- RENDER FUNCTIONS ---
    
    // Render: Product Grid
    const renderProductGrid = () => (
        <AnimatePresence mode="wait">
            {filteredProducts.length > 0 ? (
                <motion.div
                    key="product-grid"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className={cn("grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6")}
                >
                    {filteredProducts.map((product) => (
                        <ProductCard
                            key={product.id}
                            id={product.id}
                            slug={product.slug}
                            name={product.name}
                            basePrice={product.basePrice}
                            cutPrice={product.cutPrice}
                            shortDescription={product.shortDescription}
                            media={product.media}
                            variantTypes={product.variantTypes}
                        />
                    ))}
                </motion.div>
            ) : (
                <motion.div 
                    key="no-results"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={cn("text-center py-20 border-2 border-dashed border-border rounded-xl bg-muted/20 lg:col-span-3")}
                >
                    <p className={cn("text-xl font-semibold text-muted-foreground")}>No products match your current filters.</p>
                    <button 
                        onClick={handleClearFilters} 
                        className={cn("mt-4 text-red-600 hover:underline font-medium")}
                    >
                        Clear Filters
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    );

    // Render: Filter Sidebar Content
    const renderFilterContent = () => (
        <div className={cn("space-y-6")}>
            {/* Price Range Filter */}
            <div className={cn("space-y-3")}>
                <h3 className={cn("text-lg font-semibold text-foreground border-b border-border pb-2")}>Price Range (PKR)</h3>
                
                <Label htmlFor="price-range">Max Price: PKR {filters.priceRange[1].toLocaleString()}</Label>
                <Input
                    id="price-range"
                    type="range"
                    min="0"
                    max={filterOptions.maxPrice} // Use dynamic max price
                    step="100"
                    value={filters.priceRange[1]}
                    onChange={handlePriceChange}
                    className={cn("w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer range-lg")}
                />
            </div>

            {/* Category Filter */}
            <div className={cn("space-y-3")}>
                <h3 className={cn("text-lg font-semibold text-foreground border-b border-border pb-2")}>Categories</h3>
                <div className={cn("space-y-2")}>
                    {categories.map((cat) => {
                        const isSelected = filters.selectedCategory === cat.slug;
                        return (
                            <button
                                key={cat.id}
                                onClick={() => handleCategoryChange(cat.slug)}
                                className={cn(
                                    "flex items-center justify-between w-full p-2 rounded-md text-sm transition-colors",
                                    isSelected
                                        ? "bg-red-600 text-white font-medium"
                                        : "hover:bg-muted/50 text-foreground"
                                )}
                            >
                                {cat.name}
                                {isSelected && <X className={cn("w-3 h-3")} />}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Dynamic Variant Filters (Size, Color, etc.) */}
            {Object.keys(filterOptions.availableVariants).map(typeName => {
                const isColor = typeName.toLowerCase().includes('color');
                const availableOptions = filterOptions.availableVariants[typeName];
                
                // Only render if there are options for this type
                if (availableOptions.length === 0) return null;
                
                return (
                    <div key={typeName} className={cn("space-y-3 pt-4 border-t border-border")}>
                        <h3 className={cn("text-lg font-semibold text-foreground border-b border-border pb-2")}>
                            {typeName}
                        </h3>
                        
                        <div className={cn("flex flex-wrap gap-3")}>
                            {availableOptions.map(optionValue => {
                                const isSelected = filters.selectedVariants[typeName]?.includes(optionValue) || false;
                                
                                if (isColor) {
                                    // Color Swatch Filter
                                    const colorClass = getColorClass(optionValue);
                                    return (
                                        <motion.button
                                            key={optionValue}
                                            whileTap={{ scale: 0.95 }}
                                            title={optionValue}
                                            onClick={() => handleVariantToggle(typeName, optionValue)}
                                            className={cn(
                                                "w-7 h-7 rounded-full border-2 transition-all shadow-md",
                                                colorClass,
                                                { 
                                                    "ring-4 ring-offset-2 ring-[#FFCE00]": isSelected,
                                                    "hover:ring-2 hover:ring-gray-400": !isSelected,
                                                    "bg-gray-200 border-gray-400": colorClass.includes('bg-white'),
                                                }
                                            )}
                                            aria-label={`Filter by ${typeName}: ${optionValue}`}
                                        />
                                    );
                                } else {
                                    // Button/Text Filter
                                    return (
                                        <button
                                            key={optionValue}
                                            onClick={() => handleVariantToggle(typeName, optionValue)}
                                            className={cn(
                                                "px-3 py-1 text-sm rounded-md border transition-all",
                                                {
                                                    "bg-red-600 text-white border-red-600 shadow-sm": isSelected,
                                                    "bg-background text-foreground hover:bg-muted/50 dark:border-gray-700": !isSelected,
                                                }
                                            )}
                                        >
                                            {optionValue}
                                        </button>
                                    );
                                }
                            })}
                        </div>
                    </div>
                );
            })}
            
             {/* Clear Filter Button */}
             <div className={cn("pt-6 border-t border-border")}>
                <button onClick={handleClearFilters} className={cn("text-red-600 hover:underline font-medium w-full text-center")}>
                    Clear All Filters
                </button>
             </div>
        </div>
    );


    // --- MAIN RENDER ---
    if (loading) {
        return (
            <main className={cn("min-h-screen flex items-center justify-center")}>
                <Loader2 className={cn("w-8 h-8 animate-spin mx-auto text-[#FFCE00]")} />
            </main>
        );
    }
    
    // Total active filters for display
    const activeFilterCount = (filters.selectedCategory ? 1 : 0) + 
                              Object.keys(filters.selectedVariants).reduce((count, key) => count + filters.selectedVariants[key].length, 0);


    return (
        <main className={cn("max-w-7xl mx-auto px-6 py-12 min-h-screen")}>
            <h1 className={cn("text-4xl font-bold mb-8 flex items-center gap-3")}>
                <ShoppingCart className={cn("w-8 h-8 text-[#FFCE00]")} /> All Products ({filteredProducts.length})
            </h1>

            <div className={cn("flex justify-between items-center mb-6 border-b border-border pb-4")}>
                <p className={cn("text-sm text-muted-foreground")}>
                    {activeFilterCount > 0 
                        ? `${filteredProducts.length} results matching ${activeFilterCount} filters`
                        : `${allProducts.length} total products`}
                </p>
                
                {/* Mobile Filter Toggle */}
                <button 
                    onClick={() => setIsMobileFilterOpen(true)}
                    className={cn("md:hidden flex items-center gap-2 text-red-600 hover:text-red-700 font-medium")}
                >
                    <Filter className={cn("w-5 h-5")} /> Filter
                    {activeFilterCount > 0 && (
                        <span className={cn("bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center")}>
                            {activeFilterCount}
                        </span>
                    )}
                </button>
            </div>

            <div className={cn("grid grid-cols-1 md:grid-cols-[280px_1fr] gap-8")}>
                
                {/* --- LEFT: Desktop Filter Sidebar --- */}
                <aside className={cn("hidden md:block bg-card p-6 rounded-xl shadow-lg border border-border sticky top-28 h-fit")}>
                    {renderFilterContent()}
                </aside>

                {/* --- RIGHT: Product Grid --- */}
                <section>
                    {renderProductGrid()}
                </section>
            </div>
            
            {/* --- Mobile Filter Drawer --- */}
            <AnimatePresence>
                {isMobileFilterOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMobileFilterOpen(false)}
                            className={cn("fixed inset-0 bg-black/50 z-40")}
                        />
                        {/* Drawer */}
                        <motion.div
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", stiffness: 200, damping: 30 }}
                            className={cn("fixed top-0 left-0 w-80 h-full bg-card shadow-2xl z-50 p-6 overflow-y-auto")}
                        >
                            <div className={cn("flex justify-between items-center border-b border-border pb-4 mb-6")}>
                                <h2 className={cn("text-xl font-bold flex items-center gap-2")}><Filter className={cn("w-5 h-5 text-[#FFCE00]")} /> Filter</h2>
                                <button onClick={() => setIsMobileFilterOpen(false)} aria-label="Close filters">
                                    <X className={cn("w-6 h-6 text-muted-foreground")} />
                                </button>
                            </div>
                            {renderFilterContent()}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </main>
    );
}