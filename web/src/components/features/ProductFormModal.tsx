
"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import api from "@/lib/api";

interface ProductFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    product?: any;
}

export function ProductFormModal({ isOpen, onClose, onSuccess, product }: ProductFormModalProps) {
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<any[]>([]);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        regularPrice: "",
        stockQuantity: "",
        categoryId: "",
        status: "active"
    });

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const { data } = await api.get("/products/categories");
            setCategories(data);
        } catch (error) {
            console.error("Fetch categories error:", error);
        }
    };

    useEffect(() => {
        if (product) {
            setFormData({
                name: product.name || "",
                description: product.description || "",
                regularPrice: product.regularPrice.toString() || "",
                stockQuantity: product.stockQuantity?.toString() || "0",
                categoryId: product.categoryId || "",
                status: product.status || "active"
            });
        } else {
            setFormData({
                name: "",
                description: "",
                regularPrice: "",
                stockQuantity: "0",
                categoryId: categories[0]?.id || "",
                status: "active"
            });
        }
        setImageFile(null);
    }, [product, isOpen, categories]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const data = {
                ...formData,
                regularPrice: parseFloat(formData.regularPrice),
                stockQuantity: parseInt(formData.stockQuantity)
            };

            let productId = product?.id;

            if (product) {
                await api.put(`/owner/products/${product.id}`, data);
            } else {
                const res = await api.post("/owner/products", data);
                productId = res.data.id;
            }

            // Handle image upload if a file is selected
            if (imageFile && productId) {
                const formDataImage = new FormData();
                formDataImage.append("product", imageFile);
                await api.post(`/owner/products/${productId}/image`, formDataImage, {
                    headers: { "Content-Type": "multipart/form-data" }
                });
            }

            onSuccess();
            onClose();
        } catch (error) {
            console.error("Save product error:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{product ? "Edit Product" : "Add New Product"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Product Name</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="category">Category</Label>
                            <select
                                id="category"
                                className="w-full h-10 px-3 bg-background border rounded-md text-sm focus:ring-2 focus:ring-primary outline-none"
                                value={formData.categoryId}
                                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                                required
                            >
                                <option value="" disabled>Select category</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="status">Status</Label>
                            <select
                                id="status"
                                className="w-full h-10 px-3 bg-background border rounded-md text-sm outline-none"
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            >
                                <option value="active">Active</option>
                                <option value="draft">Draft</option>
                                <option value="archived">Archived</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="image">Product Image</Label>
                        <Input
                            id="image"
                            type="file"
                            accept="image/*"
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setImageFile(e.target.files?.[0] || null)}
                            className="cursor-pointer"
                        />
                        {product?.images?.[0] && !imageFile && (
                            <p className="text-xs text-muted-foreground mt-1">Current image will be kept if none selected.</p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="price">Price ($)</Label>
                            <Input
                                id="price"
                                type="number"
                                step="0.01"
                                value={formData.regularPrice}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, regularPrice: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="stock">Stock</Label>
                            <Input
                                id="stock"
                                type="number"
                                value={formData.stockQuantity}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, stockQuantity: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {product ? "Save Changes" : "Create Product"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
