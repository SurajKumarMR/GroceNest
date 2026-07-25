import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { OrderTrackingScreen } from '../../src/screens/OrderTrackingScreen';

describe('OrderTrackingScreen Component Tests', () => {
  const mockNavigation = {
    goBack: jest.fn(),
    navigate: jest.fn(),
  };

  const mockRoute = {
    params: {
      orderId: 'ord-12345',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders order tracking ETA, driver info, and order status elements', async () => {
    await render(<OrderTrackingScreen navigation={mockNavigation} route={mockRoute} />);

    expect(screen.getByText('Estimated Arrival')).toBeTruthy();
    expect(screen.getByText('Arriving in 12 min')).toBeTruthy();
    expect(screen.getByText('Sarah')).toBeTruthy();
    expect(screen.getByText('Toyota Prius • ABC 123')).toBeTruthy();
    expect(screen.getByText('Order Packed')).toBeTruthy();
    expect(screen.getByText('Out for Delivery')).toBeTruthy();
    expect(screen.getByText('Arriving Soon')).toBeTruthy();
  });

  test('renders Call and Message driver buttons via icons', async () => {
    await render(<OrderTrackingScreen navigation={mockNavigation} route={mockRoute} />);

    expect(screen.getByTestId('icon-Phone')).toBeTruthy();
    expect(screen.getByTestId('icon-MessageCircle')).toBeTruthy();
  });
});
