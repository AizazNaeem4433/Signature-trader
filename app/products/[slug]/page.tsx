// signature-trader/app/products/[slug]/page.tsx

import { type Metadata, type ResolvingMetadata } from 'next';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import ProductDetailClient from './product-details';
import { ProductData } from './product-details'; 
import { XCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { notFound } from 'next/navigation';
import { WithContext, Product } from 'schema-dts'; 



type Props = {
  params: { slug: string }
}

export async function generateMetadata(
  { params }: Props,
  _parent: ResolvingMetadata
): Promise<Metadata> {
  
  const awaitedParams = await params;
  const slug = awaitedParams.slug;
  
  if (!slug || slug === 'favicon.ico') { 
    return { title: "Not Found" }; 
  }

  try {
    const q = query(
        collection(db, 'products'), 
        where('slug', '==', slug), 
        where('isActive', '==', true), 
        limit(1)
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return { title: 'Product Not Found' }
    }

    const product = snapshot.docs[0].data() as ProductData;

    const title = `${product.name} | Signature Trader`;
    const description = product.shortDescription;
    const imageUrl = product.media[0]?.url || '/signature-logo.png'; 

    return {
      title: title,
      description: description,
      openGraph: { 
        title: title,
        description: description,
        images: [{ url: imageUrl, width: 1200, height: 630, alt: product.name }], // 1200x630 ratio
        siteName: 'Signature Trader',
      },
      twitter: { 
        card: 'summary_large_image',
        title: title,
        description: description,
        images: [imageUrl],
      },
    }
  } catch (error) {
    console.error(`Error fetching metadata for slug: ${slug}`, error);
    return {
      title: 'Error | Signature Trader',
      description: 'Could not load product details.',
    }
  }
}


async function getProductBySlug(slug: string): Promise<ProductData | null> {
  if (!slug || slug === 'favicon.ico') {
    return null; 
  }
  
  try {
    const q = query(
        collection(db, 'products'), 
        where('slug', '==', slug),
        where('isActive', '==', true), 
        limit(1)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    
    const doc = snapshot.docs[0];
    const data = doc.data();

    const plainProduct: ProductData = {
      id: doc.id,
      name: data.name,
      slug: data.slug,
      basePrice: data.basePrice,
      cutPrice: data.cutPrice || 0,
      shortDescription: data.shortDescription,
      detailedDescription: data.detailedDescription,
      stock: data.stock,
      media: data.media || [],
      variantTypes: data.variantTypes || [],
      category_id: data.category_id,
      isActive: data.isActive
    };

    return plainProduct;

  } catch (error) {
    console.error(`getProductBySlug Error (slug: ${slug}):`, error);
    return null; 
  }
}

async function getRelatedProducts(categoryId: string, currentSlug: string): Promise<ProductData[]> {
  if (!categoryId) return [];
  try {
    const relatedQuery = query(
        collection(db, 'products'),
        where('category_id', '==', categoryId),
        where('slug', '!=', currentSlug), 
        where('isActive', '==', true),
        limit(4) 
    );
    const relatedSnapshot = await getDocs(relatedQuery);

    return relatedSnapshot.docs.map(doc => {
        const data = doc.data();
        const plainProduct: ProductData = {
          id: doc.id,
          name: data.name,
          slug: data.slug,
          basePrice: data.basePrice,
          cutPrice: data.cutPrice || 0,
          shortDescription: data.shortDescription,
          detailedDescription: data.detailedDescription,
          stock: data.stock,
          media: data.media || [],
          variantTypes: data.variantTypes || [],
          category_id: data.category_id,
          isActive: data.isActive
        };
        return plainProduct;
    });

  } catch (error) {
      console.error("Failed to fetch related products:", error);
      return [];
  }
}

export default async function ProductPage({ params }: Props) {
  
  const awaitedParams = await params; 
  const slug = awaitedParams.slug;

  const product = await getProductBySlug(slug);

  if (!product) {
    notFound(); 
  }

  const relatedProducts = await getRelatedProducts(product.category_id, product.slug);

  // JSON-LD Structured Data
  const productJsonLd: WithContext<Product> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.shortDescription,
    image: product.media[0]?.url || '/signature-logo.png',
    sku: product.id,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'PKR',
      price: product.basePrice.toString(),
      url: `https://signature-trader.com/products/${product.slug}`,
      availability: product.stock > 0 
          ? 'https://schema.org/InStock' 
          : 'https://schema.org/OutOfStock',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <ProductDetailClient product={product} relatedProducts={relatedProducts} />
    </>
  );
}