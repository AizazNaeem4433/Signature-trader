// signature-trader/app/sitemap.ts
import { MetadataRoute } from 'next'
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

// Product aur Category data types (interfaces)
interface Product {
  slug: string;
  isActive: boolean;
  // Agar 'updatedAt' field hai toh behtar hai, warna hum current date istemal karein gay
  // createdAt?: { seconds: number }; 
}

interface Category {
  slug: string;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  
  // Aap ki confirmed domain
  const siteUrl = 'https://signature-trader.com';

  // --- 1. Static Pages ---
  // Yeh aap ke main pages hain
  const staticPages = [
    '/',
    '/about',
    '/contact',
    '/products',
    '/bulk',
    '/privacy',
    '/terms',
  ];

  const staticUrls = staticPages.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'monthly' as 'monthly',
    priority: route === '/' ? 1.0 : 0.8,
  }));


  // --- 2. Dynamic Product Pages ---
  // Firestore se saare active products fetch karein
  const productsQuery = query(
    collection(db, 'products'),
    where('isActive', '==', true)
  );
  const productsSnapshot = await getDocs(productsQuery);
  
  const productUrls = productsSnapshot.docs.map(doc => {
    const product = doc.data() as Product;
    return {
      url: `${siteUrl}/products/${product.slug}`,
      lastModified: new Date().toISOString(),
            changeFrequency: 'weekly' as 'weekly',
      priority: 0.7,
    };
  });


  // --- 3. Dynamic Category Pages ---
  // Firestore se saari categories fetch karein
  const categoriesQuery = query(collection(db, 'categories'));
  const categoriesSnapshot = await getDocs(categoriesQuery);
  
  const categoryUrls = categoriesSnapshot.docs.map(doc => {
    const category = doc.data() as Category;
    return {
      url: `${siteUrl}/products/category/${category.slug}`,
      lastModified: new Date().toISOString(),
      changeFrequency: 'weekly' as 'weekly',
      priority: 0.6,
    };
  });

  // --- 4. Sab ko merge kar dein ---
  return [
    ...staticUrls,
    ...productUrls,
    ...categoryUrls,
  ];
}