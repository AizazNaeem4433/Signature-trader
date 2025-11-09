// signature-trader/app/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { Loader2, Zap, Star, ArrowRight } from 'lucide-react';
import ProductCard from "@/components/storefront/ProductCard";
import Hero from "@/components/HeroSection";
import { motion } from 'framer-motion';
import Link from 'next/link';
import { cn } from '@/lib/utils';

// --- INTERFACES ---
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
  isFeatured?: boolean;
}
interface Category {
  id: string;
  name: string;
  slug: string;
}

// Framer Motion Variants
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

export default function HomePage() {
  const [products, setProducts] = useState<ProductData[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // --- FETCH PRODUCTS & CATEGORIES ---
  useEffect(() => {
    const productsQuery = query(
      collection(db, 'products'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeProducts = onSnapshot(productsQuery, (snapshot) => {
      const productsList = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as ProductData))
        .filter(p => p.isActive); // show only active
      setProducts(productsList);
      setLoading(false);
    }, (error) => {
      console.error("Error getting products:", error);
      setLoading(false);
    });

    const categoriesQuery = query(collection(db, 'categories'), orderBy('name', 'asc'));
    const unsubscribeCategories = onSnapshot(categoriesQuery, (snapshot) => {
      setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category)));
    });

    return () => {
      unsubscribeProducts();
      unsubscribeCategories();
    };
  }, []);

  // --- FEATURED PRODUCTS ---
  const featuredProducts = products.filter(p => p.isFeatured).slice(0, 6);

  // --- CATEGORY SECTIONS ---
  const categorySections = categories.map(cat => ({
    ...cat,
    products: products.filter(p => p.category_id === cat.id).slice(0, 4)
  })).filter(section => section.products.length > 0);

  if (loading) {
    return (
      <main className="fixed inset-0 z-50 bg-background flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-[#FFCE00]" />
      </main>
    );
  }

  const renderProductGrid = (products: ProductData[], itemsPerRow: 3 | 4) => (
    <motion.div
      className={cn("grid gap-6", {
        "grid-cols-2 md:grid-cols-3 xl:grid-cols-3": itemsPerRow === 3,
        "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4": itemsPerRow === 4,
      })}
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.1 }}
    >
      {products.map((product) => (
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
  );

  const ViewAllButton = ({ href, text }: { href: string; text: string }) => (
    <div className="flex justify-center mt-10">
      <Link
        href={href}
        className="inline-flex items-center justify-center rounded-full bg-[#FFCE00] px-6 py-3 text-base font-semibold text-foreground shadow-lg transition-all hover:bg-[#E6B800] hover:shadow-xl transform hover:-translate-y-0.5"
      >
        {text} <ArrowRight className="ml-2 h-4 w-4" />
      </Link>
    </div>
  );

  return (
    <main className="flex flex-col bg-background">
      <Hero />

      <div className="max-w-7xl mx-auto px-6 py-20 w-full space-y-24">

        {/* --- 1. FEATURED PRODUCTS SECTION --- */}
        {featuredProducts.length > 0 && (
          <section>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h3 className="text-sm font-semibold uppercase tracking-widest text-[#FFCE00] mb-2">
                🔥 Don't Miss Out
              </h3>
              <h2 className="text-4xl font-extrabold flex items-center justify-center gap-3 text-foreground/90">
                <Zap className="w-8 h-8 text-[#FFCE00]" /> Featured Best Sellers
              </h2>
            </motion.div>

            {renderProductGrid(featuredProducts, 3)}

            <ViewAllButton href="/products" text="Explore All Products" />
          </section>
        )}

        {/* --- 2. CATEGORY SECTIONS (ALL ACTIVE PRODUCTS) --- */}
        {categorySections.map((section) => (
          <section key={section.id}>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              className="text-center md:text-left mb-12"
            >
              <h3 className="text-sm font-semibold uppercase tracking-widest text-foreground/70 mb-2">
                Curated Collection
              </h3>
              <h2 className="text-4xl font-extrabold flex items-center gap-3 text-foreground/90 justify-center md:justify-start">
                <Star className="w-8 h-8 text-[#FFCE00]" /> {section.name} Essentials
              </h2>
            </motion.div>

            {renderProductGrid(section.products, 4)}

            <ViewAllButton
              href={`/products?category=${section.slug}`}
              text={`View All ${section.name}`}
            />
          </section>
        ))}

        {/* --- EMPTY STATE --- */}
        {products.length === 0 && (
          <section className="text-center py-20 border-2 border-dashed border-[#FFCE00]/50 rounded-xl bg-yellow-50/50">
            <p className="text-2xl font-bold text-foreground">No Products Found!</p>
            <p className="text-base text-gray-600 mt-2">
              Go to the Support to check the reason about missing products.
            </p>
            <Link
              href="/contact"
              className="mt-4 inline-flex items-center text-[#FFCE00] font-medium hover:underline transition-colors"
            >
              Visit Support <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </section>
        )}
      </div>
    </main>
  );
}
