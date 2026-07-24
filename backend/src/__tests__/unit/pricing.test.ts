import { calculateOrderPricing, calculatePayout } from '../../utils/pricing';

describe('Pricing Utility (pricing.ts)', () => {
  describe('calculateOrderPricing', () => {
    it('should calculate pricing correctly for valid items and default options', () => {
      const items = [
        { unitPrice: 10.00, quantity: 2 },
        { unitPrice: 5.50, quantity: 1 }
      ];

      const result = calculateOrderPricing(items);

      expect(result.subtotal).toBe(25.50);
      expect(result.deliveryFee).toBe(2.99);
      expect(result.taxAmount).toBe(2.04); // 25.50 * 0.08 = 2.04
      expect(result.totalAmount).toBe(30.53); // 25.50 + 2.99 + 2.04
    });

    it('should calculate pricing with custom delivery fee, tax rate, tip, and discount', () => {
      const items = [
        { unitPrice: 20.00, quantity: 1 }
      ];

      const result = calculateOrderPricing(items, {
        deliveryFee: 5.00,
        taxRate: 0.10,
        tipAmount: 3.00,
        discountAmount: 2.00
      });

      expect(result.subtotal).toBe(20.00);
      expect(result.deliveryFee).toBe(5.00);
      expect(result.taxAmount).toBe(2.00); // 20 * 0.10
      expect(result.totalAmount).toBe(28.00); // 20 + 5 + 2 + 3 - 2 = 28
    });

    it('should handle zero items by setting delivery fee and tax to 0', () => {
      const result = calculateOrderPricing([]);

      expect(result.subtotal).toBe(0);
      expect(result.deliveryFee).toBe(0);
      expect(result.taxAmount).toBe(0);
      expect(result.totalAmount).toBe(0);
    });

    it('should not allow total amount to drop below 0 when discount exceeds total', () => {
      const items = [{ unitPrice: 5.00, quantity: 1 }];
      const result = calculateOrderPricing(items, { discountAmount: 100.00 });

      expect(result.totalAmount).toBe(0);
    });

    it('should throw error when any item has negative quantity', () => {
      const items = [{ unitPrice: 10.00, quantity: -1 }];
      expect(() => calculateOrderPricing(items)).toThrow('Quantity cannot be negative');
    });

    it('should throw error when any item has negative unit price', () => {
      const items = [{ unitPrice: -5.00, quantity: 1 }];
      expect(() => calculateOrderPricing(items)).toThrow('Price cannot be negative');
    });

    it('should throw error when discount amount is negative', () => {
      const items = [{ unitPrice: 10.00, quantity: 1 }];
      expect(() => calculateOrderPricing(items, { discountAmount: -5 })).toThrow('Discount cannot be negative');
    });
  });

  describe('calculatePayout', () => {
    it('should calculate payout using default 15% commission rate', () => {
      const result = calculatePayout(100.00);

      expect(result.commission).toBe(15.00);
      expect(result.netPayout).toBe(85.00);
    });

    it('should calculate payout with custom commission rate', () => {
      const result = calculatePayout(200.00, 0.20);

      expect(result.commission).toBe(40.00);
      expect(result.netPayout).toBe(160.00);
    });
  });
});
