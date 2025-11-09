/* eslint-disable no-alert, quotes */
"use client";

import { useEffect, useState, useMemo } from 'react';
import { Loader2, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ProductCard from '@/components/storefront/ProductCard';
import { useCartStore } from '@/lib/store/useCartStore';
import { useNotificationStore } from '@/lib/store/useNotificationStore';

// --- INTERFACES ---
interface ProductMedia {
  id: number;
  url: string;
  alt: string;
  type: 'image' | 'video';
}
interface VariantOption {
  id: number;
  value: string;
  priceAdjustment: number;
  linkedMediaId: number | null;
}
interface VariantType {
  id: number;
  name: string;
  options: VariantOption[];
}
export interface ProductData {
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

interface ProductDetailClientProps {
  product: ProductData;
  relatedProducts: ProductData[];
}

export default function ProductDetailClient({ product, relatedProducts }: ProductDetailClientProps) {
  const [mainMedia, setMainMedia] = useState<ProductMedia | null>(product.media[0] || null);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>(() => {
    const initialSelections: Record<string, string> = {};
    product.variantTypes.forEach((vt: VariantType) => {
      if (vt.options.length > 0) {
        initialSelections[vt.name] = vt.options[0].value;
      }
    });
    return initialSelections;
  });
  const [quantity, setQuantity] = useState(1);
  const [userSelectedImage, setUserSelectedImage] = useState<boolean>(false);

  const { addItem: addToCart } = useCartStore();
  const { addNotification } = useNotificationStore();

  // --- Color Swatch Helper ---
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

  // --- Price & Linked Media Calculation ---
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
        if (selectedOption.linkedMediaId !== null) linkedMediaId = selectedOption.linkedMediaId;
      }
    });

    const currentLinkedMedia =
      linkedMediaId !== null ? product.media.find((m) => m.id === linkedMediaId) : undefined;

    return {
      finalPrice: product.basePrice + adjustment,
      totalAdjustment: adjustment,
      currentStock: stock,
      linkedMedia: currentLinkedMedia,
    };
  }, [product, selectedVariants]);

  // --- Auto-switch linked image unless user manually chose ---
  useEffect(() => {
    if (userSelectedImage) return;

    if (priceData.linkedMedia && mainMedia?.id !== priceData.linkedMedia.id) {
      setMainMedia(priceData.linkedMedia);
    } else if (
      !priceData.linkedMedia &&
      product &&
      product.media.length > 0 &&
      mainMedia?.id !== product.media[0].id
    ) {
      setMainMedia(product.media[0]);
    }
  }, [product, priceData.linkedMedia, mainMedia, userSelectedImage]);

  const handleAddToCart = () => {
    if (!product || quantity <= 0 || quantity > priceData.currentStock) {
      addNotification('Please select a valid quantity and ensure the item is in stock.', 'error');
      return;
    }

    const cartItem = {
      productId: product.id,
      name: product.name,
      slug: product.slug,
      basePrice: priceData.finalPrice,
      quantity: quantity,
      selectedVariants: selectedVariants,
      mediaUrl: product.media[0]?.url || '/placeholder.png',
    };

    addToCart(cartItem);
  };

  const handleVariantClick = (vtName: string, optValue: string) => {
    setUserSelectedImage(false);
    setSelectedVariants((prev) => ({ ...prev, [vtName]: optValue }));
  };

  const renderVariantSelector = (vt: VariantType) => {
    const isColorSwatch = vt.name.toLowerCase().includes('color') || vt.name.toLowerCase().includes('colour');

    return (
      <div key={vt.name} className="space-y-2">
        <Label className="text-sm font-medium block">
          {vt.name}:{' '}
          <span className="font-semibold text-foreground">{selectedVariants[vt.name]}</span>
        </Label>

        <div className="flex flex-wrap gap-2">
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
                  style={{ cursor: 'pointer' }}
                  className={cn(
                    'w-8 h-8 rounded-full border-2 transition-all shadow-md',
                    colorClass,
                    {
                      'ring-4 ring-offset-2 ring-[#FFCE00]': isSelected,
                      'hover:ring-2 hover:ring-gray-400': !isSelected,
                      'bg-gray-200 border-gray-400': colorClass.includes('bg-white'),
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
                  style={{ cursor: 'pointer' }}
                  className={cn(
                    'px-4 py-1.5 rounded-md text-sm font-medium border transition-all',
                    {
                      'bg-red-600 text-white border-red-600 shadow-sm': isSelected,
                      'bg-background text-foreground hover:bg-muted/50 dark:border-gray-700':
                        !isSelected,
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

  const displayCutPrice =
    product.cutPrice && product.cutPrice > product.basePrice
      ? product.cutPrice.toLocaleString('en-PK', {
          style: 'currency',
          currency: 'PKR',
          minimumFractionDigits: 0,
        })
      : null;

  const displayFinalPrice = priceData.finalPrice.toLocaleString('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="max-w-7xl mx-auto px-6 py-12 min-h-screen"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* LEFT: Media Gallery */}
        <div className="space-y-6">
          <div className="aspect-square rounded-xl overflow-hidden bg-muted/50 shadow-xl">
            {mainMedia && mainMedia.type === 'video' ? (
              <video
                controls
                autoPlay
                muted
                loop
                className="w-full h-full object-cover cursor-pointer"
              >
                <source src={mainMedia.url} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            ) : (
              <img
                src={mainMedia?.url || '/placeholder.png'}
                alt={mainMedia?.alt || product.name}
                className="w-full h-full object-cover cursor-pointer"
              />
            )}
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2">
            {product.media.map((mediaItem) => (
              <motion.div
                key={mediaItem.id}
                whileHover={{ scale: 1.05 }}
                style={{ cursor: 'pointer' }}
                className={cn(
                  'w-20 h-20 shrink-0 rounded-lg overflow-hidden border-2 transition-colors',
                  mainMedia?.id === mediaItem.id
                    ? 'border-[#FFCE00]'
                    : 'border-transparent hover:border-gray-300'
                )}
                onClick={() => {
                  setMainMedia(mediaItem);
                  setUserSelectedImage(true);
                }}
              >
                {mediaItem.type === 'video' ? (
                  <video muted className="w-full h-full object-cover" src={mediaItem.url} />
                ) : (
                  <img
                    src={mediaItem.url}
                    alt={mediaItem.alt}
                    className="w-full h-full object-cover"
                  />
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* RIGHT: Details and Purchase */}
        <div className="space-y-8">
          <div className="border-b border-border pb-4">
            <h1 className="text-3xl font-extrabold text-foreground mb-2">{product.name}</h1>
            <p className="text-lg text-muted-foreground">{product.shortDescription}</p>
          </div>

          <div className="space-y-1">
            {displayCutPrice && (
              <p className="text-xl text-gray-500 line-through">{displayCutPrice}</p>
            )}
            <p className="text-4xl font-extrabold text-red-600 flex items-baseline gap-2">
              {displayFinalPrice}
              {priceData.totalAdjustment !== 0 && (
                <span className="text-base font-semibold text-gray-500">
                  ({priceData.totalAdjustment > 0 ? '+' : ''}
                  {priceData.totalAdjustment.toLocaleString()} Adj)
                </span>
              )}
            </p>
          </div>

          <div className="space-y-4 pt-4">
            {product.variantTypes.map((vt) => renderVariantSelector(vt))}
          </div>

          <div className="flex items-center gap-6 pt-4">
            <Label>Quantity:</Label>
            <Input
              type="number"
              min="1"
              max={priceData.currentStock}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-20 text-center"
              style={{ cursor: 'pointer' }}
            />
            <span
              className={cn(
                'text-sm font-medium',
                priceData.currentStock > 0 ? 'text-green-600' : 'text-red-600'
              )}
            >
              {priceData.currentStock > 0
                ? `${priceData.currentStock} in stock`
                : 'Out of Stock'}
            </span>
          </div>

          <Button
            onClick={handleAddToCart}
            disabled={priceData.currentStock <= 0 || quantity > priceData.currentStock}
            className="w-full md:w-96 mt-6 bg-[#FFCE00] hover:bg-[#e6b800] text-black text-lg font-bold shadow-md"
            style={{ cursor: 'pointer' }}
          >
            <ShoppingCart className="w-5 h-5 mr-3" /> Add to Cart
          </Button>

          {/* Rich Product Description */}
          <div className="pt-6 border-t border-border mt-8">
            <h3 className="text-xl font-semibold mb-3">Product Details</h3>
            <div
              className="prose prose-gray dark:prose-invert max-w-none leading-relaxed"
              dangerouslySetInnerHTML={{ __html: product.detailedDescription }}
            />
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="mt-20">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-3xl font-bold mb-8 text-foreground text-center"
          >
            You May Also Like
          </motion.h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
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
