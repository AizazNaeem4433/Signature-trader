// signature-trader/components/Navbar.tsx 
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

interface NavLink {
  href: string;
  label: string;
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
  const [searchQuery, setSearchQuery] = useState(""); 
  
  const pathname = usePathname();
  const router = useRouter(); 
  const { user, role, setAuthUser, isInitialized } = useAuthStore(); 
  const { addNotification } = useNotificationStore(); 
  
  const { items, openCart } = useCartStore();
  const cartItemsCount = items.length; 

  // --- 1. Mounting State & Auth Listener (Runs once) ---
  useEffect(() => {
    setMounted(true);
    // Auth Listener
    const unsubscribeAuth = onAuthStateChanged(auth, (u) => setAuthUser(u)); 
    return () => unsubscribeAuth();
  }, [setAuthUser]);
  
  // --- 2. Category Fetch Listener (Separated to avoid blocking initial render) ---
  useEffect(() => {
    const categoriesQuery = query(collection(db, 'categories'), orderBy('name', 'asc'));
    const unsubscribeCategories = onSnapshot(categoriesQuery, (snapshot) => {
        // Set categories and check if we need to remove the initial page-wide loader (if one exists)
        setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category)));
    });

    return () => unsubscribeCategories();
  }, []); // Empty dependency array means it runs once after mount

  // --- 3. Search Handler (Unchanged) ---
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
        router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
        setIsOpen(false); 
    } else if (pathname.includes('/products')) {
        router.push('/products'); 
    }
  };

  const baseNavLinks: NavLink[] = [
    { href: "/", label: "Home" },
    { href: "/products", label: "All Products" },
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
      className={cn("bg-white dark:bg-[#0a0a0a] border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50 shadow-md transition-colors duration-300")}
    >
      <div className={cn("max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 py-3")}>
        {/* Logo */}
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
          <Link href="/" className={cn("flex items-center")}>
            {mounted ? (
              <img src={logoSrc} alt="Logo" className={cn("h-10 sm:h-12 w-auto object-contain")} />
            ) : (
              <div className={cn("h-10 sm:h-12 w-auto")} />
            )}
          </Link>
        </motion.div>

        {/* Desktop nav links and Search */}
        <div className={cn("hidden md:flex gap-6 items-center")}>
          
          {/* Search Bar */}
          <form onSubmit={handleSearch} className={cn("relative flex items-center")}>
            <Input 
                type="search"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn("h-9 w-64 pr-10 bg-muted/30 dark:bg-input/20 border-border")}
            />
            <button type="submit" className={cn("absolute right-2 p-1 text-muted-foreground hover:text-foreground transition-colors")} aria-label="Search">
                <Search className={cn("w-4 h-4")} />
            </button>
          </form>
          
          {navLinks.map((link, i) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn("relative group font-medium text-[#181818] dark:text-gray-300 transition-all duration-300", 
                 isLinkActive(link.href) && "text-[#FFCE00] dark:text-[#FFCE00]"
              )}
            >
              {link.label}
              <span className={cn("absolute left-0 -bottom-1 w-0 h-0.5 bg-[#FFCE00] transition-all duration-300 group-hover:w-full")}></span>
            </Link>
          ))}
          
          {/* CATEGORY DROPDOWN */}
          <div className={cn("relative group h-full flex items-center")}>
            <button
                className={cn(
                    "flex items-center gap-1 font-medium text-[#181818] dark:text-gray-300 transition-all duration-300",
                    pathname.includes("/products/category") ? "text-[#FFCE00] dark:text-[#FFCE00]" : "hover:text-[#FFCE00] dark:hover:text-[#FFCE00]"
                )}
            >
                Categories 
                <ChevronDown className={cn("w-4 h-4 transition-transform duration-200 group-hover:rotate-180")} />
            </button>

            <div className={cn("absolute left-1/2 -translate-x-1/2 top-full mt-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform scale-95 group-hover:scale-100 min-w-[180px] origin-top")}>
                <div className={cn("bg-card border border-border rounded-lg shadow-xl p-1 space-y-1")}>
                    {categories.length > 0 ? (
                        categories.map((cat) => (
                            <Link
                                key={cat.id}
                                href={`/products/category/${cat.slug}`}
                                className={cn("block px-3 py-2 text-sm font-medium text-foreground hover:bg-muted/50 rounded-md transition-colors")}
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
          {/* END: CATEGORY DROPDOWN */}
        </div>

        {/* Right icons (Includes Theme Toggle) */}
        <div className={cn("flex items-center gap-3 sm:gap-4")}>
          {/* Theme toggle */}
          {mounted && (
            <motion.button
              whileTap={{ rotate: 180, scale: 0.9 }}
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className={cn("p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors")}
              aria-label="Toggle Theme"
            >
              {theme === "dark" ? <Sun className={cn("w-5 h-5 text-[#FFCE00]")} /> : <Moon className={cn("w-5 h-5 text-[#181818]")} />}
            </motion.button>
          )}

          {/* Cart Icon and Count */}
          <motion.div whileHover={{ rotate: -10, scale: 1.1 }}>
            <button
              onClick={openCart} 
              className={cn("relative text-[#181818] dark:text-gray-300 hover:text-[#FFCE00] transition-colors")}
              aria-label="Open Cart"
            >
              <ShoppingCart className={cn("w-5 h-5")} />
              {cartItemsCount > 0 && (
                <span className={cn("absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold")}>
                  {cartItemsCount}
                </span>
              )}
            </button>
          </motion.div>

          {/* Profile / Login Icon */}
          <div className={cn("relative")}>
            {!isInitialized ? (
              <Loader2 className={cn("w-5 h-5 animate-spin text-[#FFCE00]")} />
            ) : user ? (
              <div className={cn("flex items-center gap-2")}>
                <Link href="/account" className={cn("flex items-center")}> 
                  <img
                    src={user.photoURL || "/image.png"}
                    alt={user.displayName || "User"}
                    className={cn("w-8 h-8 rounded-full object-cover border-2 border-[#FFCE00]")}
                  />
                </Link>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={handleLogout}
                  className={cn("p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors")}
                  aria-label="Logout"
                >
                  <LogOut className={cn("w-4 h-4 text-red-500")} />
                </motion.button>
              </div>
            ) : (
              <Link
                href={`/auth/login?redirect=${pathname}`}
                className={cn("text-[#181818] dark:text-gray-300 hover:text-[#FFCE00] transition-colors")}
              >
                <User className={cn("w-5 h-5")} />
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            className={cn("md:hidden text-[#181818] dark:text-gray-300 hover:text-[#FFCE00] transition-colors")}
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className={cn("w-6 h-6")} /> : <Menu className={cn("w-6 h-6")} />}
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
              
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={cn("block px-4 py-2 rounded-md text-[#181818] dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-[#FFCE00] transition-all duration-200")}
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* RENDER CART SIDEBAR */}
      <CartSidebar /> 
    </motion.nav>
  );
}