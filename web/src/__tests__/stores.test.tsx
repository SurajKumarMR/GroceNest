import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import StoresPage from '../app/stores/page';
import api from '../lib/api';

vi.mock('../lib/api', () => ({
    default: {
        get: vi.fn(),
    },
}));

vi.mock('next/image', () => ({
    default: ({ src, alt, ...props }: any) => <img src={src} alt={alt} {...props} />,
}));

vi.mock('@/components/layout/Header', () => ({
    Header: () => <div data-testid="mocked-header">Header</div>,
}));

describe('StoresPage Component rendering states', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders loading state first', async () => {
        // Mock API request to remain pending (unresolved promise)
        api.get = vi.fn().mockImplementation(() => new Promise(() => {}));

        render(<StoresPage />);

        // Skeletons should be displayed during loading
        const skeletons = screen.getAllByTestId('store-card-skeleton');
        expect(skeletons.length).toBeGreaterThan(0);
        expect(screen.queryByText('No stores found matching your search.')).not.toBeInTheDocument();
    });

    it('renders success state with stores listing', async () => {
        const mockStores = [
            {
                id: 'store-1',
                name: 'Fresh Market London',
                slug: 'fresh-market-london',
                description: 'Local organic groceries',
                coverPhotoUrl: '/cover1.jpg',
                averageRating: 4.8,
                cuisineTypes: ['Organic', 'Vegetarian'],
                deliveryRadiusKm: 5,
            },
            {
                id: 'store-2',
                name: 'Spice & Curry Store',
                slug: 'spice-curry-store',
                description: 'Spices and Asian food ingredients',
                coverPhotoUrl: '/cover2.jpg',
                averageRating: 4.5,
                cuisineTypes: ['Asian', 'Spices'],
                deliveryRadiusKm: 8,
            }
        ];

        api.get = vi.fn().mockResolvedValue({ data: mockStores });

        render(<StoresPage />);

        // Wait for loading state to resolve
        await waitFor(() => {
            expect(screen.getByText('Fresh Market London')).toBeInTheDocument();
        });

        expect(screen.getByText('Spice & Curry Store')).toBeInTheDocument();
        expect(screen.getByText('Organic')).toBeInTheDocument();
        expect(screen.getByText('Asian')).toBeInTheDocument();
    });

    it('renders empty state when no stores are returned', async () => {
        api.get = vi.fn().mockResolvedValue({ data: [] });

        render(<StoresPage />);

        await waitFor(() => {
            expect(screen.getByText('No stores found matching your search.')).toBeInTheDocument();
        });
    });

    it('renders error state on API failure', async () => {
        api.get = vi.fn().mockRejectedValue(new Error('Network error'));

        render(<StoresPage />);

        await waitFor(() => {
            expect(screen.getByText('Failed to load stores. Please try again later.')).toBeInTheDocument();
        });
    });
});
