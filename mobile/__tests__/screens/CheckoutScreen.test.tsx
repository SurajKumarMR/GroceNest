import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { CheckoutScreen } from '../../src/screens/CheckoutScreen';
import api, { orderApi } from '../../src/services/api';

const mockRefreshCart = jest.fn();
const mockGoBack = jest.fn();
const mockNavigate = jest.fn();

jest.mock('../../src/context/CartContext', () => ({
  useCart: () => ({
    cartItems: [
      { id: '1', name: 'Fresh Apples', price: 4.99, quantity: 2 },
      { id: '2', name: 'Organic Milk', price: 3.5, quantity: 1 },
    ],
    total: 13.48,
    refreshCart: mockRefreshCart,
  }),
}));

jest.mock('../../src/services/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
  },
  orderApi: {
    placeOrder: jest.fn(),
  },
}));

const mockInitPaymentSheet = jest.fn();
const mockPresentPaymentSheet = jest.fn();

jest.mock('@stripe/stripe-react-native', () => ({
  useStripe: () => ({
    initPaymentSheet: mockInitPaymentSheet,
    presentPaymentSheet: mockPresentPaymentSheet,
    confirmPayment: jest.fn(),
    createPaymentMethod: jest.fn(),
  }),
  StripeProvider: ({ children }: any) => children,
  CardField: () => null,
}));

describe('CheckoutScreen Payment Tests', () => {
  const mockNavigation = {
    goBack: mockGoBack,
    navigate: mockNavigate,
  };

  const mockAddresses = [
    {
      id: 'addr-1',
      streetAddress: '123 Main St',
      city: 'San Francisco',
      state: 'CA',
      postalCode: '94105',
      isDefault: true,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (api.get as jest.Mock).mockResolvedValue({ data: mockAddresses });
  });

  test('renders delivery address and payment section', async () => {
    await render(<CheckoutScreen navigation={mockNavigation} />);

    expect(await screen.findByText('123 Main St')).toBeTruthy();
    expect(screen.getByText('Delivery Address')).toBeTruthy();
    expect(screen.getByText('Payment Method')).toBeTruthy();
    expect(screen.getByText('Summary')).toBeTruthy();
    expect(screen.getByText('Place Order')).toBeTruthy();
  });

  test('executes Stripe payment sheet flow on placing order', async () => {
    (orderApi.placeOrder as jest.Mock).mockResolvedValueOnce({
      order: { id: 'order-999', total: 13.48 },
    });
    (api.post as jest.Mock).mockResolvedValueOnce({
      data: { clientSecret: 'pi_mock_secret_123' },
    });
    mockInitPaymentSheet.mockResolvedValueOnce({ error: null });
    mockPresentPaymentSheet.mockResolvedValueOnce({ error: null });

    await render(<CheckoutScreen navigation={mockNavigation} />);

    await screen.findByText('123 Main St');

    fireEvent.press(screen.getByText('Place Order'));

    await waitFor(() => {
      expect(orderApi.placeOrder).toHaveBeenCalledWith({
        paymentMethod: 'CARD',
        deliveryAddressId: 'addr-1',
      });
      expect(api.post).toHaveBeenCalledWith('/payments/init', { orderId: 'order-999' });
      expect(mockInitPaymentSheet).toHaveBeenCalledWith({
        paymentIntentClientSecret: 'pi_mock_secret_123',
        merchantDisplayName: 'GroceNest',
      });
      expect(mockPresentPaymentSheet).toHaveBeenCalled();
    });
  });

  test('handles Stripe payment cancellation gracefully', async () => {
    (orderApi.placeOrder as jest.Mock).mockResolvedValueOnce({
      order: { id: 'order-999', total: 13.48 },
    });
    (api.post as jest.Mock).mockResolvedValueOnce({
      data: { clientSecret: 'pi_mock_secret_123' },
    });
    mockInitPaymentSheet.mockResolvedValueOnce({ error: null });
    mockPresentPaymentSheet.mockResolvedValueOnce({
      error: { code: 'Canceled', message: 'User canceled payment' },
    });

    await render(<CheckoutScreen navigation={mockNavigation} />);

    await screen.findByText('123 Main St');

    fireEvent.press(screen.getByText('Place Order'));

    await waitFor(() => {
      expect(mockPresentPaymentSheet).toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalledWith('OrderSuccessScreen', expect.anything());
    });
  });
});
