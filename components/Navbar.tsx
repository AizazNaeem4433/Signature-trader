// signature-trader/components/Navbar.tsx (Complete Code with Notification Setup)
"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { ShoppingCart, User, Menu, X, Moon, Sun, LogOut, Loader2 } from "lucide-react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useNotificationStore } from "@/lib/store/useNotificationStore";
interface NavLink {
  href: string;
  label: string;
}

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  const pathname = usePathname();
  const { user, role, setAuthUser, isInitialized } = useAuthStore(); 
  const { addNotification } = useNotificationStore(); // <-- Get notification action

  useEffect(() => {
    setMounted(true);
    const unsubscribe = onAuthStateChanged(auth, (u) => setAuthUser(u)); 
    return () => unsubscribe();
  }, [setAuthUser]);

  const baseNavLinks: NavLink[] = [
    { href: "/", label: "Home" },
    { href: "/products", label: "All Products" },
    { href: "/category", label: "Category" },
    { href: "/about", label: "About Us" },
    { href: "/bulk", label: "Bulk Order" },
  ];

  const navLinks: NavLink[] = [
    ...baseNavLinks,
    ...(role === 'admin' ? [{ href: "/admin", label: "Admin Panel" }] : []), 
  ];

  const logoSrc = mounted && theme === "dark" ? "/signature-logo-white.png" : "/signature-logo.png";

  const handleLogout = async () => {
    await signOut(auth);
    addNotification("You have been successfully logged out.", "info"); // <-- LOGOUT NOTIFICATION
  };

  return (
    <motion.nav
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 80, damping: 14 }}
      className="bg-white dark:bg-[#0a0a0a] border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50 shadow-md transition-colors duration-300"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 py-3">
        {/* Logo */}
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
          <Link href="/" className="flex items-center">
            {/* Only render logo after mount to avoid hydration mismatch */}
            {mounted ? (
              <img src={logoSrc} alt="Logo" className="h-10 sm:h-12 w-auto object-contain" />
            ) : (
              <div className="h-10 sm:h-12 w-auto" />
            )}
          </Link>
        </motion.div>

        {/* Desktop nav links */}
        <div className="hidden md:flex gap-6">
          {navLinks.map((link, i) => (
            <Link
              key={link.href}
              href={link.href}
              className="relative group font-medium text-[#181818] dark:text-gray-300 transition-all duration-300"
            >
              {link.label}
              <span className="absolute left-0 -bottom-1 w-0 h-0.5 bg-[#FFCE00] transition-all duration-300 group-hover:w-full"></span>
            </Link>
          ))}
        </div>

        {/* Right icons */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Theme toggle */}
          {mounted && (
            <motion.button
              whileTap={{ rotate: 180, scale: 0.9 }}
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Toggle Theme"
            >
              {theme === "dark" ? <Sun className="w-5 h-5 text-[#FFCE00]" /> : <Moon className="w-5 h-5 text-[#181818]" />}
            </motion.button>
          )}

          {/* Cart */}
          <motion.div whileHover={{ rotate: -10, scale: 1.1 }}>
            <Link
              href="/cart"
              className="relative text-[#181818] dark:text-gray-300 hover:text-[#FFCE00] transition-colors"
            >
              <ShoppingCart className="w-5 h-5" />
              <span className="absolute -top-2 -right-2 bg-[#FFCE00] text-[#181818] text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                0
              </span>
            </Link>
          </motion.div>

          {/* Profile / Login Icon - FIX: Show loader while initializing */}
          <div className="relative">
            {!isInitialized ? (
              <Loader2 className="w-5 h-5 animate-spin text-[#FFCE00]" />
            ) : user ? (
              <div className="flex items-center gap-2">
                <Link href="/account/profile" className="flex items-center">
                  <img
                    src={user.photoURL || "/image.png"}
                    alt={user.displayName || "User"}
                    className="w-8 h-8 rounded-full object-cover border-2 border-[#FFCE00]"
                  />
                </Link>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={handleLogout}
                  className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  aria-label="Logout"
                >
                  <LogOut className="w-4 h-4 text-red-500" />
                </motion.button>
              </div>
            ) : (
              <Link
                href={`/auth/login?redirect=${pathname}`}
                className="text-[#181818] dark:text-gray-300 hover:text-[#FFCE00] transition-colors"
              >
                <User className="w-5 h-5" />
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            className="md:hidden text-[#181818] dark:text-gray-300 hover:text-[#FFCE00] transition-colors"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </motion.button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="md:hidden overflow-hidden"
          >
            <div className="bg-white dark:bg-[#0a0a0a] border-t border-gray-100 dark:border-gray-800 px-4 py-2 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="block px-4 py-2 rounded-md text-[#181818] dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-[#FFCE00] transition-all duration-200"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}