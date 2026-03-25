
"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Edit, Trash2 } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

import { ProductFormModal } from "@/components/features/ProductFormModal";

export default function StoreInventoryPage() {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<any>(null);

    useEffect(() => {
        fetchInventory();
    }, []);

    const fetchInventory = async () => {
        setLoading(true);
        try {
            const storeRes = await api.get("/owner/my-store");
            const prodRes = await api.get(`/products?storeId=${storeRes.data.id}`);
            setProducts(prodRes.data);
        } catch (error) {
            console.error("Fetch inventory error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this product?")) {
            try {
                await api.delete(`/owner/products/${id}`);
                fetchInventory();
            } catch (error) {
                console.error("Delete product error:", error);
            }
        }
    };

    const handleEdit = (product: any) => {
        setSelectedProduct(product);
        setIsModalOpen(true);
    };

    const handleAdd = () => {
        setSelectedProduct(null);
        setIsModalOpen(true);
    };

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
                    <p className="text-muted-foreground mt-1">Manage your storefront products and stock.</p>
                </div>
                <Button className="gap-2" onClick={handleAdd}>
                    <Plus className="h-4 w-4" /> Add Product
                </Button>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Product</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead>Stock</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {products.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-48 text-muted-foreground">
                                        No products added yet.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                products.map((product) => (
                                    <TableRow key={product.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-muted rounded overflow-hidden">
                                                    {product.images?.[0] && (
                                                        <img src={product.images[0].url} alt="" className="w-full h-full object-cover" />
                                                    )}
                                                </div>
                                                <span className="font-medium">{product.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="capitalize">{product.category?.name || "Uncategorized"}</TableCell>
                                        <TableCell>${product.regularPrice.toFixed(2)}</TableCell>
                                        <TableCell>{product.stockQuantity}</TableCell>
                                        <TableCell>
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                                {product.status}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button size="icon" variant="ghost" onClick={() => handleEdit(product)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDelete(product.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <ProductFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchInventory}
                product={selectedProduct}
            />
        </div>
    );
}
