
"use client";

import { useState } from "react";
import Image from "next/image";
import { Minus, Plus, ShoppingCart, Loader2 } from "lucide-react";
import { Product } from "@/types";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface ProductDetailsModalProps {
    product: Product | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ProductDetailsModal({ product, open, onOpenChange }: ProductDetailsModalProps) {
    const { addToCart } = useCart();
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(false);

    if (!product) return null;

    const handleAddToCart = async () => {
        setLoading(true);
        try {
            await addToCart(product.id, quantity);
            onOpenChange(false);
            setQuantity(1); // Reset quantity
        } catch (error) {
            console.error("Failed to add to cart", error);
        } finally {
            setLoading(false);
        }
    };

    const incrementQuantity = () => setQuantity(q => q + 1);
    const decrementQuantity = () => setQuantity(q => Math.max(1, q - 1));

    const price = product.salePrice ?? product.regularPrice;
    const hasDiscount = !!product.salePrice;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] overflow-hidden p-0">
                <div className="grid grid-cols-1 md:grid-cols-2">
                    {/* Image Section */}
                    <div className="relative h-64 md:h-full min-h-[300px] bg-slate-100 dark:bg-slate-800">
                        {product.images?.[0] ? (
                            <Image
                                src={product.images[0].url}
                                alt={product.name}
                                fill
                                className="object-cover"
                            />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-6xl">
                                🧀
                            </div>
                        )}
                        {hasDiscount && (
                            <Badge className="absolute top-4 left-4 bg-destructive hover:bg-destructive">
                                Save ${(product.regularPrice - product.salePrice!).toFixed(2)}
                            </Badge>
                        )}
                    </div>

                    {/* Details Section */}
                    <div className="p-6 flex flex-col">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold">{product.name}</DialogTitle>
                            <DialogDescription className="text-sm">
                                {product.unit || "Each"}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="mt-4 flex-grow">
                            <p className="text-muted-foreground text-sm line-clamp-4">
                                {product.description || "High-quality product fresh from the store. Perfect for your daily needs."}
                            </p>

                            <div className="mt-6">
                                <span className="text-3xl font-bold text-primary">
                                    ${price.toFixed(2)}
                                </span>
                                {hasDiscount && (
                                    <span className="ml-2 text-lg text-muted-foreground line-through">
                                        ${product.regularPrice.toFixed(2)}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="mt-8 space-y-4">
                            <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-800 rounded-lg p-2">
                                <span className="text-sm font-medium px-2">Quantity</span>
                                <div className="flex items-center gap-4">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 rounded-full"
                                        onClick={decrementQuantity}
                                        disabled={quantity <= 1}
                                    >
                                        <Minus className="h-4 w-4" />
                                    </Button>
                                    <span className="font-bold w-4 text-center">{quantity}</span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 rounded-full"
                                        onClick={incrementQuantity}
                                    >
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            <Button
                                className="w-full h-12 text-lg gap-2"
                                onClick={handleAddToCart}
                                disabled={loading}
                            >
                                {loading ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <>
                                        <ShoppingCart className="h-5 w-5" />
                                        Add to Cart - ${(price * quantity).toFixed(2)}
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
