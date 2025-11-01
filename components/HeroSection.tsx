"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export default function SignatureCollectionHero() {
  return (
    <section className="w-full bg-white dark:bg-[#0a0a0a] text-[#181818] dark:text-white py-10 transition-colors duration-300">
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center px-6 lg:px-8">
        
        {/* ===== LEFT CONTENT ===== */}
        <motion.div
          initial={{ opacity: 0, x: -60 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          viewport={{ once: true }}
          className="space-y-8"
        >
          <motion.h1
            initial={{ y: 40, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight tracking-tight"
          >
            The Signature Collection:
            <br />
            <span className="text-[#FFCE00] drop-shadow-[0_2px_6px_rgba(255,206,0,0.4)]">
              Essentials for Modern Living
            </span>
          </motion.h1>

          <motion.p
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="text-base sm:text-lg text-gray-600 dark:text-gray-300 max-w-md"
          >
            From elegant cutlery to smart home comfort — find your signature
            style with products that blend quality and design seamlessly.
          </motion.p>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <Button
              className="bg-[#181818] dark:bg-white text-white dark:text-[#181818]
                px-8 py-4 rounded-full font-semibold text-lg
                hover:bg-[#FFCE00] hover:text-[#181818]
                transition-all duration-300 shadow-md hover:shadow-lg"
            >
              Shop Now
            </Button>
          </motion.div>
        </motion.div>

        {/* ===== RIGHT IMAGE ===== */}
        <motion.div
          initial={{ opacity: 0, x: 60 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          viewport={{ once: true }}
          className="relative w-full rounded-2xl overflow-hidden shadow-2xl"
        >
          <Image
            src="/Main-image.jpg"
            alt="Signature Collection Hero"
            width={800}
            height={1000}
            className="
              w-full 
              h-auto 
              object-cover 
              transition-all 
              duration-700 
              md:grayscale md:hover:grayscale-0 
              md:hover:scale-105
              rounded-2xl
            "
            priority
          />

          {/* Subtle gradient overlay for dark mode */}
          <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent dark:from-black/40 pointer-events-none" />
        </motion.div>
      </div>
    </section>
  );
}
