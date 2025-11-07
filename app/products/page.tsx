// signature-trader/app/products/page.tsx
"use client";

import ProductIndex from './index'; // Import karein reusable component

// Yeh file ab /products route handle karti hai
export default function ProductsPage() {
    
    // Hum yahan 'initialCategorySlug' ko 'null' bhej rahay hain
    // taake 'ProductIndex' component saaray products load karay,
    // aur search query ko bhi handle karay.
    return <ProductIndex initialCategorySlug={null} />;
}

