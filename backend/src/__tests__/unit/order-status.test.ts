
import { OrderStatus } from '@prisma/client';
import { isValidStatusTransition } from '../../utils/order-status';

describe('Order Status State Machine', () => {
    it('should allow valid transitions from PENDING', () => {
        expect(isValidStatusTransition(OrderStatus.PENDING, OrderStatus.CONFIRMED)).toBe(true);
        expect(isValidStatusTransition(OrderStatus.PENDING, OrderStatus.CANCELLED)).toBe(true);
    });

    it('should allow valid transitions from CONFIRMED', () => {
        expect(isValidStatusTransition(OrderStatus.CONFIRMED, OrderStatus.PREPARING)).toBe(true);
        expect(isValidStatusTransition(OrderStatus.CONFIRMED, OrderStatus.CANCELLED)).toBe(true);
    });

    it('should reject invalid transitions (e.g. DELIVERED to PREPARING)', () => {
        expect(isValidStatusTransition(OrderStatus.DELIVERED, OrderStatus.PREPARING)).toBe(false);
    });

    it('should reject transitions from CANCELLED', () => {
        expect(isValidStatusTransition(OrderStatus.CANCELLED, OrderStatus.CONFIRMED)).toBe(false);
    });

    it('should allow progression to DELIVERED from OUT_FOR_DELIVERY', () => {
        expect(isValidStatusTransition(OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED)).toBe(true);
    });

    it('should reject jumping statuses (e.g. PENDING to READY)', () => {
        expect(isValidStatusTransition(OrderStatus.PENDING, OrderStatus.READY)).toBe(false);
    });
});
