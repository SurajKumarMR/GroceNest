
"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '@/lib/api';
import { Cart, CartItem } from '@/types';
import { useAuth } from './AuthContext';

interface CartContextType {
    cart: Cart | null;
    loading: boolean;
    addToCart: (productId: string, quantity: number, productVariantId?: string) => Promise<void>;
    removeFromCart: (itemId: string) => Promise<void>;
    updateQuantity: (itemId: string, quantity: number) => Promise<void>;
    refreshCart: () => Promise<void>;
    itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
    const { user } = useAuth();
    const [cart, setCart] = useState<Cart | null>(null);
    const [loading, setLoading] = useState(false);

    const refreshCart = async () => {
        if (!user) {
            setCart(null);
            return;
        }

        try {
            setLoading(true);
            const { data } = await api.get<Cart>('/cart');
            setCart(data);
        } catch (error) {
            console.error("Failed to fetch cart", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshCart();
    }, [user]);

    const addToCart = async (productId: string, quantity: number, productVariantId?: string) => {
        if (!user) return; // Or redirect to login
        try {
            await api.post('/cart/items', { productId, quantity, productVariantId });
            await refreshCart();
        } catch (error) {
            console.error("Add to cart failed", error);
            throw error;
        }
    };

    const removeFromCart = async (itemId: string) => {
        if (!user) return;
        try {
            await api.delete(`/cart/items/${itemId}`);
            await refreshCart();
        } catch (error) {
            console.error("Remove from cart failed", error);
            throw error;
        }
    };

    const updateQuantity = async (itemId: string, quantity: number) => {
        if (!user) return;
        try {
            await api.put(`/cart/items/${itemId}`, { quantity });
            await refreshCart();
        } catch (error) {
            console.error("Update quantity failed", error);
            throw error;
        }
    };

    const itemCount = cart?.items.reduce((acc, item) => acc + item.quantity, 0) || 0;

    return (
        <CartContext.Provider value={{ cart, loading, addToCart, removeFromCart, updateQuantity, refreshCart, itemCount }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};
