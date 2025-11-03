// signature-trader/app/admin/categories/page.tsx
"use client";

import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { List, PlusCircle, Settings, Trash2, Loader2, Save } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot, doc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useNotificationStore } from '@/lib/store/useNotificationStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';


interface Category {
    id: string;
    name: string;
    slug: string;
    description: string;
    createdAt: { seconds: number };
}

// Minimal interface needed to count products
interface ProductReference {
    id: string;
    category_id: string;
}

const initialCategoryState = {
    name: '',
    slug: '',
    description: '',
};

export default function AdminCategoriesPage() {
    const { addNotification } = useNotificationStore();
    const [categories, setCategories] = useState<Category[]>([]);
    const [products, setProducts] = useState<ProductReference[]>([]); // <-- NEW: State for product references
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [formData, setFormData] = useState(initialCategoryState);

    // --- 1. Real-Time Fetch of Categories ---
    useEffect(() => {
        const categoriesQuery = query(collection(db, 'categories'));
        
        const unsubscribe = onSnapshot(categoriesQuery, (snapshot) => {
            setCategories(snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            } as Category)));
            setLoading(false);
        }, (error) => {
            console.error("Error fetching categories:", error);
            addNotification("Failed to load categories list.", "error");
            setLoading(false);
        });

        return () => unsubscribe();
    }, [addNotification]);

    // --- 2. Real-Time Fetch of Products for Counting ---
    useEffect(() => {
        const productsQuery = query(collection(db, 'products'));
        
        const unsubscribe = onSnapshot(productsQuery, (snapshot) => {
            // Fetch only necessary fields (id, category_id) for efficiency
            const productRefs: ProductReference[] = snapshot.docs.map(doc => ({
                id: doc.id,
                category_id: doc.data().category_id || '', // Ensure category_id exists
            }));
            setProducts(productRefs);
        }, (error) => {
            console.error("Error fetching product references for count:", error);
        });

        return () => unsubscribe();
    }, []);
    
    // --- 3. Compute Product Counts (Memoized for Performance) ---
    const productCountMap = useMemo(() => {
        const counts: { [key: string]: number } = {};
        for (const product of products) {
            const categoryId = product.category_id;
            if (categoryId) {
                counts[categoryId] = (counts[categoryId] || 0) + 1;
            }
        }
        return counts;
    }, [products]); // Re-calculates whenever the product list changes

    
    // --- 4. Form State Management (Remains the same) ---
    useEffect(() => {
        if (editingCategory && editingCategory.id) { 
            setFormData({
                name: editingCategory.name,
                slug: editingCategory.slug,
                description: editingCategory.description,
            });
        } else if (editingCategory && !editingCategory.id) { 
             setFormData(initialCategoryState);
        } else { 
            setFormData(initialCategoryState);
        }
    }, [editingCategory]);

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ 
            ...prev, 
            [id]: value,
            ...(id === 'name' ? { slug: value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-*|-*$/g, '') } : {})
        }));
    };

    const resetForm = () => {
        setEditingCategory(null);
    };

    // --- 5. Save/Delete Handlers (Remain the same) ---
    const handleSaveCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        const action = editingCategory?.id ? 'updated' : 'created';
        
        try {
            if (!formData.name.trim() || !formData.slug.trim()) {
                throw new Error("Category name and slug are required.");
            }

            const dataToSave = {
                name: formData.name.trim(),
                slug: formData.slug.trim(),
                description: formData.description.trim(),
            };

            if (editingCategory?.id) {
                const categoryRef = doc(db, 'categories', editingCategory.id);
                await updateDoc(categoryRef, dataToSave);
            } else {
                await addDoc(collection(db, 'categories'), {
                    ...dataToSave,
                    createdAt: new Date(),
                });
            }

            addNotification(`Category '${formData.name}' successfully ${action}.`, "success");
            resetForm();
        } catch (error) {
            console.error(`Failed to ${action} category:`, error);
            addNotification(`Failed to ${action} category.`, "error");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteCategory = async (id: string, name: string) => {
        if (productCountMap[id] > 0) {
            addNotification(`Cannot delete category '${name}'. It is currently linked to ${productCountMap[id]} products.`, "error");
            return;
        }

        if (confirm(`Are you sure you want to delete the category: ${name}?`)) {
            try {
                const categoryRef = doc(db, 'categories', id);
                await deleteDoc(categoryRef);
                addNotification(`Category '${name}' deleted.`, "info");
            } catch (error) {
                console.error("Failed to delete category:", error);
                addNotification("Failed to delete category.", "error");
            }
        }
    };
    
    // --- Render Form/List View ---
    
    const renderForm = () => (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className={cn("p-6 border border-border rounded-xl bg-card shadow-lg")}
        >
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-red-600">
                    {editingCategory?.id ? `Edit: ${editingCategory.name}` : 'Add New Category'}
                </h3>
                <Button variant="outline" onClick={resetForm}>
                    Cancel
                </Button>
            </div>
            
            <form onSubmit={handleSaveCategory} className="space-y-6">
                
                {/* Name and Slug */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <Label htmlFor="name">Category Name *</Label>
                        <Input id="name" type="text" placeholder="e.g., Cutlery" required 
                               value={formData.name} onChange={handleFormChange} />
                    </div>
                    <div>
                        <Label htmlFor="slug">Slug (URL Segment) *</Label>
                        <Input id="slug" type="text" placeholder="e.g., cutlery-sets" required 
                               value={formData.slug} onChange={handleFormChange} />
                    </div>
                </div>

                {/* Description */}
                <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" rows={3} placeholder="A brief description of this category..."
                              value={formData.description} onChange={handleFormChange} />
                </div>
                
                <Button type="submit" disabled={isSaving} className={cn("w-40 bg-red-600 hover:bg-red-700 text-white flex items-center justify-center")}>
                    {isSaving ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                        <Save className="w-4 h-4 mr-2" />
                    )}
                    {editingCategory?.id ? "Save Changes" : "Create Category"}
                </Button>
            </form>
        </motion.div>
    );

    const renderList = () => (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
        >
            <div className="flex justify-between items-center pb-4 border-b border-border">
                <p className="text-lg font-medium">Defined Categories ({categories.length})</p>
                <button 
                    onClick={() => setEditingCategory({} as Category)} 
                    className={cn("flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition")}
                >
                    <PlusCircle className="w-4 h-4" /> Add New Category
                </button>
            </div>

            {loading ? (
                 <div className="text-center py-10">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-red-500" />
                    <p className="text-muted-foreground mt-2">Fetching categories...</p>
                </div>
            ) : categories.length === 0 ? (
                <div className={cn("text-center py-10 border-2 border-dashed border-border rounded-xl bg-muted/20")}>
                    <p className="text-xl font-semibold text-muted-foreground">No categories defined yet.</p>
                    <p className="text-sm text-gray-500 mt-2">Click "Add New Category" to start.</p>
                </div>
            ) : (
                <div className="overflow-x-auto border border-border rounded-lg">
                    <table className="min-w-full divide-y divide-border">
                        <thead className="bg-muted/50">
                            <tr>
                                {["Name", "Slug", "Description", "Products", "Actions"].map(header => (
                                    <th key={header} className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        {header}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {categories.map((category) => {
                                const productCount = productCountMap[category.id] || 0; // <-- GET COUNT HERE
                                return (
                                <tr key={category.id} className="hover:bg-muted/10 transition-colors">
                                    <td className="px-6 py-3 text-sm font-medium text-foreground">{category.name}</td>
                                    <td className="px-6 py-3 text-sm text-muted-foreground">{category.slug}</td>
                                    <td className="px-6 py-3 text-sm text-muted-foreground max-w-xs overflow-hidden truncate">
                                        {category.description || 'N/A'}
                                    </td>
                                    <td className="px-6 py-3 text-sm font-medium text-red-600">
                                        {productCount} {/* <-- RENDER ACTUAL COUNT */}
                                    </td> 
                                    <td className="px-6 py-3 whitespace-nowrap text-sm flex gap-3">
                                        <button 
                                            onClick={() => setEditingCategory(category)}
                                            className="text-[#FFCE00] hover:text-[#e6b800] transition-colors flex items-center gap-1"
                                        >
                                            <Settings className='w-4 h-4' /> Edit
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteCategory(category.id, category.name)}
                                            className={cn("text-red-500 hover:text-red-700 transition-colors flex items-center gap-1", {
                                                'opacity-50 cursor-not-allowed': productCount > 0 
                                            })}
                                            disabled={productCount > 0}
                                        >
                                            <Trash2 className='w-4 h-4' /> Delete
                                        </button>
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>
            )}
        </motion.div>
    );

    return (
        <div className="space-y-8">
            <h2 className="text-3xl font-bold mb-4 text-red-600 flex items-center gap-2">
                <List className='w-6 h-6'/> Category Management
            </h2>
             <AnimatePresence mode="wait">
                {editingCategory !== null ? renderForm() : renderList()}
            </AnimatePresence>
        </div>
    );
}