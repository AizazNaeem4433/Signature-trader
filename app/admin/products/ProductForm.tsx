// signature-trader/app/admin/products/ProductForm.tsx
"use client";

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, PlusCircle, Trash2, Image as ImageIcon, MinusCircle, Upload, Save, Star } from 'lucide-react'; 
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


// --- DATA INTERFACES ---
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
    cutPrice: number; 
    category_id: string;
    stock: number;
    isActive: boolean;
    isFeatured: boolean; // <-- NEW: Featured product flag
    variantTypes: VariantType[];
    media: ProductMedia[];
}

const initialProductState: ProductFormState = {
    name: '', shortDescription: '', detailedDescription: '', slug: '', basePrice: 0, cutPrice: 0, category_id: '',
    stock: 1, 
    isActive: true, 
    isFeatured: false, // <-- NEW: Default value
    variantTypes: [], 
    media: [],
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
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false); 

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
            
            const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${mediaType}/upload`; 

            const response = await fetch(uploadUrl, {
                method: 'POST',
                body: uploadFormData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || `HTTP Upload Failed with status: ${response.status}`);
            }

            const data = await response.json();

            setFormData(prev => ({
                ...prev,
                media: [...prev.media, { 
                    id: generateUniqueId(), 
                    url: data.secure_url, 
                    // --- FIX: Use file name as default alt text ---
                    alt: file.name.split('.')[0].replace(/_/g, ' '), 
                    type: mediaType as 'image' | 'video',
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
    
    // --- MEDIA/VARIANT HANDLERS ---
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
                cutPrice: Number(formData.cutPrice),
                stock: Number(formData.stock),
                isFeatured: formData.isFeatured, // <-- Ensure boolean is saved
                ...(productId ? {} : { createdAt: new Date() })
            };

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

            {/* General Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <Label htmlFor="name">Product Name *</Label>
                    <Input id="name" type="text" placeholder="Feather Quill Cutlery Set" required 
                            value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                </div>
                <div>
                    <Label htmlFor="slug">Product Slug (URL)</Label>
                    <Input id="slug" type="text" placeholder="auto-generated" 
                            value={formData.slug} onChange={(e) => setFormData({...formData, slug: e.target.value})} />
                </div>
            </div>

            {/* Price, Stock, Category, and Featured Status */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
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
                    <Label htmlFor="stock">Stock</Label>
                    <Input id="stock" type="number" min="0" required 
                            value={formData.stock} onChange={(e) => setFormData({...formData, stock: parseInt(e.target.value) || 0})} />
                </div>

                {/* --- NEW: IS FEATURED --- */}
                <div>
                    <Label htmlFor="isFeatured" className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500" /> Featured
                    </Label>
                    <Select
                        onValueChange={(value) => setFormData({...formData, isFeatured: value === 'true'})}
                        value={String(formData.isFeatured)}
                        required
                    >
                        <SelectTrigger id="isFeatured">
                            <SelectValue placeholder="Set featured status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="true">Yes, show on homepage</SelectItem>
                            <SelectItem value="false">No, hide from homepage</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Descriptions */}
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


            {/* Media/Image Section */}
            <div className={cn("border border-dashed border-border p-4 rounded-lg space-y-4")}>
                <h4 className="text-xl font-medium flex items-center gap-2">Product Media (Image & Video)</h4>
                
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload} 
                    style={{ display: 'none' }} 
                    accept="image/*,video/*" 
                />
                
                <Button type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto">
                    {isUploading ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...</>
                    ) : (
                        <><Upload className="w-4 h-4 mr-2" /> Upload Media (Image/Video)</>
                    )}
                </Button>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {formData.media.map((mediaItem) => (
                        <div key={mediaItem.id} className={cn("rounded-md border border-border overflow-hidden bg-card")}>
                            <div className="relative group aspect-square">
                                {mediaItem.type === 'video' ? (
                                    <video controls muted className="w-full h-full object-cover">
                                        <source src={mediaItem.url} type="video/mp4" />
                                    </video>
                                ) : (
                                    <img 
                                        src={mediaItem.url || '/placeholder.png'} 
                                        alt={mediaItem.alt} 
                                        className="w-full h-full object-cover" 
                                    />
                                )}
                                
                                <Button 
                                    variant="destructive" 
                                    size="icon-sm" 
                                    type="button" 
                                    onClick={() => handleRemoveMedia(mediaItem.id)} 
                                    className="absolute top-1 right-1 opacity-100"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>

                            {/* --- NEW: ALT TEXT INPUT --- */}
                            <div className="p-2">
                                <Label htmlFor={`alt-${mediaItem.id}`} className="text-xs text-muted-foreground">Alt Text (SEO)</Label>
                                <Input 
                                    id={`alt-${mediaItem.id}`}
                                    type="text" 
                                    placeholder="Describe the image (e.g., Golden cutlery set)" 
                                    value={mediaItem.alt}
                                    onChange={(e) => handleMediaChange(mediaItem.id, 'alt', e.target.value)}
                                    className="h-8 text-xs mt-1"
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Product Variants Section */}
            <div className={cn("border border-dashed border-border p-4 rounded-lg space-y-6")}>
                <h4 className="text-xl font-medium flex items-center gap-2">Product Variants (Sizes, Colors, etc.)</h4>
                
                <div className={cn("space-y-6 border border-border p-4 rounded-lg")}>
                    {formData.variantTypes.map((vt) => (
                        <div key={vt.id} className={cn("p-4 bg-muted/20 rounded-md")}>
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
                                <Button variant="destructive" size="icon-sm" type="button" onClick={() => handleRemoveVariantType(vt.id)} className='shrink-0'>
                                    <MinusCircle className="w-4 h-4" />
                                </Button>
                            </div>

                            <div className="space-y-4">
                                <Label className="text-sm font-medium block mb-2">Options for "{vt.name || 'Type'}"</Label>
                                {vt.options.map((opt) => (
                                    <div key={opt.id} className="flex flex-col md:flex-row items-stretch md:items-center gap-3 border p-3 rounded-md bg-card shadow-sm">
                                        
                                        <Input placeholder="Option Value (e.g., Red, Small)" value={opt.value} onChange={(e) => handleOptionChange(vt.id, opt.id, 'value', e.target.value)} className='grow'/>
                                        
                                        <div className="flex items-center w-full md:w-32 shrink-0">
                                            <span className="text-sm text-muted-foreground mr-1">Adj:</span>
                                            <Input type="number" placeholder="+/- PKR" value={opt.priceAdjustment} onChange={(e) => handleOptionChange(vt.id, opt.id, 'priceAdjustment', e.target.value)}/>
                                        </div>
                                        
                                        <Select
                                            value={opt.linkedMediaId ? String(opt.linkedMediaId) : 'null'}
                                            onValueChange={(value) => handleOptionChange(vt.id, opt.id, 'linkedMediaId', value === 'null' ? null : Number(value))}
                                        >
                                            <SelectTrigger className="w-full md:w-[140px] h-9 shrink-0">
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

                                        <Button variant="destructive" size="icon-sm" type="button" onClick={() => handleRemoveVariantOption(vt.id, opt.id)} className='shrink-0 self-start md:self-center'>
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