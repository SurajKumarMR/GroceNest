import { calculateOrderPricing, calculatePayout } from '../../utils/pricing';

describe('Pricing Math and Edge Cases', () => {
    it('should calculate subtotal correctly', () => {
        const items = [
            { unitPrice: 10.00, quantity: 2 },
            { unitPrice: 5.50, quantity: 4 }
        ];
        const result = calculateOrderPricing(items, { deliveryFee: 0, taxRate: 0, tipAmount: 0 });
        expect(result.subtotal).toBe(42.00);
        expect(result.totalAmount).toBe(42.00);
    });

    it('should apply delivery fee, tax, and tip', () => {
        const items = [{ unitPrice: 100.00, quantity: 1 }];
        // Subtotal: 100
        // Tax (8%): 8
        // Delivery: 2.99
        // Tip: 5
        // Expected: 115.99
        const result = calculateOrderPricing(items, { deliveryFee: 2.99, taxRate: 0.08, tipAmount: 5 });
        expect(result.subtotal).toBe(100.00);
        expect(result.taxAmount).toBe(8.00);
        expect(result.deliveryFee).toBe(2.99);
        expect(result.totalAmount).toBe(115.99);
    });

    it('should apply discount and prevent total from going below zero', () => {
        const items = [{ unitPrice: 10.00, quantity: 2 }];
        // Subtotal: 20
        // Delivery: 2.99
        // Tax (8%): 1.60
        // Discount: 5.00
        // Total: 20 + 2.99 + 1.60 - 5 = 19.59
        const result1 = calculateOrderPricing(items, { deliveryFee: 2.99, taxRate: 0.08, discountAmount: 5.00 });
        expect(result1.totalAmount).toBe(19.59);

        // Subtotal: 20
        // Discount: 50.00
        // Expected total: 0 (no negative totals allowed)
        const result2 = calculateOrderPricing(items, { deliveryFee: 2.99, taxRate: 0.08, discountAmount: 50.00 });
        expect(result2.totalAmount).toBe(0);
    });

    it('should handle zero price items', () => {
        const items = [{ unitPrice: 0, quantity: 10 }];
        const result = calculateOrderPricing(items, { deliveryFee: 0, taxRate: 0 });
        expect(result.subtotal).toBe(0);
        expect(result.totalAmount).toBe(0);
    });

    it('should handle zero items (empty basket) by setting delivery fee and tax to 0', () => {
        const result = calculateOrderPricing([], { deliveryFee: 2.99, taxRate: 0.08, tipAmount: 5.00 });
        expect(result.subtotal).toBe(0);
        expect(result.deliveryFee).toBe(0);
        expect(result.taxAmount).toBe(0);
        expect(result.totalAmount).toBe(5.00); // Only tip remains
    });

    it('should reject negative quantities', () => {
        const items = [
            { unitPrice: 10.00, quantity: 2 },
            { unitPrice: 5.00, quantity: -1 }
        ];
        expect(() => {
            calculateOrderPricing(items);
        }).toThrow('Quantity cannot be negative');
    });

    it('should reject negative unit prices', () => {
        const items = [{ unitPrice: -5.00, quantity: 2 }];
        expect(() => {
            calculateOrderPricing(items);
        }).toThrow('Price cannot be negative');
    });

    it('should reject negative discount amounts', () => {
        expect(() => {
            calculateOrderPricing([], { discountAmount: -5.00 });
        }).toThrow('Discount cannot be negative');
    });

    it('should round to 2 decimal places', () => {
        const items = [{ unitPrice: 10.333, quantity: 1 }];
        const result = calculateOrderPricing(items, { taxRate: 0.0825 });
        expect(result.taxAmount).toBe(0.85); // 10.333 * 0.0825 = 0.85247 -> 0.85
    });

    describe('Merchant Payouts', () => {
        it('should calculate 15% commission correctly', () => {
            const total = 100.00;
            const result = calculatePayout(total, 0.15);
            expect(result.commission).toBe(15.00);
            expect(result.netPayout).toBe(85.00);
        });

        it('should handle zero total', () => {
            const result = calculatePayout(0);
            expect(result.commission).toBe(0);
            expect(result.netPayout).toBe(0);
        });
    });
});
