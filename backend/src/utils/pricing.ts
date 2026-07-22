export interface PricingResult {
  subtotal: number;
  deliveryFee: number;
  taxAmount: number;
  totalAmount: number;
}

export const calculateOrderPricing = (
  items: { unitPrice: number; quantity: number }[],
  options: { deliveryFee?: number; taxRate?: number; tipAmount?: number; discountAmount?: number } = {}
): PricingResult => {
  const { deliveryFee = 2.99, taxRate = 0.08, tipAmount = 0, discountAmount = 0 } = options;

  if (items.some(item => item.quantity < 0)) {
    throw new Error('Quantity cannot be negative');
  }

  if (items.some(item => item.unitPrice < 0)) {
    throw new Error('Price cannot be negative');
  }

  if (discountAmount < 0) {
    throw new Error('Discount cannot be negative');
  }

  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  
  // If there are no items, delivery fee and tax should be 0
  const finalDeliveryFee = items.length === 0 ? 0 : deliveryFee;
  const taxAmount = subtotal * taxRate;
  
  // Total must not go below 0
  const totalAmount = Math.max(0, subtotal + finalDeliveryFee + taxAmount + tipAmount - discountAmount);

  return {
    subtotal: parseFloat(subtotal.toFixed(2)),
    deliveryFee: parseFloat(finalDeliveryFee.toFixed(2)),
    taxAmount: parseFloat(taxAmount.toFixed(2)),
    totalAmount: parseFloat(totalAmount.toFixed(2)),
  };
};

export const calculatePayout = (
  totalAmount: number,
  commissionRate: number = 0.15 // 15% default platform fee
): { commission: number; netPayout: number } => {
  const commission = totalAmount * commissionRate;
  const netPayout = totalAmount - commission;

  return {
    commission: parseFloat(commission.toFixed(2)),
    netPayout: parseFloat(netPayout.toFixed(2)),
  };
};
