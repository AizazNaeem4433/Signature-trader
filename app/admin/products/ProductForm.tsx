// signature-trader/app/admin/products/ProductForm.tsx
"use client";

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, PlusCircle, Trash2, Image as ImageIcon, MinusCircle, Upload, Save } from 'lucide-react'; 
import { useNotificationStore } from '@/lib/store/useNotificationStore';
import { db } from '@/lib/firebase';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';


// --- DATA INTERFACES (UNCHANGED) ---
interface Category { id: string; name: string; }
interface ProductMedia { id: number; url: string; alt: string; type: 'image' | 'video'; } 
interface VariantOption { id: number; value: string; priceAdjustment: number; linkedMediaId: number | null; }
interface VariantType { id: number; name: string; options: VariantOption[]; }

interface ProductFormState {
    name: string;
    shortDescription: string;
    detailedDescription: string;
    slug: string;
    basePrice: number;
    cutPrice: number; // <-- NEW: Original price for discount display
    category_id: string;
    stock: number;
    isActive: boolean;
    variantTypes: VariantType[];
    media: ProductMedia[];
}

const initialProductState: ProductFormState = {
    name: '', shortDescription: '', detailedDescription: '', slug: '', basePrice: 0, cutPrice: 0, category_id: '',
    stock: 1, isActive: true, variantTypes: [], media: [],
};

interface ProductFormProps {
    productId?: string;
    categories: Category[];
    productData?: ProductFormState;
    onSave: () => void;
}


export default function ProductForm({ productId, categories, productData, onSave }: ProductFormProps) {
    const [formData, setFormData] = useState<ProductFormState>(initialProductState);
    const [loading, setLoading] = useState(false);
    const { addNotification } = useNotificationStore();
    
    // File upload states
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false); 

    // ... (useEffect, generateUniqueId, useEffect for Slug, handleSubmit and other handlers are unchanged for brevity)
    
    // Load existing data when editing
    useEffect(() => {
        if (productId && productData) {
               setFormData({
                   ...initialProductState,
                   ...productData,
               });
        } else {
            setFormData(initialProductState);
        }
    }, [productId, productData]);
    
    const generateUniqueId = () => Date.now() + Math.floor(Math.random() * 10000);
    
    // --- UTILITY: Auto Slug Generation ---
    useEffect(() => {
        if (!productId && formData.name) {
            const newSlug = formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-*|-*$/g, '');
            setFormData(prev => ({ ...prev, slug: newSlug }));
        }
    }, [formData.name, productId]);


    // --- CLOUDINARY UPLOAD HANDLER ---
    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        
        // Determine media type for Cloudinary and form data
        const mediaType = file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'other';
        if (mediaType === 'other') {
             addNotification("Unsupported file type. Please upload image or video.", "error");
             if (fileInputRef.current) fileInputRef.current.value = '';
             return;
        }

        const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
        const UPLOAD_PRESET = 'Signature_unsigned'; 
        
        if (!CLOUD_NAME || !UPLOAD_PRESET) {
            addNotification("Cloudinary configuration missing. Check .env.local.", "error");
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        setIsUploading(true);

        try {
            const uploadFormData = new FormData();
            uploadFormData.append('file', file);
            uploadFormData.append('upload_preset', UPLOAD_PRESET);
            uploadFormData.append('folder', 'signature_trader_products');
            
            const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${mediaType}/upload`; // Dynamic endpoint

            const response = await fetch(uploadUrl, {
                method: 'POST',
                body: uploadFormData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || `HTTP Upload Failed with status: ${response.status}`);
            }

            const data = await response.json();

            // Add the secure URL to the form data
            setFormData(prev => ({
                ...prev,
                media: [...prev.media, { 
                    id: generateUniqueId(), 
                    url: data.secure_url, 
                    alt: file.name.split('.')[0],
                    type: mediaType as 'image' | 'video', // Save file type
                }]
            }));
            
            addNotification(`${mediaType.charAt(0).toUpperCase() + mediaType.slice(1)} uploaded successfully!`, "success");

        } catch (error) {
            console.error("Upload process failed:", error);
            addNotification(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`, "error");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };
    
    // --- MEDIA/VARIANT HANDLERS (Omitted for brevity, assumed functional) ---
    const handleRemoveMedia = (id: number) => {
        setFormData(prev => ({
            ...prev,
            media: prev.media.filter(m => m.id !== id)
        }));
    };

    const handleMediaChange = (id: number, field: keyof ProductMedia, value: string) => {
        setFormData(prev => ({
            ...prev,
            media: prev.media.map(m => m.id === id ? { ...m, [field]: value } : m)
        }));
    };
    
    const handleAddVariantType = () => {
        setFormData(prev => ({
            ...prev,
            variantTypes: [...prev.variantTypes, { id: generateUniqueId(), name: '', options: [] }]
        }));
    };
    
    const handleRemoveVariantType = (id: number) => {
        setFormData(prev => ({
            ...prev,
            variantTypes: prev.variantTypes.filter(vt => vt.id !== id)
        }));
    };
    
    const handleAddVariantOption = (typeId: number) => {
        setFormData(prev => ({
            ...prev,
            variantTypes: prev.variantTypes.map(vt => 
                vt.id === typeId 
                ? { ...vt, options: [...vt.options, { id: generateUniqueId(), value: '', priceAdjustment: 0, linkedMediaId: null }] } 
                : vt
            )
        }));
    };

    const handleRemoveVariantOption = (typeId: number, optionId: number) => {
          setFormData(prev => ({
            ...prev,
            variantTypes: prev.variantTypes.map(vt => 
                vt.id === typeId 
                ? { ...vt, options: vt.options.filter(opt => opt.id !== optionId) } 
                : vt
            )
        }));
    };

    const handleOptionChange = (typeId: number, optionId: number, field: keyof VariantOption, value: string | number | null) => {
        setFormData(prev => ({
            ...prev,
            variantTypes: prev.variantTypes.map(vt => 
                vt.id === typeId 
                ? { 
                    ...vt, 
                    options: vt.options.map(opt => 
                        opt.id === optionId 
                        ? { ...opt, [field]: field === 'priceAdjustment' ? Number(value) : value } 
                        : opt
                    )
                } 
                : vt
            )
        }));
    };


    // --- SUBMISSION ---
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const action = productId ? 'updated' : 'created';

        try {
            // 1. INPUT VALIDATION
            if (formData.basePrice <= 0 || !formData.name || !formData.category_id || !formData.shortDescription) {
                addNotification("Name, Price, Category, and Short Description are required.", "error");
                setLoading(false);
                return;
            }
            if (formData.cutPrice > 0 && formData.cutPrice <= formData.basePrice) {
                 addNotification("Cut Price (Original Price) must be higher than the Base Price (Discounted Price).", "error");
                 setLoading(false);
                 return;
            }
            if (formData.media.length === 0) {
                 addNotification("At least one image is required for the product.", "error");
                 setLoading(false);
                 return;
            }


            const dataToSave = {
                ...formData,
                basePrice: Number(formData.basePrice),
                cutPrice: Number(formData.cutPrice), // Save the original price
                stock: Number(formData.stock),
                ...(productId ? {} : { createdAt: new Date() })
            };

            // 2. FIRESTORE SAVE LOGIC
            if (productId) {
                const productRef = doc(db, 'products', productId);
                await updateDoc(productRef, dataToSave);
            } else {
                await addDoc(collection(db, 'products'), dataToSave);
            }

            addNotification(`Product '${formData.name}' successfully ${action}!`, "success");

            onSave();
        } catch (error) {
            console.error("Product save failed:", error);
            addNotification(`Product save failed: ${error instanceof Error ? error.message : 'Unknown error'}`, "error");
        } finally {
            setLoading(false);
        }
    };

    // --- RENDER ---
    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            <h3 className="text-2xl font-semibold text-red-600 mb-4">{productId ? "Edit Product" : "Add New Product"}</h3>

            {/* General Details: Grid stacks on mobile */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <Label htmlFor="name">Product Name *</Label>
                    <Input id="name" type="text" placeholder="Feather Quill Cutlery Set" required 
                            value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                </div>
                <div>
                    <Label htmlFor="slug">Product Slug (URL)</Label>
                    {/* Slug field is now primarily read-only/auto-generated */}
                    <Input id="slug" type="text" placeholder="auto-generated" 
                            value={formData.slug} onChange={(e) => setFormData({...formData, slug: e.target.value})} />
                </div>
            </div>

            {/* Price, Stock, and Category: Grid stacks partially on mobile */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                 <div>
                    <Label htmlFor="basePrice">Discounted Price (PKR) *</Label>
                    <Input id="basePrice" type="number" step="0.01" min="1" required 
                            value={formData.basePrice || ''} onChange={(e) => setFormData({...formData, basePrice: parseFloat(e.target.value) || 0})} />
                </div>
                <div>
                    <Label htmlFor="cutPrice">Original Price (Cut Price)</Label>
                    <Input id="cutPrice" type="number" step="0.01" min="0" 
                            value={formData.cutPrice || ''} onChange={(e) => setFormData({...formData, cutPrice: parseFloat(e.target.value) || 0})} />
                </div>
                
                {/* Category Selector */}
                <div>
                    <Label htmlFor="category_id">Category *</Label>
                    <Select
                        onValueChange={(value) => setFormData({...formData, category_id: value})}
                        value={formData.category_id}
                        required
                    >
                        <SelectTrigger id="category_id">
                            <SelectValue placeholder="Select Category" />
                        </SelectTrigger>
                        <SelectContent>
                            {categories.map((cat) => (
                                <SelectItem key={cat.id} value={cat.id}>
                                    {cat.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    <Label htmlFor="isActive">Stock</Label>
                    <Input id="stock" type="number" min="0" required 
                            value={formData.stock} onChange={(e) => setFormData({...formData, stock: parseInt(e.target.value) || 0})} />
                </div>
            </div>

            {/* --- Descriptions: Grid stacks on mobile --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <Label htmlFor="shortDescription">Short Description (Cart Tip) *</Label>
                    <Textarea id="shortDescription" rows={3} maxLength={150} placeholder="Brief sentence for product card/cart view (max 150 chars)."
                             value={formData.shortDescription} onChange={(e) => setFormData({...formData, shortDescription: e.target.value})} />
                    <p className="text-xs text-muted-foreground mt-1">150 characters max.</p>
                </div>
                <div>
                    <Label htmlFor="detailedDescription">Detailed Description (Product Page)</Label>
                    <Textarea id="detailedDescription" rows={5} placeholder="Full details, materials, care instructions, and conditions."
                             value={formData.detailedDescription} onChange={(e) => setFormData({...formData, detailedDescription: e.target.value})} />
                </div>
            </div>


            {/* --- Media/Image Section --- */}
            <div className={cn("border border-dashed border-border p-4 rounded-lg space-y-4")}>
                <h4 className="text-xl font-medium flex items-center gap-2">Product Media (Image & Video)</h4>
                
                {/* File Input & Upload Button (Unchanged) */}
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload} 
                    style={{ display: 'none' }} 
                    accept="image/*,video/*" 
                    multiple
                />
                
                <Button type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto">
                    {isUploading ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...
                        </>
                    ) : (
                        <>
                            <Upload className="w-4 h-4 mr-2" /> Upload Media (Image/Video)
                        </>
                    )}
                </Button>

                {/* Image List: Adjusted grid to be 2 columns on mobile, 4 on medium */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {formData.media.map((mediaItem) => (
                        <div key={mediaItem.id} className={cn("relative group rounded-md border border-border overflow-hidden")}>
                            {/* Conditional Display: Video or Image (Unchanged) */}
                            {mediaItem.type === 'video' ? (
                                <video controls muted className="w-full h-auto object-cover aspect-square">
                                    <source src={mediaItem.url} type="video/mp4" />
                                    Your browser does not support the video tag.
                                </video>
                            ) : (
                                <img 
                                    src={mediaItem.url || '/placeholder.png'} 
                                    alt={mediaItem.alt} 
                                    className="w-full h-auto object-cover aspect-square" 
                                />
                            )}
                            
                            {/* Trash button (Unchanged) */}
                            <Button 
                                variant="destructive" 
                                size="icon-sm" 
                                type="button" 
                                onClick={() => handleRemoveMedia(mediaItem.id)} 
                                className="absolute top-1 right-1 opacity-100 group-hover:opacity-100 transition-opacity"
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            </div>

            {/* --- Product Variants Section --- */}
            <div className={cn("border border-dashed border-border p-4 rounded-lg space-y-6")}>
                <h4 className="text-xl font-medium flex items-center gap-2">Product Variants (Sizes, Colors, etc.)</h4>
                <p className="text-sm text-muted-foreground">Define different customizable options for this product.</p>
                
                {/* Variant Types List */}
                <div className={cn("space-y-6 border border-border p-4 rounded-lg")}>
                    {formData.variantTypes.map((vt) => (
                        <div key={vt.id} className={cn("p-4 bg-muted/20 rounded-md")}>
                            {/* Type Name Input: Full width on mobile */}
                            <div className="flex items-center gap-3 mb-4">
                                <Input 
                                    placeholder="Variant Type Name (e.g., Color, Size)"
                                    value={vt.name}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        variantTypes: prev.variantTypes.map(t => t.id === vt.id ? { ...t, name: e.target.value } : t)
                                    }))}
                                    className="font-semibold"
                                />
                                <Button variant="destructive" size="icon-sm" type="button" onClick={() => handleRemoveVariantType(vt.id)} className='flex-shrink-0'>
                                    <MinusCircle className="w-4 h-4" />
                                </Button>
                            </div>

                            {/* Options List */}
                            <div className="space-y-4"> {/* Increased space-y for mobile stacking */}
                                <Label className="text-sm font-medium block mb-2">Options for "{vt.name || 'Type'}"</Label>
                                {vt.options.map((opt) => (
                                    // CRITICAL CHANGE: Stacks elements vertically on mobile, uses flex on medium screens
                                    <div key={opt.id} className="flex flex-col md:flex-row items-stretch md:items-center gap-3 border p-3 rounded-md bg-card shadow-sm">
                                        
                                        {/* 1. Option Value (Full Width on mobile) */}
                                        <Input placeholder="Option Value (e.g., Red, Small)" value={opt.value} onChange={(e) => handleOptionChange(vt.id, opt.id, 'value', e.target.value)} className='flex-grow'/>
                                        
                                        {/* 2. Price Adjustment (Full Width on mobile) */}
                                        <div className="flex items-center w-full md:w-32 flex-shrink-0">
                                            <span className="text-sm text-muted-foreground mr-1">Adj:</span>
                                            <Input type="number" placeholder="+/- PKR" value={opt.priceAdjustment} onChange={(e) => handleOptionChange(vt.id, opt.id, 'priceAdjustment', e.target.value)}/>
                                        </div>
                                        
                                        {/* 3. Linked Media Selector (Full Width on mobile) */}
                                        <Select
                                            value={opt.linkedMediaId ? String(opt.linkedMediaId) : 'null'}
                                            onValueChange={(value) => handleOptionChange(vt.id, opt.id, 'linkedMediaId', value === 'null' ? null : Number(value))}
                                        >
                                            <SelectTrigger className="w-full md:w-[140px] h-9 flex-shrink-0">
                                                <ImageIcon className='w-4 h-4 mr-2' />
                                                <SelectValue placeholder="Link Media" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {formData.media.map((mediaItem, index) => (
                                                    <SelectItem key={mediaItem.id} value={String(mediaItem.id)}>
                                                        {mediaItem.type === 'video' ? `Video ${index + 1}` : `Image ${index + 1}`}
                                                    </SelectItem>
                                                ))}
                                                <SelectItem value="null">None</SelectItem>
                                            </SelectContent>
                                        </Select>

                                        {/* 4. Delete Button (Fixed size) */}
                                        <Button variant="destructive" size="icon-sm" type="button" onClick={() => handleRemoveVariantOption(vt.id, opt.id)} className='flex-shrink-0 self-start md:self-center'>
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}
                                <Button variant="outline" type="button" onClick={() => handleAddVariantOption(vt.id)} className="w-full mt-3">
                                    <PlusCircle className="w-4 h-4 mr-2" /> Add Option
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>

                <Button variant="outline" type="button" onClick={handleAddVariantType} className="text-red-600">
                    <PlusCircle className="w-4 h-4 mr-2" /> Add New Variant Type
                </Button>
            </div>


            <Button type="submit" disabled={loading} className="w-full sm:w-40 bg-red-600 hover:bg-red-700 text-white">
                <Save className='w-4 h-4 mr-2' />
                {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : productId ? (
                    "Save Changes"
                ) : (
                    "Create Product"
                )}
            </Button>
        </form>
    );
}