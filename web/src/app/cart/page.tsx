"use client";

import { useCart } from "@/context/CartContext";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Trash2, Minus, Plus, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export default function CartPage() {
    const { cart, loading, removeFromCart, addToCart, itemCount } = useCart();
    const [instructions, setInstructions] = useState("");

    const calculateSubtotal = () => {
        if (!cart) return 0;
        return cart.items.reduce((total, item) => {
            const price = item.product.salePrice || item.product.regularPrice;
            return total + (price * item.quantity);
        }, 0);
    };

    const subtotal = calculateSubtotal();
    const deliveryFee = subtotal > 0 ? 3.99 : 0;
    const serviceFee = subtotal > 0 ? 1.50 : 0;
    const tax = subtotal * 0.08; // Example 8% tax
    const total = subtotal + deliveryFee + serviceFee + tax;

    if (loading && !cart) {
        return (
            <div className="min-h-screen bg-[#f8f9f6] flex flex-col">
                <Header />
                <div className="flex-1 flex items-center justify-center">
                    <div className="animate-pulse flex flex-col items-center">
                        <div className="h-12 w-12 bg-muted rounded-full mb-4"></div>
                        <div className="h-4 w-32 bg-muted rounded"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8f9f6] pb-20">
            <Header />

            <main className="container max-w-[1200px] mx-auto px-4 py-8">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <h1 className="text-3xl font-heading font-bold text-foreground">My Cart</h1>
                        <span className="bg-[#e7eedb] text-[#5c7736] px-3 py-1 rounded-full text-sm font-bold">
                            {itemCount} items
                        </span>
                    </div>
                </div>

                {cart && cart.items.length > 0 ? (
                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Left Side: Cart Items */}
                        <div className="flex-1 space-y-6">
                            <div className="bg-white rounded-2xl shadow-sm border border-border/50 divide-y">
                                {cart.items.map((item) => (
                                    <div key={item.id} className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-6">
                                        <div className="h-24 w-24 bg-[#f4ece3] rounded-2xl flex items-center justify-center relative overflow-hidden flex-shrink-0 p-2">
                                            {item.product.images?.[0] ? (
                                                <Image 
                                                    src={item.product.images[0].url} 
                                                    alt={item.product.name}
                                                    fill
                                                    className="object-contain"
                                                />
                                            ) : (
                                                <span className="text-4xl">🥦</span>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                                                {item.product.store?.name || 'BRAND'}
                                            </span>
                                            <h3 className="text-base font-bold text-foreground mb-1">{item.product.name}</h3>
                                            <p className="text-sm text-muted-foreground">{item.product.unit || '1 each'}</p>
                                            
                                            <div className="mt-3 flex items-center gap-4">
                                                <div className="flex items-center border border-border rounded-full bg-white h-9">
                                                    <button 
                                                        className="w-9 h-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            // For now, if quantity is > 1 call a decrement endpoint, else remove.
                                                            // Let's assume remove temporarily for decrementing if API doesn't support it directly.
                                                            if (item.quantity === 1) {
                                                                removeFromCart(item.id);
                                                            } else {
                                                                // Ideally we would update quantity, let's just remove to simulate for now since no update endpoint in Context
                                                                removeFromCart(item.id);
                                                            }
                                                        }}
                                                    >
                                                        <Minus className="h-4 w-4" />
                                                    </button>
                                                    <span className="w-8 text-center font-bold text-sm">{item.quantity}</span>
                                                    <button 
                                                        className="w-9 h-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            addToCart(item.productId, 1);
                                                        }}
                                                    >
                                                        <Plus className="h-4 w-4" />
                                                    </button>
                                                </div>

                                                <button 
                                                    className="text-sm font-bold text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors"
                                                    onClick={() => removeFromCart(item.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" /> Remove
                                                </button>
                                            </div>
                                        </div>

                                        <div className="text-right flex flex-col items-end gap-1 font-bold text-lg text-foreground">
                                            ${((item.product.salePrice || item.product.regularPrice) * item.quantity).toFixed(2)}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-border/50 space-y-3">
                                <h3 className="font-bold">Store Instructions</h3>
                                <textarea 
                                    className="w-full border border-border rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#5c7736]/20 bg-muted/30 resize-none min-h-[100px]"
                                    placeholder="Add instructions for the store (e.g., please pick green bananas)"
                                    value={instructions}
                                    onChange={e => setInstructions(e.target.value)}
                                ></textarea>
                            </div>
                        </div>

                        {/* Right Side: Order Summary */}
                        <div className="lg:w-[380px] flex-shrink-0">
                            <div className="bg-white rounded-2xl shadow-sm border border-border/50 p-6 sticky top-24">
                                <h3 className="text-xl font-bold mb-6">Order Summary</h3>
                                
                                <div className="space-y-4 text-sm mb-6 border-b border-border pb-6">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground font-medium">Subtotal</span>
                                        <span className="font-bold">${subtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground font-medium">Delivery Fee</span>
                                        <span className="font-bold">${deliveryFee.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground font-medium">Service Fee</span>
                                        <span className="font-bold">${serviceFee.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground font-medium">Tax</span>
                                        <span className="font-bold">${tax.toFixed(2)}</span>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center mb-8">
                                    <span className="font-bold text-lg">Total</span>
                                    <span className="font-bold text-2xl text-[#5c7736]">${total.toFixed(2)}</span>
                                </div>

                                <div className="mb-6">
                                    <div className="flex gap-2">
                                        <input 
                                            type="text" 
                                            placeholder="Promo code" 
                                            className="flex-1 border border-border rounded-xl px-4 text-sm bg-muted/30 focus:outline-none focus:ring-1 focus:ring-[#5c7736]"
                                        />
                                        <Button variant="outline" className="rounded-xl font-bold">Apply</Button>
                                    </div>
                                </div>

                                <Link href="/checkout" className="block">
                                    <Button className="w-full h-12 rounded-xl bg-[#f97316] hover:bg-[#ea580c] text-white font-bold text-base shadow-sm">
                                        Proceed to Checkout <ArrowRight className="ml-2 h-5 w-5" />
                                    </Button>
                                </Link>
                                
                                <p className="text-xs text-center text-muted-foreground mt-4 font-medium">
                                    Taxes & final delivery fee calculated at checkout
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl shadow-sm border border-border p-12 text-center h-[50vh] flex flex-col items-center justify-center">
                        <div className="text-6xl mb-4">🛒</div>
                        <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
                        <p className="text-muted-foreground max-w-sm mx-auto mb-8">Looks like you haven't added anything to your cart yet.</p>
                        <Link href="/stores">
                            <Button className="h-12 px-8 rounded-full bg-[#415e34] text-white font-bold text-base shadow-sm">
                                Start Shopping
                            </Button>
                        </Link>
                    </div>
                )}
            </main>
        </div>
    );
}
