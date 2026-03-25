
import { calculateOrderPricing, calculatePayout } from '../../utils/pricing';

describe('Pricing Math', () => {
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

    it('should handle zero price items', () => {
        const items = [{ unitPrice: 0, quantity: 10 }];
        const result = calculateOrderPricing(items, { deliveryFee: 0, taxRate: 0 });
        expect(result.subtotal).toBe(0);
        expect(result.totalAmount).toBe(0);
    });

    it('should round to 2 decimal places', () => {
        const items = [{ unitPrice: 10.333, quantity: 1 }];
        const result = calculateOrderPricing(items, { taxRate: 0.0825 });
        expect(result.taxAmount).toBe(0.85);
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
