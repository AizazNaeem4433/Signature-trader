// signature-trader/app/admin/promos/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Percent, PlusCircle, Trash2, Loader2, Save, Calendar, DollarSign } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot, doc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useNotificationStore } from '@/lib/store/useNotificationStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

// Interface matching the Firestore document structure
interface Coupon {
    id: string;
    code: string;
    type: 'percent' | 'fixed';
    value: number;
    minOrder: number;
    isActive: boolean;
    expiresAt: string; // ISO Date string
}

const initialCouponState = {
    code: '',
    type: 'percent' as 'percent' | 'fixed',
    value: 0,
    minOrder: 0,
    isActive: true,
    expiresAt: '',
};

export default function AdminPromosPage() {
    const { addNotification } = useNotificationStore();
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    // State for form control: null = List, Object = Form
    const [editingCoupon, setEditingCoupon] = useState<Coupon | typeof initialCouponState | null>(null);
    const [formData, setFormData] = useState(initialCouponState);

    // --- 1. Real-Time Fetch of Coupons (READ) ---
    useEffect(() => {
        const couponsQuery = query(collection(db, 'promos'));
        
        const unsubscribe = onSnapshot(couponsQuery, (snapshot) => {
            const couponList: Coupon[] = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            } as Coupon));

            setCoupons(couponList);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching coupons:", error);
            addNotification("Failed to load coupon list.", "error");
            setLoading(false);
        });

        return () => unsubscribe();
    }, [addNotification]);
    
    // --- 2. Form State Management (To synchronize data for editing) ---
    useEffect(() => {
        if ((editingCoupon as Coupon)?.id) {
            const coupon = editingCoupon as Coupon;
            setFormData({
                code: coupon.code,
                type: coupon.type,
                value: coupon.value,
                minOrder: coupon.minOrder,
                isActive: coupon.isActive,
                expiresAt: coupon.expiresAt.split('T')[0], // Clean up ISO string for input type="date"
            });
        } else {
            setFormData(initialCouponState);
        }
    }, [editingCoupon]);

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { id, value } = e.target;
        // Special handling for number inputs and the select dropdowns
        let newValue: string | number | boolean = value;

        if (id === 'value' || id === 'minOrder') {
            newValue = Number(value);
        } else if (id === 'isActive') {
            newValue = value === 'true';
        }
        
        setFormData(prev => ({ 
            ...prev, 
            [id]: newValue
        }));
    };

    const resetForm = () => {
        setEditingCoupon(null);
    };

    // --- 3. Save Handler (CREATE / UPDATE) ---
    const handleSaveCoupon = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        const action = (editingCoupon as Coupon)?.id ? 'updated' : 'created';
        
        try {
            if (!formData.code.trim() || formData.value <= 0) {
                throw new Error("Code and Value must be set.");
            }
            if (!formData.expiresAt) {
                 throw new Error("Expiry Date is required.");
            }
            if (new Date(formData.expiresAt) < new Date(new Date().toDateString())) { // Check only date part
                throw new Error("Expiry date cannot be in the past.");
            }

            const dataToSave = {
                ...formData,
                value: Number(formData.value),
                minOrder: Number(formData.minOrder),
                code: formData.code.toUpperCase().trim(),
                expiresAt: new Date(formData.expiresAt).toISOString(), // Save as ISO string
            };

            if ((editingCoupon as Coupon)?.id) {
                // UPDATE operation
                const couponRef = doc(db, 'promos', (editingCoupon as Coupon).id);
                await updateDoc(couponRef, dataToSave);
            } else {
                // CREATE operation: Check for existing code before adding
                const exists = coupons.some(c => c.code === dataToSave.code);
                if (exists) {
                    throw new Error(`Coupon code '${dataToSave.code}' already exists.`);
                }
                await addDoc(collection(db, 'promos'), dataToSave);
            }

            addNotification(`Coupon '${dataToSave.code}' successfully ${action}.`, "success");
            resetForm();
        } catch (error) {
            console.error(`Failed to ${action} coupon:`, error);
            addNotification(`Failed to ${action} coupon: ${error instanceof Error ? error.message : 'Unknown error'}`, "error");
        } finally {
            setIsSaving(false);
        }
    };

    // --- 4. Delete Handler (DELETE) ---
    const handleDeleteCoupon = async (id: string, code: string) => {
        if (confirm(`Are you sure you want to delete the coupon code: ${code}? This action cannot be undone.`)) {
            try {
                const couponRef = doc(db, 'promos', id);
                await deleteDoc(couponRef);
                addNotification(`Coupon '${code}' deleted.`, "info");
            } catch (error) {
                console.error("Failed to delete coupon:", error);
                addNotification("Failed to delete coupon.", "error");
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
            className="p-4 sm:p-6 border border-border rounded-xl bg-card shadow-lg" // Added padding adjustment
        >
            <h3 className="text-xl sm:text-2xl font-bold text-red-600 mb-6">
                {(editingCoupon as Coupon)?.id ? `Edit: ${(editingCoupon as Coupon).code}` : 'Create New Coupon'}
            </h3>
            
            <form onSubmit={handleSaveCoupon} className="space-y-6">
                
                {/* Code and Type: Stacks on mobile */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                        <Label htmlFor="code">Promo Code *</Label>
                        <Input id="code" type="text" placeholder="SUMMER20" required 
                                value={formData.code} onChange={handleFormChange} disabled={!!(editingCoupon as Coupon)?.id} />
                    </div>
                    <div>
                        <Label htmlFor="type">Discount Type *</Label>
                        <select 
                            id="type" 
                            value={formData.type} 
                            onChange={handleFormChange}
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <option value="percent">Percentage (%)</option>
                            <option value="fixed">Fixed Amount (PKR)</option>
                        </select>
                    </div>
                </div>

                {/* Value and Minimum Order: Stacks on mobile */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                        <Label htmlFor="value">Discount Value *</Label>
                        <Input id="value" type="number" step={formData.type === 'percent' ? "1" : "0.01"} min="1" required 
                                value={formData.value || ''} onChange={handleFormChange} />
                        <p className="text-xs text-muted-foreground mt-1">Max {formData.type === 'percent' ? '100' : 'PKR'} for {formData.type}</p>
                    </div>
                    <div>
                        <Label htmlFor="minOrder">Minimum Order (PKR)</Label>
                        <Input id="minOrder" type="number" min="0" 
                                value={formData.minOrder || ''} onChange={handleFormChange} />
                    </div>
                </div>
                
                {/* Expiry and Status: Stacks on mobile */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                     <div>
                        <Label htmlFor="expiresAt">Expiry Date *</Label>
                        <Input id="expiresAt" type="date" value={formData.expiresAt} onChange={handleFormChange} required />
                    </div>
                    <div>
                        <Label htmlFor="isActive">Status</Label>
                        <select 
                            id="isActive" 
                            value={formData.isActive ? 'true' : 'false'} 
                            onChange={handleFormChange}
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <option value="true">Active</option>
                            <option value="false">Disabled</option>
                        </select>
                    </div>
                </div>

                <div className='flex justify-between items-center pt-4'>
                    <Button variant="outline" type="button" onClick={resetForm}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isSaving} className="w-40 bg-red-600 hover:bg-red-700 text-white flex items-center justify-center">
                        {isSaving ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <Save className="w-4 h-4 mr-2" />
                        )}
                        {(editingCoupon as Coupon)?.id ? "Save Changes" : "Create Coupon"}
                    </Button>
                </div>
            </form>
        </motion.div>
    );

    const renderList = () => (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-border">
                <h2 className="text-3xl font-bold text-red-600 flex items-center gap-2">
                    <Percent className='w-6 h-6'/> Promo Codes ({coupons.length})
                </h2>
                <button 
                    onClick={() => setEditingCoupon(initialCouponState)}
                    className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition w-full sm:w-auto justify-center" // Mobile full width
                >
                    <PlusCircle className="w-4 h-4" /> Create New Coupon
                </button>
            </div>

            {loading ? (
                <div className="text-center py-10"><Loader2 className="w-6 h-6 animate-spin mx-auto text-red-500" /></div>
            ) : coupons.length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed border-border rounded-xl bg-muted/20">
                    <p className="text-xl font-semibold text-muted-foreground">No coupons defined yet.</p>
                </div>
            ) : (
                <div className="space-y-4 md:hidden">
                    {/* --- Mobile/Small Screen Card View --- */}
                    {coupons.map((coupon) => {
                        const expiryDate = new Date(coupon.expiresAt).toLocaleDateString();
                        const isExpired = new Date(coupon.expiresAt) < new Date(new Date().toDateString());
                        const statusText = coupon.isActive && !isExpired ? 'Active' : (isExpired ? 'Expired' : 'Disabled');
                        const statusClass = coupon.isActive && !isExpired ? 'text-green-600' : 'text-gray-500';

                        return (
                            <div key={coupon.id} className={cn(
                                "p-4 border border-border rounded-lg shadow-sm bg-card space-y-2",
                                isExpired || !coupon.isActive ? 'opacity-70 border-red-500/30' : ''
                            )}>
                                <div className="flex justify-between items-center pb-2 border-b border-border/50">
                                    <p className="text-xl font-bold text-red-600">{coupon.code}</p>
                                    <span className={cn("text-sm font-medium", statusClass)}>{statusText}</span>
                                </div>
                                
                                <div className="space-y-1 text-sm">
                                    <p className="flex justify-between text-muted-foreground">
                                        <span className="flex items-center gap-1"><DollarSign className="w-4 h-4 text-green-500" /> Value:</span> 
                                        <span className="font-medium text-foreground">
                                            {coupon.type === 'percent' ? `${coupon.value}%` : `PKR ${coupon.value.toLocaleString()}`}
                                        </span>
                                    </p>
                                    <p className="flex justify-between text-muted-foreground">
                                        <span className="flex items-center gap-1"><Calendar className="w-4 h-4 text-blue-500" /> Expires:</span> 
                                        <span className={cn("font-medium", isExpired ? 'text-red-500' : '')}>{expiryDate}</span>
                                    </p>
                                    <p className="flex justify-between text-muted-foreground">
                                        Min Order:
                                        <span className="font-medium">PKR {coupon.minOrder.toLocaleString()}</span>
                                    </p>
                                </div>

                                {/* Actions */}
                                <div className="flex justify-end gap-3 pt-3 border-t border-border/50">
                                    <Button 
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setEditingCoupon(coupon)}
                                        className="text-[#FFCE00] hover:text-[#e6b800] transition-colors"
                                    >
                                        Edit
                                    </Button>
                                    <Button 
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => handleDeleteCoupon(coupon.id, coupon.code)}
                                    >
                                        <Trash2 className='w-4 h-4' />
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
            
            {/* --- Desktop/Tablet Table View (Hidden on Small Screens) --- */}
            {!loading && coupons.length > 0 && (
                <div className="hidden md:block overflow-x-auto border border-border rounded-lg shadow-sm">
                    <table className="min-w-full divide-y divide-border">
                        <thead className="bg-muted/50">
                            <tr>
                                {["Code", "Type", "Value", "Min Order", "Expiry", "Status", "Actions"].map(header => (
                                    <th key={header} className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        {header}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {coupons.map((coupon) => {
                                const expiryDate = new Date(coupon.expiresAt).toLocaleDateString();
                                const isExpired = new Date(coupon.expiresAt) < new Date(new Date().toDateString());
                                return (
                                <tr key={coupon.id} className={cn(
                                    'hover:bg-muted/10', 
                                    { 'bg-red-500/10 opacity-70': isExpired || !coupon.isActive }
                                )}>
                                    <td className="px-6 py-3 text-sm font-bold text-red-600">{coupon.code}</td>
                                    <td className="px-6 py-3 text-sm capitalize">{coupon.type}</td>
                                    <td className="px-6 py-3 text-sm font-medium">
                                        {coupon.type === 'percent' ? `${coupon.value}%` : `PKR ${coupon.value.toLocaleString()}`}
                                    </td>
                                    <td className="px-6 py-3 text-sm text-muted-foreground">PKR {coupon.minOrder.toLocaleString()}</td>
                                    <td className="px-6 py-3 text-sm text-muted-foreground">
                                        {isExpired ? <span className='text-red-500'>EXPIRED</span> : expiryDate}
                                    </td>
                                    <td className="px-6 py-3 whitespace-nowrap text-sm">
                                        <span className={cn(
                                            "px-2 inline-flex text-xs leading-5 font-semibold rounded-full",
                                            coupon.isActive && !isExpired ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-800'
                                        )}>
                                            {coupon.isActive && !isExpired ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 whitespace-nowrap text-sm flex gap-3">
                                        <button 
                                            onClick={() => setEditingCoupon(coupon)}
                                            className="text-[#FFCE00] hover:text-[#e6b800] transition-colors"
                                        >
                                            Edit
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteCoupon(coupon.id, coupon.code)}
                                            className="text-red-500 hover:text-red-700 transition-colors"
                                        >
                                            <Trash2 className='w-4 h-4' />
                                        </button>
                                    </td>
                                </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </motion.div>
    );

    return (
        <AnimatePresence mode="wait">
            {editingCoupon !== null ? renderForm() : renderList()}
        </AnimatePresence>
    );
}