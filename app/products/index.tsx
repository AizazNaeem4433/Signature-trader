// signature-trader/app/products/index.tsx
"use client";

import { useEffect, useState, useMemo } from 'react';
import { db } from '@/lib/firebase';
// Explicit Firestore types added
import { collection, query, onSnapshot, orderBy, where, QuerySnapshot, QueryDocumentSnapshot, FirestoreError } from 'firebase/firestore'; 
import { Loader2, Filter, X, ShoppingCart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import ProductCard from '@/components/storefront/ProductCard'; 
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSearchParams } from 'next/navigation'; // <-- NEW: Import useSearchParams

// --- INTERFACES (Ensure 'id' is defined for ProductCard compatibility) ---
interface ProductMedia { id: number; url: string; alt: string; type: 'image' | 'video'; }
interface VariantOption { id: number; value: string; priceAdjustment: number; linkedMediaId: number | null; }
interface VariantType { name: string; options: VariantOption[]; }

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

interface ProductData extends ProductCardProps {
    detailedDescription: string;
    stock: number;
    category_id: string;
    isActive: boolean;
}
// --------------------------------------------------------------------------

interface Category {
    id: string;
    name: string;
    slug: string;
}
interface Filters {
    selectedVariants: Record<string, string[]>; 
    priceRange: [number, number];
    // NOTE: search is handled outside of general filters, in useEffect below
}

const initialFilters: Filters = {
    selectedVariants: {},
    priceRange: [0, 15000],
};

interface ProductIndexProps {
    initialCategorySlug: string | null; 
}

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


export default function ProductIndex({ initialCategorySlug }: ProductIndexProps) {
    const searchParams = useSearchParams(); // <-- NEW
    const urlSearchQuery = searchParams.get('search') || ''; // <-- NEW
    
    const [allProducts, setAllProducts] = useState<ProductData[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<Filters>(initialFilters);
    const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
    
    const initialCategory: Category | undefined = useMemo(() => {
        return categories.find(c => c.slug === initialCategorySlug);
    }, [categories, initialCategorySlug]);

    const initialCategoryName = initialCategorySlug 
        ? initialCategory?.name || 'Category' 
        : 'All Products';


    // --- 1. DATA FETCHING (Categories & Products) ---
    // NOTE: Data fetching logic is optimized to handle search/category filters at the source if possible, 
    // but relies on client-side filtering for complex text search.
    useEffect(() => {
        let unsubscribeProducts: (() => void) | undefined = undefined; 
        let isCancelled = false;
        
        // --- Stage 1: Fetch Categories ---
        const categoriesQuery = query(collection(db, 'categories'), orderBy('name', 'asc'));
        const unsubscribeCategories = onSnapshot(categoriesQuery, (snapshot: QuerySnapshot) => { 
            const fetchedCategories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
            
            if (isCancelled) return;
            
            setCategories(fetchedCategories);
            
            // --- Stage 2: Determine initial filter and Fetch Products ---
            const currentInitialCategory = fetchedCategories.find(c => c.slug === initialCategorySlug);
            
            let productsQuery: any; 

            if (initialCategorySlug && !currentInitialCategory) {
                 setAllProducts([]);
                 setLoading(false);
                 return; 
            }

            if (currentInitialCategory && currentInitialCategory.id) {
                productsQuery = query(
                    collection(db, 'products'), 
                    where('category_id', '==', currentInitialCategory.id),
                    where('isActive', '==', true),
                    orderBy('name', 'asc')
                );
            } else {
                productsQuery = query(
                    collection(db, 'products'),
                    where('isActive', '==', true), 
                    orderBy('name', 'asc')
                );
            }

            // Subscribe to products once the query is built
            unsubscribeProducts = onSnapshot(productsQuery, (productSnapshot: QuerySnapshot) => { 
                if (isCancelled) return;
                
                const productsList = productSnapshot.docs
                    .map((doc: QueryDocumentSnapshot) => ({ id: doc.id, ...doc.data() } as ProductData)); 
                
                setAllProducts(productsList);
                setLoading(false); 
                
            }, (error: FirestoreError) => { 
                console.error("Firestore Product Query Failed:", error);
                if (!isCancelled) setLoading(false); 
            });

        }, (error: FirestoreError) => { 
            console.error("Firestore Category Fetch Failed:", error);
            if (!isCancelled) setLoading(false);
        });

        return () => {
            isCancelled = true;
            unsubscribeCategories();
            if (unsubscribeProducts) unsubscribeProducts(); 
        };
    }, [initialCategorySlug, categories.length]); 

    // --- 2. DYNAMICALLY GENERATE FILTER OPTIONS (Unchanged) ---
    const filterOptions = useMemo(() => {
        const allVariantOptions: Record<string, Set<string>> = {};
        let maxPrice = initialFilters.priceRange[1]; 
        let currentMaxPrice = maxPrice; 

        allProducts.forEach(product => {
            const price = product.basePrice > (product.cutPrice || 0) ? product.basePrice : (product.cutPrice || product.basePrice);
            if (price > currentMaxPrice) {
                currentMaxPrice = price;
            }

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
        
        if (filters.priceRange[1] === initialFilters.priceRange[1] && allProducts.length > 0) {
            setFilters(prev => ({
                ...prev,
                priceRange: [prev.priceRange[0], Math.ceil(currentMaxPrice / 100) * 100]
            }));
        }

        const availableVariants: Record<string, string[]> = {};
        for (const typeName in allVariantOptions) {
             availableVariants[typeName] = Array.from(allVariantOptions[typeName]).sort();
        }
        
        return { maxPrice: Math.ceil(currentMaxPrice / 100) * 100, availableVariants };
    }, [allProducts]);

    // --- 3. CLIENT-SIDE FILTERING & SEARCH LOGIC ---
    const filteredProducts = useMemo(() => {
        let result = allProducts;
        const normalizedSearch = urlSearchQuery.toLowerCase(); // <-- NEW

        // 3.1. Filter by Search Query
        if (normalizedSearch) {
             result = result.filter(p => 
                p.name.toLowerCase().includes(normalizedSearch) ||
                p.shortDescription.toLowerCase().includes(normalizedSearch)
             );
        }

        // 3.2. Filter by Price Range
        result = result.filter(p => p.basePrice >= filters.priceRange[0] && p.basePrice <= filters.priceRange[1]);

        // 3.3. Filter by Variants
        for (const typeName in filters.selectedVariants) {
            const selectedOptions = filters.selectedVariants[typeName];
            if (selectedOptions.length > 0) {
                result = result.filter(product => 
                    product.variantTypes.some(vt => 
                        vt.name === typeName && 
                        vt.options.some(opt => selectedOptions.includes(opt.value))
                    )
                );
            }
        }

        return result;
    }, [allProducts, filters, urlSearchQuery]); // <-- Added urlSearchQuery dependency


    // --- HANDLERS (Unchanged) ---
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
            priceRange: [0, value] 
        }));
    };

    const handleClearFilters = () => {
        setFilters(prev => ({ 
            ...initialFilters, 
            priceRange: [0, filterOptions.maxPrice]
        }));
        setIsMobileFilterOpen(false);
    };
    
    // --- RENDER FUNCTIONS (Unchanged) ---
    
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
                    className={cn("text-center py-20 border-2 border-dashed border-border rounded-xl bg-muted/20 md:col-span-3")}
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

    const renderFilterContent = () => (
        <div className={cn("space-y-6")}>
            
            {/* Clear All Filters Button */}
             <div className={cn("pb-4 border-b border-border")}>
                <button onClick={handleClearFilters} className={cn("text-red-600 hover:underline font-medium w-full text-center")}>
                    Clear All Filters
                </button>
             </div>
             
            {/* Price Range Filter */}
            <div className={cn("space-y-3")}>
                <h3 className={cn("text-lg font-semibold text-foreground border-b border-border pb-2")}>Price Range (PKR)</h3>
                
                <Label htmlFor="price-range">Max Price: PKR {filters.priceRange[1].toLocaleString()}</Label>
                <Input
                    id="price-range"
                    type="range"
                    min="0"
                    max={filterOptions.maxPrice} 
                    step="100"
                    value={filters.priceRange[1]}
                    onChange={handlePriceChange}
                    className={cn("w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer range-lg")}
                />
            </div>

            {/* Dynamic Variant Filters (Size, Color, etc.) */}
            {Object.keys(filterOptions.availableVariants).map(typeName => {
                const isColor = typeName.toLowerCase().includes('color');
                const availableOptions = filterOptions.availableVariants[typeName];
                
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
        </div>
    );


    // --- FINAL RENDER STRUCTURE ---
    const activeFilterCount = Object.keys(filters.selectedVariants).reduce((count, key) => count + filters.selectedVariants[key].length, 0);

    // Show loading state first
    if (loading || (initialCategorySlug && !initialCategory && categories.length > 0)) {
        return (
            <main className={cn("min-h-screen flex items-center justify-center")}>
                <Loader2 className={cn("w-8 h-8 animate-spin mx-auto text-[#FFCE00]")} />
            </main>
        );
    }
    
    // Handle Case: Category slug provided but no products found
    if (initialCategorySlug && allProducts.length === 0) {
        return (
            <main className={cn("max-w-7xl mx-auto px-6 py-12 min-h-screen text-center")}>
                <h1 className={cn("text-4xl font-bold mb-8 text-red-600")}>
                    {initialCategoryName}
                </h1>
                <p className={cn("text-xl text-muted-foreground")}>No products found in this category yet.</p>
            </main>
        );
    }


    return (
        <main className={cn("max-w-7xl mx-auto px-6 py-12 min-h-screen")}>
            <h1 className={cn("text-4xl font-bold mb-8 flex items-center gap-3", initialCategorySlug && "text-red-600")}>
                <ShoppingCart className={cn("w-8 h-8 text-[#FFCE00]")} /> 
                {initialCategorySlug ? initialCategoryName : 'All Products'} ({filteredProducts.length})
                {urlSearchQuery && <span className={cn("text-xl text-muted-foreground ml-4")}>/ Search: "{urlSearchQuery}"</span>}
            </h1>

            <div className={cn("flex justify-between items-center mb-6 border-b border-border pb-4")}>
                <p className={cn("text-sm text-muted-foreground")}>
                    {activeFilterCount > 0 || urlSearchQuery
                        ? `${filteredProducts.length} results found`
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
            
            {/* --- Mobile Filter Drawer (Same as before) --- */}
            <AnimatePresence>
                {isMobileFilterOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMobileFilterOpen(false)}
                            className={cn("fixed inset-0 bg-black/50 z-40")}
                        />
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