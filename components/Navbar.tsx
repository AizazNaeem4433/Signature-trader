"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
// Import Lucide icons
import { ShoppingCart, User, Menu, X, Moon, Sun, LogOut, Loader2, ChevronDown, Search } from "lucide-react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useNotificationStore } from "@/lib/store/useNotificationStore";
import { useCartStore } from "@/lib/store/useCartStore";
import CartSidebar from "./CartSidebar";
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
// We must import Fragment explicitly if we use the named version, or use <> shorthand.
import React, { Fragment } from "react"; // Kept React and Fragment import for compatibility

interface NavLink {
  href: string;
  label: string;
  isCategory?: boolean;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const pathname = usePathname();
  const router = useRouter();
  const { user, role, setAuthUser, isInitialized } = useAuthStore();
  const { addNotification } = useNotificationStore();

  const { items, openCart } = useCartStore();
  const cartItemsCount = items.length;

  // --- 1. Mounting State & Auth Listener ---
  useEffect(() => {
    setMounted(true);
    const unsubscribeAuth = onAuthStateChanged(auth, (u) => setAuthUser(u));
    return () => unsubscribeAuth();
  }, [setAuthUser]);

  // --- 2. Category Fetch Listener ---
  useEffect(() => {
    const categoriesQuery = query(collection(db, 'categories'), orderBy('name', 'asc'));
    const unsubscribeCategories = onSnapshot(categoriesQuery, (snapshot) => {
      setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category)));
    });

    return () => unsubscribeCategories();
  }, []);

  // --- 3. Search Handler ---
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsOpen(false);
    } else if (pathname.includes('/products')) {
      router.push('/products');
    }
  };

  // --- Navigation Links ---
  const baseNavLinks: NavLink[] = [
    { href: "/", label: "HOME" },
    { href: "/products", label: "PRODUCTS" },
    { href: "/about", label: "ABOUT" },
    { href: "/bulk", label: "BULK" },
    { href: "/products", label: "CATEGORIES", isCategory: true },
  ];

  const navLinks: NavLink[] = [
    ...baseNavLinks,
    ...(role === 'admin' ? [{ href: "/admin", label: "ADMIN PANEL" }] : []),
  ];

  const logoSrc = mounted && theme === "dark" ? "/signature-logo-white.png" : "/signature-logo.png";

  const handleLogout = async () => {
    await signOut(auth);
    addNotification("You have been successfully logged out.", "info");
  };

  const isLinkActive = (href: string) => {
    return pathname === href || (pathname.startsWith(href) && href !== '/');
  };


  return (
    <motion.nav
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 80, damping: 14 }}
      className={cn("bg-white dark:bg-[#0a0a0a] border-b border-gray-300 dark:border-gray-800 sticky top-0 z-50 transition-colors duration-300")}
    >
      <div className={cn("max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 py-4")}>

        {/* ===== LEFT: Logo ===== */}
        <div className="flex-1 max-w-[200px] cursor-pointer">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
            <Link href="/" className="flex items-center relative">
              {/* Pre-render both logos and toggle visibility via CSS */}
              <img
                src="/signature-logo.png"
                alt="Signature Traders Logo Light"
                className={cn(
                  "h-10 sm:h-12 w-auto object-contain transition-opacity duration-300",
                  "dark:opacity-0 opacity-100"
                )}
              />
              <img
                src="/signature-logo-white.png"
                alt="Signature Traders Logo Dark"
                className={cn(
                  "h-10 sm:h-12 w-auto object-contain absolute left-0 top-0 transition-opacity duration-300",
                  "dark:opacity-100 opacity-0"
                )}
              />
            </Link>
          </motion.div>
        </div>



        {/* ===== CENTER: Desktop nav links and Categories (Fixed centering and reduced gap) ===== */}
        <div className={cn("hidden md:flex flex-none mx-auto items-center")}>
          <div className="flex items-center space-x-2">
            {navLinks.filter(link => !link.isCategory).map((link, i) => (
              // FIX 2: Applied key to the Fragment wrapper and using shorthand <>
              <Fragment key={link.href}>
                <Link
                  href={link.href}
                  className={cn("relative group font-medium text-[#181818] dark:text-gray-300 transition-all duration-300 text-sm uppercase tracking-wider px-2 cursor-pointer",
                    isLinkActive(link.href) ? "text-black dark:text-white" : "hover:text-black dark:hover:text-white"
                  )}
                >
                  {link.label}
                  {/* Hover Underline with Yellow Accent */}
                  <span className={cn("absolute left-0 -bottom-1 w-0 h-0.5 bg-[#FFCE00] transition-all duration-300 group-hover:w-full")}></span>
                </Link>
                {/* Separator Logic */}
                {i < navLinks.filter(l => !l.isCategory).length - 1 && (
                  <span className="text-gray-400 dark:text-gray-600 text-sm">/</span>
                )}
              </Fragment>
            ))}

            {/* CATEGORIES DROPDOWN */}
            {navLinks.find(link => link.isCategory) && (
              <div className={cn("relative group h-full flex items-center")}>
                <button
                  className={cn(
                    "flex items-center gap-1 font-medium text-[#181818] dark:text-gray-300 transition-all duration-300 text-sm uppercase tracking-wider px-2 cursor-pointer",
                    pathname.includes("/products/category") ? "text-black dark:text-white" : "hover:text-black dark:hover:text-white"
                  )}
                >
                  CATEGORIES
                  <ChevronDown className={cn("w-4 h-4 transition-transform duration-200 group-hover:rotate-180")} />
                </button>

                <div className={cn("absolute left-1/2 -translate-x-1/2 top-full mt-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform scale-95 group-hover:scale-100 min-w-[180px] origin-top")}>
                  <div className={cn("bg-white dark:bg-[#181818] border border-gray-200 dark:border-gray-800 rounded-lg shadow-xl p-1 space-y-1")}>
                    {categories.length > 0 ? (
                      categories.map((cat) => (
                        <Link
                          key={cat.id}
                          href={`/products/category/${cat.slug}`}
                          className={cn("block px-3 py-2 text-sm font-medium text-foreground hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors cursor-pointer")}
                          onClick={() => setIsOpen(false)}
                        >
                          {cat.name}
                        </Link>
                      ))
                    ) : (
                      <div className={cn("px-3 py-2 text-sm text-muted-foreground italic")}>No Categories</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ===== RIGHT: Icons (Search, Theme, User, Cart, Mobile Menu) ===== */}
        {/* FIX 1: Merged multiple className props into a single cn() call */}
        <div className={cn("flex items-center gap-3 sm:gap-4 flex-1 justify-end")}>

          {/* Search Icon (Toggle Logic maintained) */}
          <div className={cn("hidden md:flex relative items-center")}>
            <AnimatePresence mode="wait">
              {showSearchInput ? (
                // Desktop Search Input
                <motion.form
                  key="search-input"
                  onSubmit={handleSearch}
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 250, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className={cn("relative flex items-center")}
                >
                  <Input
                    type="search"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={cn("h-9 w-[250px] pr-10 border-gray-400 focus-visible:ring-0")}
                  />
                  {/* Search icon placement inside the input field */}
                  <button type="submit" className={cn("absolute right-10 p-1 text-gray-500 hover:text-black transition-colors")} aria-label="Search">
                    <Search className={cn("w-4 h-4")} />
                  </button>
                  {/* X button placed correctly at the far right of the input group */}
                  <Button type="button" variant="ghost" size="icon" onClick={() => setShowSearchInput(false)} className="absolute right-0 cursor-pointer">
                    <X className={cn("w-4 h-4 text-gray-500")} />
                  </Button>
                </motion.form>
              ) : (
                // Desktop Search Icon (Clickable)
                <motion.button
                  key="search-icon"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  onClick={() => setShowSearchInput(true)}
                  className={cn("p-1 text-[#181818] dark:text-gray-300 hover:text-gray-700 transition-colors cursor-pointer")}
                  aria-label="Open Search"
                >
                  <Search className={cn("w-5 h-5")} />
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {/* Theme toggle */}
          {mounted && (
            <motion.button
              whileTap={{ rotate: 180, scale: 0.9 }}
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className={cn("p-1 rounded-full text-[#181818] dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors hidden md:block cursor-pointer")}
              aria-label="Toggle Theme"
            >
              {theme === "dark" ? <Sun className={cn("w-5 h-5 text-[#FFCE00]")} /> : <Moon className={cn("w-5 h-5")} />}
            </motion.button>
          )}

          {/* Profile / Login Icon */}
          <div className={cn("relative group")}>
            {!isInitialized ? (
              <Loader2 className={cn("w-5 h-5 animate-spin text-gray-700")} />
            ) : user ? (
              <div className={cn("flex items-center")}>
                <Link href="/account" className={cn("text-[#181818] dark:text-gray-300 hover:text-gray-700 transition-colors mr-2 cursor-pointer")} aria-label="My Account">
                  <User className={cn("w-5 h-5")} />
                </Link>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={handleLogout}
                  className={cn("p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors cursor-pointer")}
                  aria-label="Logout"
                >
                  <LogOut className={cn("w-4 h-4 text-red-500")} />
                </motion.button>
              </div>
            ) : (
              <Link
                href={`/auth/login?redirect=${pathname}`}
                className={cn("text-[#181818] dark:text-gray-300 hover:text-gray-700 transition-colors cursor-pointer")}
                aria-label="Login / Sign Up"
              >
                <User className={cn("w-5 h-5")} />
              </Link>
            )}
          </div>

          {/* Cart Icon and Count */}
          <motion.div whileHover={{ scale: 1.05 }} className={cn("relative")}>
            <button
              onClick={openCart}
              className={cn("relative flex items-center justify-center bg-[#eaece0] dark:bg-gray-700 text-[#181818] dark:text-white rounded-full px-3 py-2 transition-colors hover:bg-[#dcdcce] cursor-pointer")}
              aria-label="Open Cart"
            >
              <ShoppingCart className={cn("w-4 h-4 mr-1")} />
              {cartItemsCount > 0 && (
                <span className={cn("absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold")}>
                  {cartItemsCount}
                </span>
              )}
            </button>
          </motion.div>

          {/* Mobile menu button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            className={cn("md:hidden text-[#181818] dark:text-gray-300 hover:text-gray-700 transition-colors cursor-pointer")}
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle Mobile Menu"
          >
            {isOpen ? <X className={cn("w-6 h-6")} /> : <Menu className={cn("w-6 h-6")} />}
          </motion.button>
        </div>
      </div>

      {/* Mobile menu (Logic maintained) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className={cn("md:hidden overflow-hidden")}
          >
            <div className={cn("bg-white dark:bg-[#0a0a0a] border-t border-gray-100 dark:border-gray-800 px-4 py-2 space-y-1")}>

              {/* Mobile Search */}
              <form onSubmit={handleSearch} className={cn("relative flex items-center p-2")}>
                <Input
                  type="search"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={cn("h-9 w-full pr-10 bg-muted/30 dark:bg-input/20 border-border")}
                />
                <button type="submit" className={cn("absolute right-4 p-1 text-muted-foreground hover:text-foreground transition-colors")} aria-label="Search">
                  <Search className={cn("w-4 h-4")} />
                </button>
              </form>

              {/* Mobile Links */}
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={cn("block px-4 py-2 rounded-md text-[#181818] dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-700 transition-all duration-200")}
                >
                  {link.label}
                </Link>
              ))}

              {/* Mobile Category List */}
              <div className={cn("border-t border-border mt-2 pt-2")}>
                <p className={cn("px-4 py-2 text-sm font-semibold text-muted-foreground")}>Categories</p>
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/products/category/${cat.slug}`}
                    onClick={() => setIsOpen(false)}
                    className={cn("block px-6 py-2 rounded-md text-sm text-[#181818] dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200")}
                  >
                    → {cat.name}
                  </Link>
                ))}
              </div>

              {/* Mobile Theme Toggle */}
              <div className={cn("flex justify-between items-center px-4 py-2 border-t border-border")}>
                <span className="text-sm font-medium">Dark Mode</span>
                {mounted && (
                  <motion.button
                    whileTap={{ rotate: 180, scale: 0.9 }}
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    className={cn("p-2 rounded-full transition-colors")}
                    aria-label="Toggle Theme"
                  >
                    {theme === "dark" ? <Sun className={cn("w-5 h-5 text-[#FFCE00]")} /> : <Moon className={cn("w-5 h-5 text-[#181818]")} />}
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* RENDER CART SIDEBAR */}
      <CartSidebar />
    </motion.nav>
  );
}