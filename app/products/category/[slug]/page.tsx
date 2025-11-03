// signature-trader/app/products/category/[slug]/page.tsx
"use client";

import { useParams } from 'next/navigation';
import ProductIndex from '../../index'; // Path adjusted to assume index.tsx is in the parent directory

// Yeh file category-specific route handle karti hai: /products/category/cutlery-sets
export default function CategoryPage() {
    const params = useParams();
    const categorySlug = params.slug as string;

    // Slug ko reusable component mein pass karein
    return <ProductIndex initialCategorySlug={categorySlug} />;
}