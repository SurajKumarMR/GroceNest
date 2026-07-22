
"use client";

import { useCart } from "@/context/CartContext";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Plus, Minus, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Loader2 } from "lucide-react";

export function CartSheet() {
    const { cart, itemCount, addToCart, removeFromCart, updateQuantity } = useCart();
    const [loadingItemId, setLoadingItemId] = useState<string | null>(null);

    const handleUpdateQuantity = async (productId: string, currentQty: number, change: number, itemId: string) => {
        setLoadingItemId(itemId);
        try {
            const nextQty = currentQty + change;
            if (nextQty <= 0) {
                await removeFromCart(itemId);
            } else {
                await updateQuantity(itemId, nextQty);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingItemId(null);
        }
    };

    const calculateTotal = () => {
        if (!cart) return 0;
        return cart.items.reduce((total, item) => {
            const price = item.product.salePrice || item.product.regularPrice;
            return total + (price * item.quantity);
        }, 0);
    };

    return (
        <Sheet>
            <SheetTrigger>
                <div className="relative p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer">
                    <ShoppingCart className="h-6 w-6" />
                    {itemCount > 0 && (
                        <span className="absolute top-0 right-0 h-4 w-4 bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center rounded-full">
                            {itemCount}
                        </span>
                    )}
                </div>
            </SheetTrigger>
            <SheetContent>
                <SheetHeader>
                    <SheetTitle>Your Cart ({itemCount})</SheetTitle>
                </SheetHeader>

                <div className="flex flex-col h-full pt-6">
                    <div className="flex-1 overflow-y-auto -mx-6 px-6 space-y-4">
                        {cart && cart.items.length > 0 ? (
                            cart.items.map((item) => (
                                <div key={item.id} className="flex gap-4 py-4 border-b">
                                    <div className="relative h-20 w-20 bg-slate-100 rounded-md overflow-hidden flex-shrink-0">
                                        {item.product.images && item.product.images.length > 0 && (
                                            <Image src={item.product.images[0].url} alt={item.product.name} fill className="object-cover" />
                                        )}
                                    </div>
                                    <div className="flex-1 flex flex-col justify-between">
                                        <div>
                                            <h4 className="font-medium text-sm line-clamp-2">{item.product.name}</h4>
                                            <p className="text-xs text-muted-foreground">{item.product.unit}</p>
                                        </div>
                                        <div className="flex items-center justify-between mt-2">
                                            <span className="font-bold text-sm">
                                                ${((item.product.salePrice || item.product.regularPrice) * item.quantity).toFixed(2)}
                                            </span>

                                            <div className="flex items-center gap-2">
                                                {/* Decrease - ONLY REMOVE FOR MVP IF 1 */}
                                                <Button
                                                    variant="outline" size="icon" className="h-6 w-6"
                                                    onClick={() => handleUpdateQuantity(item.productId, item.quantity, -1, item.id)}
                                                    disabled={!!loadingItemId}
                                                >
                                                    <Minus className="h-3 w-3" />
                                                </Button>
                                                <span className="text-xs w-4 text-center">{item.quantity}</span>
                                                <Button
                                                    variant="outline" size="icon" className="h-6 w-6"
                                                    onClick={() => handleUpdateQuantity(item.productId, item.quantity, 1, item.id)}
                                                    disabled={!!loadingItemId}
                                                >
                                                    <Plus className="h-3 w-3" />
                                                </Button>

                                                <Button
                                                    variant="ghost" size="icon" className="h-6 w-6 text-destructive ml-2"
                                                    onClick={() => removeFromCart(item.id)}
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center h-64 text-center space-y-4">
                                <ShoppingCart className="h-12 w-12 text-muted-foreground opacity-50" />
                                <p className="text-muted-foreground">Your cart is empty.</p>
                                <SheetTrigger asChild>
                                    <Button variant="link">Start Shopping</Button>
                                </SheetTrigger>
                            </div>
                        )}
                    </div>

                    <div className="pt-6 pb-6 border-t mt-auto">
                        <div className="flex items-center justify-between mb-4">
                            <span className="font-medium">Subtotal</span>
                            <span className="font-bold text-lg">${calculateTotal().toFixed(2)}</span>
                        </div>

                        <Link href="/checkout" className="w-full">
                            <Button className="w-full" size="lg" disabled={!cart || cart.items.length === 0}>
                                Proceed to Checkout
                            </Button>
                        </Link>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
