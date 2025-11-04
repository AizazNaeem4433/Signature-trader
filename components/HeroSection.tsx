"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

// Define a TypeScript interface for clarity and type safety
interface CollectionItem {
  id: number;
  bigImg: string;
  alt: string;
  tagline: string;
  description: string;
}

// --- 1. Define Changing Content Data ---
const collectionData: CollectionItem[] = [
  {
    id: 1,
    bigImg: "/home/Cutlery.jpg", 
    alt: "Luxurious Cutlery Set",
    tagline: "The Art of Dining: Premium Cutlery",
    description:
      "Craft every meal into a masterpiece. Discover our premium cutlery collection—the foundation of a refined dining experience.",
  },
  {
    id: 2,
    bigImg: "/home/fasion.jpg",
    alt: "Latest Fashion Footwear",
    tagline: "Walk the Trend: Shoes for Every Occasion",
    description:
      "Step into style and comfort with footwear designed to make a statement. Find the perfect pair to complete your fashion look.",
  },
  {
    id: 3,
    bigImg: "/home/decor.jpg",
    alt: "Contemporary Home Decor",
    tagline: "Design Your Haven: Exquisite Home Décor",
    description:
      "Elevate your living spaces with unique pieces. From timeless classics to modern accents, our décor transforms houses into signature homes.",
  },
];

// --- Static Images and Text ---
const staticMiniImage = {
  src: "/home/static-signature-item.png",
  alt: "Signature Traders Product",
};

// Static Main Heading
const staticHeading = "Signature Traders: Essential Style for Modern Living";


export default function SignatureTradersHero() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const totalSlides = collectionData.length;
  const activeData = collectionData[currentSlide];

  // Auto-rotate effect
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % totalSlides);
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(timer);
  }, [totalSlides]);

  // Framer Motion variants for fade transition (Text)
  const fadeVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
    transition: { duration: 0.8 },
  };

  // Framer Motion variants for the large image transition
  const imageFadeVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 1.2, ease: "easeInOut" },
  };

  return (
    <section className="w-full bg-white dark:bg-[#0a0a0a] text-[#181818] dark:text-white py-2 transition-colors duration-300">
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center px-6 lg:px-8">
        
        {/* ===== LEFT CONTENT (Static Heading, Static Mini Image, Changing Content) ===== */}
        <motion.div
          initial={{ opacity: 0, x: -60 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          viewport={{ once: true }}
          className="space-y-8"
        >
          {/* Static Main Heading */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight tracking-tight">
            {staticHeading}
          </h1>
          
          {/* Main Content Block Container: Separating Static and Dynamic Content */}
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            
            {/* 1. STATIC MINI IMAGE */}
            <div className="flex-shrink-0 w-40 h-56 overflow-hidden rounded-xl shadow-lg relative bg-gray-50 dark:bg-gray-900">
              <Image
                src={staticMiniImage.src}
                alt={staticMiniImage.alt}
                fill
                sizes="160px"
                className="object-cover"
                priority
              />
            </div>

            {/* Content Container (Tagline, Description, Button) */}
            <div className="space-y-6 max-w-sm">
                
                {/* 2. DYNAMIC CONTENT (Tagline and Description) - Wrapped in AnimatePresence */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeData.id} // Key ensures re-render and transition
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        variants={fadeVariants}
                        className="space-y-4"
                    >
                        {/* Changing Tagline/Sub-heading */}
                        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200">
                            {activeData.tagline}
                        </h2>

                        {/* Changing Description */}
                        <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300">
                            {activeData.description}
                        </p>
                    </motion.div>
                </AnimatePresence>

                {/* 3. STATIC BUTTON (FIXED: Uses motion.a with href, eliminating nested <a> error) */}
                <Button
                    asChild 
                    className="bg-black text-white 
                      px-8 py-3 rounded-md font-semibold text-base
                      hover:bg-[#FFCE00] hover:text-[#181818] transition-all duration-300"
                >
                    <motion.a
                      href="/products" // <-- The target path for the link
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      transition={{ duration: 0.5, delay: 0.8 }}
                    >
                      Shop Collection
                    </motion.a>
                </Button>
            </div>

          </div>
          
        </motion.div>

        {/* --- RIGHT IMAGE (The changing Big Image) --- */}
        <motion.div
          initial={{ opacity: 0, x: 60 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          viewport={{ once: true }}
          className="relative w-full rounded-2xl overflow-hidden shadow-2xl h-[400px] md:h-[550px] lg:h-[650px]"
        >
          {/* Image wrapped in AnimatePresence for transition */}
          <AnimatePresence>
            <motion.div
              key={activeData.id}
              initial="initial"
              animate="animate"
              exit="exit"
              variants={imageFadeVariants}
              className="absolute inset-0"
            >
              <Image
                src={activeData.bigImg}
                alt={activeData.alt}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="fill"
                priority={currentSlide === 0}
              />
              {/* Optional: Overlay for contrast */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}