"use client";

import { motion } from "framer-motion";
import {
  Mail,
  Phone,
  MapPin,
  Instagram,
  Facebook,
  Twitter,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-white dark:bg-[#0A0A0A] text-[#181818] dark:text-gray-300 py-12 relative overflow-hidden transition-colors duration-500">
      {/* Grid: 4 columns */}
      <motion.div
        className="max-w-7xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true, amount: 0.2 }}
      >
        {/* CONTACTS (delay 0) */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0 }}
          viewport={{ once: true }}
        >
          <h3 className="text-lg font-semibold text-[#FFCE00] mb-4">Contacts</h3>
          <ul className="space-y-3 text-sm">
            <li>
              <a
                href="tel:+923075221171" // Updated phone number
                className="flex items-center gap-2 hover:text-[#FFCE00] transition-colors"
                aria-label="Call us"
              >
                <Phone size={16} /> <span>+92 3075221171</span>
              </a>
            </li>
            <li>
              <a
                href="mailto:signaturetrader6@gmail.com"
                className="flex items-center gap-2 hover:text-[#FFCE00] transition-colors"
                aria-label="Email us"
              >
                <Mail size={16} /> <span>info@signaturetrader.com</span>
              </a>
            </li>
            <li>
              <a
                href="https://www.google.com/maps/search/?api=1&query=Lahore+Pakistan"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 hover:text-[#FFCE00] transition-colors"
                aria-label="Open address in maps"
              >
                <MapPin size={16} /> <span>Lahore, Pakistan</span>
              </a>
            </li>
          </ul>
        </motion.div>

        {/* SHOP (Updated Category Routes) */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.15 }}
          viewport={{ once: true }}
        >
          <h3 className="text-lg font-semibold text-[#FFCE00] mb-4">Shop</h3>
          <ul className="space-y-3 text-sm">
            <li>
              <Link href="/products" className="hover:text-[#FFCE00] transition-colors">
                All Products
              </Link>
            </li>
            <li>
              <Link href="/products/category/home-decor" className="hover:text-[#FFCE00] transition-colors">
                Home Décor
              </Link>
            </li>
            <li>
              <Link href="/products/category/shoes" className="hover:text-[#FFCE00] transition-colors">
                Shoes
              </Link>
            </li>
            <li>
              <Link href="/products/category/cutlery" className="hover:text-[#FFCE00] transition-colors">
                Cutlery
              </Link>
            </li>
          </ul>
        </motion.div>

        {/* COMPANY (delay 0.3) */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.3 }}
          viewport={{ once: true }}
        >
          <h3 className="text-lg font-semibold text-[#FFCE00] mb-4">Company</h3>
          <ul className="space-y-3 text-sm">
            <li>
              <Link href="/about" className="hover:text-[#FFCE00] transition-colors">
                About Us
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-[#FFCE00] transition-colors">
                Contact
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="hover:text-[#FFCE00] transition-colors">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link href="/terms" className="hover:text-[#FFCE00] transition-colors">
                Terms & Conditions
              </Link>
            </li>
          </ul>
        </motion.div>

        {/* FOLLOW US (Updated Social Links) */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.45 }}
          viewport={{ once: true }}
        >
          <h3 className="text-lg font-semibold text-[#FFCE00] mb-4">Follow Us</h3>
          <div className="flex gap-5 text-gray-500 dark:text-gray-400">
            {[
              { 
                Icon: Instagram, 
                // Link from contact-client.tsx
                href: "https://www.instagram.com/signatu_cutlery_crockery_store/?utm_source=qr&igsh=MTljYXZ3aGh2Mm05cQ%3D%3D#",
                label: "Instagram"
              },
              { 
                Icon: Facebook, 
                // Link from contact-client.tsx
                href: "https://www.facebook.com/Signature.Traders.2026?rdid=iqqnhUyFt42wPuhZ&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F16XR4UjW4C%2F#",
                label: "Facebook"
              },
              { Icon: Twitter, href: "https://twitter.com", label: "Twitter (Placeholder)" },
            ].map(({ Icon, href, label }, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -4, scale: 1.06 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <a
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[#FFCE00] transition-colors"
                  aria-label={`Open ${label}`}
                >
                  <Icon />
                </a>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>

      {/* Divider */}
      <motion.div
        className="border-t border-gray-300 dark:border-gray-700 mt-10 pt-6 text-center text-sm"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        © {new Date().getFullYear()} Signature Trader. All rights reserved.
      </motion.div>

      {/* WhatsApp Floating Button (fade in + subtle float) */}
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.35, ease: "easeOut" }}
        className="fixed bottom-6 right-6 z-50"
      >
        <a
          href="https://wa.me/923075221171 "
          target="_blank"
          rel="noreferrer"
          className="block bg-[#25D366] rounded-full p-3 shadow-lg hover:scale-105 transform-gpu transition-transform"
          aria-label="Chat on WhatsApp"
        >
          <Image
            src="/whatsapp.png"
            alt="Chat on WhatsApp"
            width={48}
            height={48}
            className="w-10 h-10 object-contain"
            priority
          />
        </a>
      </motion.div>
    </footer>
  );
}