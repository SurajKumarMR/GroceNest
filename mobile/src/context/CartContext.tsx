
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { cartApi } from '../services/api';
import { CartItem } from '../types';
import { useAuth } from './AuthContext';

interface CartContextData {
    cartItems: CartItem[];
    loading: boolean;
    total: number;
    addToCart: (productId: string, storeId: string, quantity: number) => Promise<void>;
    updateQuantity: (itemId: string, quantity: number) => Promise<void>;
    removeFromCart: (itemId: string) => Promise<void>;
    refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export const CartProvider = ({ children }: { children: ReactNode }) => {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(false);
    const { isAuthenticated } = useAuth();

    useEffect(() => {
        if (isAuthenticated) {
            refreshCart();
        } else {
            setCartItems([]);
        }
    }, [isAuthenticated]);

    const refreshCart = async () => {
        setLoading(true);
        try {
            const response = await cartApi.getCart();
            setCartItems(response.data.items || []);
        } catch (error) {
            console.error('Refresh cart error:', error);
        } finally {
            setLoading(false);
        }
    };

    const addToCart = async (productId: string, storeId: string, quantity: number) => {
        try {
            await cartApi.addToCart(productId, quantity, storeId);
            await refreshCart();
        } catch (error) {
            console.error('Add to cart error:', error);
            throw error;
        }
    };

    const updateQuantity = async (itemId: string, quantity: number) => {
        try {
            if (quantity <= 0) {
                await removeFromCart(itemId);
            } else {
                await cartApi.updateItem(itemId, quantity);
                await refreshCart();
            }
        } catch (error) {
            console.error('Update quantity error:', error);
            throw error;
        }
    };

    const removeFromCart = async (itemId: string) => {
        try {
            await cartApi.removeItem(itemId);
            await refreshCart();
        } catch (error) {
            console.error('Remove from cart error:', error);
            throw error;
        }
    };

    const total = cartItems.reduce((acc, item) => {
        return acc + (item.product.regularPrice * item.quantity);
    }, 0);

    return (
        <CartContext.Provider value={{
            cartItems,
            loading,
            total,
            addToCart,
            updateQuantity,
            removeFromCart,
            refreshCart
        }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);
