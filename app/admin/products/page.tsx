// signature-trader/app/admin/products/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { Boxes, PlusCircle, Settings, Trash2, Loader2, Tag, DollarSign, Package } from 'lucide-react';
import { motion } from 'framer-motion';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { useNotificationStore } from '@/lib/store/useNotificationStore';
import ProductForm from './ProductForm'; 
import { cn } from '@/lib/utils'; // cn utility import kiya gaya hai

// Placeholder interfaces (match Firestore data structures)
interface Category { id: string; name: string; slug: string; }

// FIX: Update interface to reflect actual data fields from ProductForm
interface ProductListItem {
    id: string;
    name: string;
    basePrice: number; // Use basePrice as saved by the form
    stock: number;
    category_id: string;
}


export default function AdminProductsPage() {
    const { addNotification } = useNotificationStore();
    const [view, setView] = useState<'list' | 'form'>('list');
    const [editingProductId, setEditingProductId] = useState<string | undefined>(undefined);
    const [categories, setCategories] = useState<Category[]>([]); 
    const [products, setProducts] = useState<ProductListItem[]>([]); 
    const [editingProductData, setEditingProductData] = useState<any>(undefined); 
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [loadingCategories, setLoadingCategories] = useState(true);

    // --- FETCH CATEGORIES ---
    useEffect(() => {
        const categoriesQuery = query(collection(db, 'categories'));
        const unsubscribe = onSnapshot(categoriesQuery, (snapshot) => {
            setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category)));
            setLoadingCategories(false);
        });
        return () => unsubscribe();
    }, []);
    
    // --- FETCH PRODUCTS (List View) ---
    useEffect(() => {
        const productsQuery = query(collection(db, 'products'));
        const unsubscribe = onSnapshot(productsQuery, (snapshot) => {
            // FIX: Map data to the correct interface (basePrice)
            setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProductListItem)));
            setLoadingProducts(false);
        });
        return () => unsubscribe();
    }, []);

    // --- HANDLE EDIT (Fetching single product details for form) ---
    const fetchProductDetails = async (id: string) => {
        const productRef = doc(db, 'products', id);
        const productSnap = await getDoc(productRef);
        if (productSnap.exists()) {
            setEditingProductData(productSnap.data());
        }
    };
    
    // Load details when editing is triggered
    useEffect(() => {
        if (editingProductId) {
            fetchProductDetails(editingProductId);
        } else {
            setEditingProductData(undefined);
        }
    }, [editingProductId]);


    // Function to handle opening the form
    const handleAddProduct = () => {
        if (categories.length === 0) {
            addNotification("Please create a category first before adding a product.", "info");
            return;
        }
        setEditingProductId(undefined);
        setView('form');
    };

    // Function to handle editing an existing product
    const handleEditProduct = (id: string) => {
        setEditingProductId(id);
        setView('form');
    };
    
    // --- DELETE HANDLER ---
    const handleDeleteProduct = async (id: string, name: string) => {
        if (confirm(`Are you sure you want to delete the product: ${name}? This action cannot be undone.`)) {
            try {
                const productRef = doc(db, 'products', id);
                await deleteDoc(productRef);
                addNotification(`Product '${name}' deleted.`, "info");
            } catch (error) {
                console.error("Failed to delete product:", error);
                addNotification("Failed to delete product.", "error");
            }
        }
    };

    // Helper function to get Category Name
    const getCategoryName = (categoryId: string) => {
        return categories.find(c => c.id === categoryId)?.name || 'N/A';
    };


    // --- Render Form View ---
    if (view === 'form') {
        if (editingProductId && !editingProductData) {
            return <div className="text-center py-10"><Loader2 className="w-6 h-6 animate-spin mx-auto text-red-500" /></div>;
        }

        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
            >
                <div className="flex items-center justify-between mb-6 border-b border-border pb-4">
                    <h2 className="text-2xl sm:text-3xl font-bold text-red-600 flex items-center gap-2">
                        <Boxes className='w-6 h-6'/> {editingProductId ? 'Edit Product' : 'Add Product'}
                    </h2>
                    <button onClick={() => setView('list')} className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">
                        ← Back to List
                    </button>
                </div>
                {/* PASS CATEGORIES & DATA to the ProductForm */}
                <ProductForm 
                    productId={editingProductId} 
                    categories={categories} 
                    productData={editingProductData}
                    onSave={() => setView('list')} 
                />
            </motion.div>
        );
    }

    // --- Render List View ---
    return (
        <div className="space-y-8">
            <h2 className="text-3xl font-bold mb-4 text-red-600 flex items-center gap-2">
                <Boxes className='w-6 h-6'/> Product Management
            </h2>
            <p className="text-muted-foreground">Manage inventory, media, variants, and product details.</p>

            {/* Header and Add Button */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-border">
                <p className="text-lg font-medium">All Products ({products.length})</p>
                <button 
                    onClick={handleAddProduct}
                    className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition w-full sm:w-auto justify-center" // Mobile full width
                >
                    <PlusCircle className="w-4 h-4" /> Add New Product
                </button>
            </div>

            {loadingProducts ? (
                <div className="text-center py-10"><Loader2 className="w-6 h-6 animate-spin mx-auto text-red-500" /></div>
            ) : products.length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed border-border rounded-xl bg-muted/20">
                    <p className="text-xl font-semibold text-muted-foreground">No products found.</p>
                </div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    {/* --- 1. Mobile/Small Screen Card View (Responsive Enhancement) --- */}
                    <div className="space-y-4 md:hidden">
                        {products.map((product) => {
                            const priceValue = Number(product.basePrice || 0);
                            const categoryName = getCategoryName(product.category_id);

                            return (
                                <div key={product.id} className="p-4 border border-border rounded-lg shadow-sm bg-card">
                                    <p className="text-lg font-bold text-foreground mb-2 truncate">{product.name}</p>
                                    
                                    <div className="space-y-1 text-sm">
                                        <p className="flex justify-between text-muted-foreground">
                                            <span className="flex items-center gap-1"><Tag className="w-3 h-3 text-red-600" /> Category:</span> 
                                            <span className="font-medium text-red-600">{categoryName}</span>
                                        </p>
                                        <p className="flex justify-between text-muted-foreground">
                                            <span className="flex items-center gap-1"><DollarSign className="w-3 h-3 text-green-500" /> Price:</span> 
                                            <span className="font-medium">PKR {priceValue.toLocaleString()}</span>
                                        </p>
                                        <p className="flex justify-between text-muted-foreground">
                                            <span className="flex items-center gap-1"><Package className="w-3 h-3 text-blue-500" /> Stock:</span> 
                                            <span className={cn("font-medium", product.stock < 10 ? 'text-yellow-600' : 'text-green-600')}>
                                                {product.stock} in stock
                                            </span>
                                        </p>
                                    </div>

                                    {/* Actions at the bottom */}
                                    <div className="flex justify-end gap-3 pt-3 mt-3 border-t border-border">
                                        <button 
                                            onClick={() => handleEditProduct(product.id)}
                                            className="text-[#FFCE00] hover:text-[#e6b800] transition-colors flex items-center gap-1 text-sm font-medium"
                                        >
                                            <Settings className='w-4 h-4' /> Edit
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteProduct(product.id, product.name)}
                                            className="text-red-500 hover:text-red-700 transition-colors flex items-center gap-1 text-sm font-medium"
                                        >
                                            <Trash2 className='w-4 h-4' /> Delete
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>


                    {/* --- 2. Desktop/Tablet Table View (Hidden on Small Screens) --- */}
                    <div className="hidden md:block overflow-x-auto border border-border rounded-lg shadow-sm">
                        <table className="min-w-full divide-y divide-border">
                            <thead className="bg-muted/50">
                                <tr>
                                    {["Product Name", "Category", "Price (PKR)", "Stock", "Actions"].map(header => (
                                        <th key={header} className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                            {header}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {products.map((product) => {
                                    const priceValue = Number(product.basePrice || 0);
                                    const categoryName = getCategoryName(product.category_id);

                                    return (
                                        <tr key={product.id} className="hover:bg-muted/20 transition-colors">
                                            <td className="px-6 py-4 max-w-xs truncate text-sm font-medium text-foreground">{product.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">{categoryName}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{priceValue.toLocaleString()}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <span className={product.stock < 10 ? 'text-yellow-600' : 'text-green-600'}>
                                                    {product.stock}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm flex gap-3 items-center">
                                                <button 
                                                    onClick={() => handleEditProduct(product.id)}
                                                    className="text-[#FFCE00] hover:text-[#e6b800] transition-colors flex items-center gap-1"
                                                >
                                                    <Settings className='w-4 h-4' /> Edit
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteProduct(product.id, product.name)}
                                                    className="text-red-500 hover:text-red-700 transition-colors flex items-center gap-1"
                                                >
                                                    <Trash2 className='w-4 h-4' /> Delete
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            )}
        </div>
    );
}