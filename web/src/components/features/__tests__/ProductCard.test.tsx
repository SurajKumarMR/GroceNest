
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProductCard } from '../ProductCard';
import { useCart } from '@/context/CartContext';
import { Product } from '@/types';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock useCart
vi.mock('@/context/CartContext', () => ({
    useCart: vi.fn(),
}));

// Mock Next.js Image
vi.mock('next/image', () => ({
    default: ({ src, alt, fill, className }: any) => (
        <img src={src} alt={alt} data-fill={fill?.toString()} className={className} />
    ),
}));

// Mock ProductDetailsModal to avoid deep rendering issues in simple unit test
vi.mock('../ProductDetailsModal', () => ({
    ProductDetailsModal: () => <div data-testid="product-details-modal" />,
}));

describe('ProductCard', () => {
    const mockProduct: Product = {
        id: '1',
        name: 'Test Product',
        regularPrice: 10,
        salePrice: 8,
        unit: '1 kg',
        images: [{ url: '/test-image.jpg' }],
        slug: 'test-product',
        storeId: 'store-1',
        stockQuantity: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
    } as any;

    const mockAddToCart = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (useCart as any).mockReturnValue({
            addToCart: mockAddToCart,
        });
    });

    it('renders product information correctly', () => {
        render(<ProductCard product={mockProduct} />);

        expect(screen.getByText('Test Product')).toBeInTheDocument();
        expect(screen.getByText('1 kg')).toBeInTheDocument();
        expect(screen.getByText('$8')).toBeInTheDocument();
        expect(screen.getByText('$10')).toBeInTheDocument(); // Regular price when sale exists
    });

    it('calls addToCart when the button is clicked', async () => {
        render(<ProductCard product={mockProduct} />);

        const addButton = screen.getByRole('button');
        fireEvent.click(addButton);

        expect(mockAddToCart).toHaveBeenCalledWith('1', 1);
    });

    it('shows loading state when adding to cart', async () => {
        // Make addToCart return a promise that doesn't resolve immediately
        let resolveAddToCart: any;
        const addToCartPromise = new Promise((resolve) => {
            resolveAddToCart = resolve;
        });
        mockAddToCart.mockReturnValue(addToCartPromise);

        render(<ProductCard product={mockProduct} />);

        const addButton = screen.getByRole('button');
        fireEvent.click(addButton);

        // Should show loading spinner (Loader2 has animate-spin)
        expect(addButton).toBeDisabled();

        // Resolve the promise
        resolveAddToCart();

        await waitFor(() => {
            expect(addButton).not.toBeDisabled();
        });
    });

    it('opens details modal when card is clicked', () => {
        render(<ProductCard product={mockProduct} />);

        const card = screen.getByText('Test Product').closest('.cursor-pointer');
        if (card) fireEvent.click(card);

        // We mocked ProductDetailsModal to render a div with testid
        expect(screen.getByTestId('product-details-modal')).toBeInTheDocument();
    });
});
