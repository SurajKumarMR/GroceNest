"use client";

import { useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import { Product } from '@/types';
import Image from 'next/image';
import dynamic from 'next/dynamic';

const ProductDetailsModal = dynamic(() => import('./ProductDetailsModal').then(m => m.ProductDetailsModal), {
    ssr: false
});

interface ProductCardProps {
    product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
    const { addToCart } = useCart();
    const [loading, setLoading] = useState(false);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    const handleAddToCart = async (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent opening modal
        setLoading(true);
        try {
            await addToCart(product.id, 1);
        } catch (error) {
            console.error("Failed to add to cart", error);
        } finally {
            setLoading(false);
        }
    };

    // Calculate discount
    const hasDiscount = product.salePrice && product.salePrice < product.regularPrice;
    const discountPercent = hasDiscount
        ? Math.round((1 - product.salePrice! / product.regularPrice) * 100)
        : 0;

    return (
        <>
            <Card
                className="overflow-hidden h-full flex flex-col border border-border/50 shadow-sm hover:shadow-md transition-shadow cursor-pointer group rounded-2xl"
                onClick={() => setIsDetailsOpen(true)}
            >
                <div className="relative h-48 w-full bg-[#f4ece3] flex items-center justify-center overflow-hidden p-6 rounded-t-2xl">
                    {hasDiscount && (
                        <div className="absolute top-3 left-3 bg-[#f97316] text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-10">
                            {discountPercent}% OFF
                        </div>
                    )}
                    
                    {product.images && product.images.length > 0 ? (
                        <Image
                            src={product.images[0].url}
                            alt={product.name}
                            fill
                            className="object-contain p-4 group-hover:scale-105 transition-transform duration-300 drop-shadow-md"
                        />
                    ) : (
                        <span className="text-6xl group-hover:scale-110 transition-transform drop-shadow-sm">🥦</span>
                    )}
                </div>

                <CardContent className="p-4 flex-grow flex flex-col justify-between bg-white relative">
                    <div className="space-y-1 mb-6">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-80 tracking-wider">
                            BRAND
                        </span>
                        <h3 className="font-bold text-[15px] leading-tight text-foreground line-clamp-2">{product.name}</h3>
                        {product.unit && (
                            <p className="text-xs text-muted-foreground font-medium mt-0.5">{product.unit}</p>
                        )}
                    </div>

                    <div className="flex items-end justify-between">
                        <div className="flex items-center gap-2">
                            {hasDiscount ? (
                                <>
                                    <span className="font-bold text-[#5c7736] text-lg">
                                        {product.salePrice % 1 === 0 ? `$${product.salePrice}` : `$${product.salePrice?.toFixed(2)}`}
                                    </span>
                                    <span className="text-xs text-muted-foreground line-through font-medium">
                                        {product.regularPrice % 1 === 0 ? `$${product.regularPrice}` : `$${product.regularPrice.toFixed(2)}`}
                                    </span>
                                </>
                            ) : (
                                <span className="font-bold text-[#5c7736] text-lg">
                                    {product.regularPrice % 1 === 0 ? `$${product.regularPrice}` : `$${product.regularPrice.toFixed(2)}`}
                                </span>
                            )}
                        </div>

                        <Button
                            size="icon"
                            className="h-9 w-9 rounded-full bg-[#5c7736] hover:bg-[#465c2a] text-white shadow-sm flex-shrink-0"
                            onClick={handleAddToCart}
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-5 w-5" />}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <ProductDetailsModal
                product={product}
                open={isDetailsOpen}
                onOpenChange={setIsDetailsOpen}
            />
        </>
    );
}
