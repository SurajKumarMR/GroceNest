import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import RegisterPage from '../app/(auth)/register/page';
import { AddressManager } from '../components/features/AddressManager';
import CheckoutPage from '../app/checkout/page';
import api from '../lib/api';
import React from 'react';

vi.mock('../lib/api', () => ({
    default: {
        get: vi.fn(),
        post: vi.fn(),
    },
}));

vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: vi.fn(),
    }),
}));

vi.mock('next/image', () => ({
    default: ({ src, alt, ...props }: any) => <img src={src} alt={alt} {...props} />,
}));

vi.mock('../context/AuthContext', () => ({
    useAuth: () => ({
        login: vi.fn(),
        user: { userId: 'user-123', email: 'test@example.com' },
        isAuthenticated: true,
    }),
}));

vi.mock('../context/CartContext', () => ({
    useCart: () => ({
        cart: { id: 'cart-1', items: [] },
        refreshCart: vi.fn(),
        itemCount: 0,
    }),
}));

describe('Client-Side Form Validation Parity', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        api.get = vi.fn().mockResolvedValue({ data: [] });
    });

    describe('Registration Form Validation', () => {
        it('shows error if firstName is too short (< 2)', async () => {
            render(<RegisterPage />);
            
            const firstNameInput = screen.getByLabelText(/First Name/i);
            const lastNameInput = screen.getByLabelText(/Last Name/i);
            const emailInput = screen.getByLabelText(/Email/i);
            const passwordInput = screen.getByLabelText(/Password/i);
            const submitBtn = screen.getByRole('button', { name: /Sign up/i });

            fireEvent.change(firstNameInput, { target: { value: 'A' } });
            fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
            fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
            fireEvent.change(passwordInput, { target: { value: 'Pass123!' } });
            fireEvent.click(submitBtn);

            expect(screen.getByText('First name must be at least 2 characters long')).toBeInTheDocument();
            expect(api.post).not.toHaveBeenCalled();
        });

        it('shows error if password does not meet complexity requirements', async () => {
            render(<RegisterPage />);
            
            const firstNameInput = screen.getByLabelText(/First Name/i);
            const lastNameInput = screen.getByLabelText(/Last Name/i);
            const emailInput = screen.getByLabelText(/Email/i);
            const passwordInput = screen.getByLabelText(/Password/i);
            const submitBtn = screen.getByRole('button', { name: /Sign up/i });

            // Set valid fields except password
            fireEvent.change(firstNameInput, { target: { value: 'John' } });
            fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
            fireEvent.change(emailInput, { target: { value: 'john@example.com' } });

            // Password < 8 characters
            fireEvent.change(passwordInput, { target: { value: 'Ab1!' } });
            fireEvent.click(submitBtn);
            expect(screen.getByText('Password must be at least 8 characters long')).toBeInTheDocument();

            // Password missing uppercase
            fireEvent.change(passwordInput, { target: { value: 'ab1!cdef' } });
            fireEvent.click(submitBtn);
            expect(screen.getByText('Password must contain at least one uppercase letter')).toBeInTheDocument();

            // Password missing number
            fireEvent.change(passwordInput, { target: { value: 'Ab!cdefg' } });
            fireEvent.click(submitBtn);
            expect(screen.getByText('Password must contain at least one number')).toBeInTheDocument();

            // Password missing special character
            fireEvent.change(passwordInput, { target: { value: 'Ab1cdefg' } });
            fireEvent.click(submitBtn);
            expect(screen.getByText('Password must contain at least one special character')).toBeInTheDocument();

            expect(api.post).not.toHaveBeenCalled();
        });

        it('shows error if phone number is not valid UK format', async () => {
            render(<RegisterPage />);
            
            const firstNameInput = screen.getByLabelText(/First Name/i);
            const lastNameInput = screen.getByLabelText(/Last Name/i);
            const emailInput = screen.getByLabelText(/Email/i);
            const passwordInput = screen.getByLabelText(/Password/i);
            const phoneInput = screen.getByLabelText(/Phone Number/i);
            const submitBtn = screen.getByRole('button', { name: /Sign up/i });

            fireEvent.change(firstNameInput, { target: { value: 'John' } });
            fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
            fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
            fireEvent.change(passwordInput, { target: { value: 'Pass123!' } });
            
            // US phone number instead of UK +44xxxxxxxxxx
            fireEvent.change(phoneInput, { target: { value: '+15551234567' } });
            fireEvent.click(submitBtn);

            expect(screen.getByText('Invalid UK phone number format (+44xxxxxxxxxx)')).toBeInTheDocument();
            expect(api.post).not.toHaveBeenCalled();
        });
    });

    describe('Address Creation Validation (AddressManager)', () => {
        it('shows error if postcode is not valid UK format', async () => {
            render(<AddressManager />);

            // Open dialog
            const addBtn = await screen.findByRole('button', { name: /Add New/i });
            fireEvent.click(addBtn);

            // Fill form
            const streetInput = await screen.findByLabelText(/Street Address/i);
            const cityInput = screen.getByLabelText(/City/i);
            const stateInput = screen.getByLabelText(/State/i);
            const zipInput = screen.getByLabelText(/Zip Code/i);
            const submitBtn = screen.getByRole('button', { name: /Save/i });

            fireEvent.change(streetInput, { target: { value: '10 Downing St' } });
            fireEvent.change(cityInput, { target: { value: 'London' } });
            fireEvent.change(stateInput, { target: { value: 'Greater London' } });
            
            // Invalid US zip code
            fireEvent.change(zipInput, { target: { value: '90210' } });

            await act(async () => {
                fireEvent.click(submitBtn);
            });

            expect(screen.getByTestId('address-error').textContent).toContain('Invalid UK Postcode format (e.g. SW1A 1AA)');
            expect(api.post).not.toHaveBeenCalled();
        });

        it('submits successfully when correct UK postcode is provided', async () => {
            api.post = vi.fn().mockResolvedValue({ data: {} });
            render(<AddressManager />);

            const addBtn = await screen.findByRole('button', { name: /Add New/i });
            fireEvent.click(addBtn);

            const streetInput = await screen.findByLabelText(/Street Address/i);
            const cityInput = screen.getByLabelText(/City/i);
            const stateInput = screen.getByLabelText(/State/i);
            const zipInput = screen.getByLabelText(/Zip Code/i);
            const submitBtn = screen.getByRole('button', { name: /Save/i });

            fireEvent.change(streetInput, { target: { value: '10 Downing St' } });
            fireEvent.change(cityInput, { target: { value: 'London' } });
            fireEvent.change(stateInput, { target: { value: 'Greater London' } });
            
            // Valid UK postcode
            fireEvent.change(zipInput, { target: { value: 'SW1A 1AA' } });

            await act(async () => {
                fireEvent.click(submitBtn);
            });

            expect(screen.queryByTestId('address-error')).not.toBeInTheDocument();
            expect(api.post).toHaveBeenCalledWith('/users/addresses', {
                street: '10 Downing St',
                city: 'London',
                state: 'Greater London',
                zipCode: 'SW1A 1AA',
                country: 'United Kingdom',
                isDefault: false
            });
        });
    });

    describe('Address Creation Validation (CheckoutPage)', () => {
        it('shows error if postcode is not valid UK format', async () => {
            render(<CheckoutPage />);

            // Fill form
            const streetInput = await screen.findByLabelText(/Street Address/i);
            const cityInput = screen.getByLabelText(/City/i);
            const stateInput = screen.getByLabelText(/State/i);
            const zipInput = screen.getByLabelText(/Zip Code/i);
            const submitBtn = screen.getByRole('button', { name: /Save Address/i });

            fireEvent.change(streetInput, { target: { value: '10 Downing St' } });
            fireEvent.change(cityInput, { target: { value: 'London' } });
            fireEvent.change(stateInput, { target: { value: 'Greater London' } });
            
            // Invalid US zip code
            fireEvent.change(zipInput, { target: { value: '10001' } });

            await act(async () => {
                fireEvent.click(submitBtn);
            });

            expect(screen.getByTestId('checkout-address-error').textContent).toContain('Invalid UK Postcode format (e.g. SW1A 1AA)');
            expect(api.post).not.toHaveBeenCalled();
        });
    });
});
