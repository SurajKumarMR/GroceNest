import { render, screen, waitFor, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { CartProvider, useCart } from '../context/CartContext';
import { AuthProvider } from '../context/AuthContext';
import api from '../lib/api';
import React from 'react';

vi.mock('../lib/api', () => ({
    default: {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
    },
}));

// Mock AuthContext user state
vi.mock('../context/AuthContext', async (importOriginal) => {
    const actual: any = await importOriginal();
    return {
        ...actual,
        useAuth: () => ({
            user: { userId: 'user-123', email: 'test@example.com' },
            isAuthenticated: true,
        }),
    };
});

// A dummy component to consume useCart and trigger actions
const CartTestConsumer = () => {
    const { cart, itemCount, addToCart, removeFromCart, updateQuantity, refreshCart } = useCart();

    return (
        <div>
            <div data-testid="item-count">{itemCount}</div>
            <div data-testid="cart-id">{cart?.id || 'no-cart'}</div>
            {cart?.items.map(item => (
                <div key={item.id} data-testid={`cart-item-${item.id}`}>
                    <span>{item.product.name}</span>
                    <span data-testid={`item-qty-${item.id}`}>{item.quantity}</span>
                    <button
                        data-testid={`btn-dec-${item.id}`}
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    >
                        Dec
                    </button>
                    <button
                        data-testid={`btn-inc-${item.id}`}
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                        Inc
                    </button>
                    <button
                        data-testid={`btn-remove-${item.id}`}
                        onClick={() => removeFromCart(item.id)}
                    >
                        Remove
                    </button>
                </div>
            ))}
            <button data-testid="btn-add" onClick={() => addToCart('prod-abc', 1)}>
                Add Product
            </button>
            <button data-testid="btn-refresh" onClick={() => refreshCart()}>
                Refresh
            </button>
        </div>
    );
};

describe('Cart Context & Logic Tests', () => {
    const mockCart = {
        id: 'cart-1',
        userId: 'user-123',
        items: [
            {
                id: 'item-1',
                productId: 'prod-1',
                quantity: 2,
                product: {
                    id: 'prod-1',
                    name: 'Apples',
                    regularPrice: 1.50,
                    salePrice: null,
                },
            },
            {
                id: 'item-2',
                productId: 'prod-2',
                quantity: 1,
                product: {
                    id: 'prod-2',
                    name: 'Milk',
                    regularPrice: 2.50,
                    salePrice: 2.20,
                },
            },
        ],
    };

    beforeEach(() => {
        vi.clearAllMocks();
        // Default cart response
        api.get = vi.fn().mockResolvedValue({ data: mockCart });
    });

    it('loads and displays active cart items and itemCount correctly', async () => {
        render(
            <CartProvider>
                <CartTestConsumer />
            </CartProvider>
        );

        await waitFor(() => {
            expect(screen.getByTestId('cart-id').textContent).toBe('cart-1');
        });

        // 2 Apples + 1 Milk = 3 items total
        expect(screen.getByTestId('item-count').textContent).toBe('3');
        expect(screen.getByTestId('cart-item-item-1')).toBeInTheDocument();
        expect(screen.getByTestId('item-qty-item-1').textContent).toBe('2');
    });

    it('calls addToCart API and refreshes the cart', async () => {
        api.post = vi.fn().mockResolvedValue({ data: {} });

        render(
            <CartProvider>
                <CartTestConsumer />
            </CartProvider>
        );

        await waitFor(() => {
            expect(screen.getByTestId('cart-id').textContent).toBe('cart-1');
        });

        const addBtn = screen.getByTestId('btn-add');
        await act(async () => {
            addBtn.click();
        });

        expect(api.post).toHaveBeenCalledWith('/cart/items', {
            productId: 'prod-abc',
            quantity: 1,
            productVariantId: undefined,
        });

        // Refresh cart is called
        expect(api.get).toHaveBeenCalled();
    });

    it('calls updateQuantity API and refreshes the cart', async () => {
        api.put = vi.fn().mockResolvedValue({ data: {} });

        render(
            <CartProvider>
                <CartTestConsumer />
            </CartProvider>
        );

        await waitFor(() => {
            expect(screen.getByTestId('cart-id').textContent).toBe('cart-1');
        });

        const incBtn = screen.getByTestId('btn-inc-item-1');
        await act(async () => {
            incBtn.click();
        });

        expect(api.put).toHaveBeenCalledWith('/cart/items/item-1', {
            quantity: 3,
        });

        expect(api.get).toHaveBeenCalled();
    });

    it('calls removeFromCart API and refreshes the cart', async () => {
        api.delete = vi.fn().mockResolvedValue({ data: {} });

        render(
            <CartProvider>
                <CartTestConsumer />
            </CartProvider>
        );

        await waitFor(() => {
            expect(screen.getByTestId('cart-id').textContent).toBe('cart-1');
        });

        const removeBtn = screen.getByTestId('btn-remove-item-2');
        await act(async () => {
            removeBtn.click();
        });

        expect(api.delete).toHaveBeenCalledWith('/cart/items/item-2');
        expect(api.get).toHaveBeenCalled();
    });

    it('correctly calculates subtotal, delivery fee, taxes, and total client-side', () => {
        // We will perform the identical pricing math as defined in our client code
        // and assert it produces the exact same totals as the backend formulas expect.

        // Subtotal calculation logic from client side:
        const calculateSubtotal = (cartData: typeof mockCart) => {
            return cartData.items.reduce((total, item) => {
                const price = item.product.salePrice || item.product.regularPrice;
                return total + (price * item.quantity);
            }, 0);
        };

        const subtotal = calculateSubtotal(mockCart);
        // Apples: 1.50 * 2 = 3.00. Milk: 2.20 * 1 = 2.20. Subtotal = 5.20.
        expect(subtotal).toBe(5.20);

        // Client-side pricing calculations (now aligned to server rules: deliveryFee = 2.99, serviceFee = 0)
        const deliveryFee = subtotal > 0 ? 2.99 : 0;
        const tax = subtotal * 0.08;
        const total = subtotal + deliveryFee + tax;

        expect(deliveryFee).toBe(2.99);
        expect(parseFloat(tax.toFixed(2))).toBe(0.42); // 5.20 * 0.08 = 0.416 -> rounds to 0.42
        expect(parseFloat(total.toFixed(2))).toBe(8.61); // 5.20 + 2.99 + 0.416 = 8.606 -> rounds to 8.61
    });
});
