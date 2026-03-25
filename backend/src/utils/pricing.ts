
export interface PricingResult {
  subtotal: number;
  deliveryFee: number;
  taxAmount: number;
  totalAmount: number;
}

export const calculateOrderPricing = (
  items: { unitPrice: number; quantity: number }[],
  options: { deliveryFee?: number; taxRate?: number; tipAmount?: number } = {}
): PricingResult => {
  const { deliveryFee = 2.99, taxRate = 0.08, tipAmount = 0 } = options;

  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const taxAmount = subtotal * taxRate;
  const totalAmount = subtotal + deliveryFee + taxAmount + tipAmount;

  return {
    subtotal: parseFloat(subtotal.toFixed(2)),
    deliveryFee: parseFloat(deliveryFee.toFixed(2)),
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
