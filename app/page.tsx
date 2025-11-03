// signature-trader/app/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { Loader2, Zap, Star, ShoppingCart } from 'lucide-react';
import ProductCard from "@/components/storefront/ProductCard";
import Hero from "@/components/HeroSection";
import { motion } from 'framer-motion';
import Link from 'next/link';

// --- INTERFACES (Matching Firestore Structure) ---
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
    detailedDescription: string;
    stock: number;
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

export default function HomePage() {
    const [products, setProducts] = useState<ProductData[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    // --- FETCH PRODUCTS & CATEGORIES ---
    useEffect(() => {
        // Fetch all products (sorted by creation date for "Featured" simplicity)
        const productsQuery = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
        const unsubscribeProducts = onSnapshot(productsQuery, (snapshot) => {
            const productsList = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() } as ProductData))
                .filter(p => p.isActive);
            setProducts(productsList);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching products:", error);
            setLoading(false);
        });

        // Fetch categories 
        const categoriesQuery = query(collection(db, 'categories'), orderBy('name', 'asc'));
        const unsubscribeCategories = onSnapshot(categoriesQuery, (snapshot) => {
            setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category)));
        });

        return () => {
            unsubscribeProducts();
            unsubscribeCategories();
        };
    }, []);

    // --- Data Curation Logic ---
    const featuredProducts = products.slice(0, 6); // Top 6 for Featured Section (2 rows of 3)

    // Prepare Category Sections (Groups products under their category name)
    const categorySections = categories.map(cat => ({
        ...cat,
        products: products.filter(p => p.category_id === cat.id).slice(0, 4) // Show top 4 products per category
    })).filter(section => section.products.length > 0);


    if (loading) {
        return (
            <main className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#FFCE00]" />
            </main>
        );
    }

    // Helper to render product grid (3 items per row on larger screens)
    const renderProductGrid = (products: ProductData[], itemsPerRow: 3 | 4) => (
        <div className={
            // Dynamic Tailwind grid layout based on itemsPerRow
            cn("grid gap-6", {
                "grid-cols-2 sm:grid-cols-3 lg:grid-cols-3": itemsPerRow === 3,
                "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4": itemsPerRow === 4
            })
        }>
            {products.map((product) => (
                <ProductCard
                    key={product.id}
                    slug={product.slug}
                    name={product.name}
                    basePrice={product.basePrice}
                    cutPrice={product.cutPrice}
                    shortDescription={product.shortDescription}
                    media={product.media}
                    variantTypes={product.variantTypes} id={''}                />
            ))}
        </div>
    );


    return (
        <main className="flex flex-col">
            
            {/* Hero Section (Already exists) */}
            <Hero />

            <div className="max-w-7xl mx-auto px-6 py-16 w-full space-y-16">

                {/* --- 1. Featured Products (Max 6, 3 per row) --- */}
                {featuredProducts.length > 0 && (
                    <section>
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            viewport={{ once: true }}
                            className="text-3xl font-bold mb-8 flex items-center justify-center gap-3 text-red-600"
                        >
                            <Zap className="w-6 h-6"/> Featured Best Sellers
                        </motion.h2>
                        
                        {renderProductGrid(featuredProducts, 3)}
                        
                        <div className="flex justify-center mt-8">
                            <Link href="/products" className="text-red-600 font-medium hover:underline transition-colors">
                                View All Products →
                            </Link>
                        </div>
                    </section>
                )}
                
                {/* --- 2. Category Sections (Dynamic) --- */}
                {categorySections.map((section, index) => (
                    <section key={section.id}>
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            viewport={{ once: true }}
                            className="text-3xl font-bold mb-8 flex items-center gap-3 text-foreground"
                        >
                            <Star className="w-6 h-6 text-[#FFCE00]"/> {section.name} Essentials
                        </motion.h2>
                        
                        {renderProductGrid(section.products, 4)}

                        <div className="flex justify-center mt-8">
                            <Link href={`/products?category=${section.slug}`} className="text-red-600 font-medium hover:underline transition-colors">
                                View All {section.name} Products →
                            </Link>
                        </div>
                    </section>
                ))}

                {/* Placeholder if no products exist */}
                {products.length === 0 && (
                    <section className="text-center py-20 border-2 border-dashed border-border rounded-xl bg-muted/20">
                        <p className="text-xl font-semibold text-muted-foreground">Store is currently empty.</p>
                        <p className="text-sm text-gray-500 mt-2">Add products and categories via the Admin Panel.</p>
                    </section>
                )}
            </div>
        </main>
    );
}
function cn(...args: any[]): string {
  // If first arg is string and second is object, handle conditional classes
  if (typeof args[0] === 'string' && typeof args[1] === 'object') {
    const baseClasses = args[0];
    const conditionals = args[1];
    
    // Get active conditional classes
    const activeConditionals = Object.entries(conditionals)
      .filter(([_, condition]) => condition)
      .map(([className]) => className)
      .join(' ');

    // Combine base classes with active conditionals
    return [baseClasses, activeConditionals].filter(Boolean).join(' ');
  }
  
  // Fallback: just join all arguments with spaces
  return args.filter(Boolean).join(' ');
}
