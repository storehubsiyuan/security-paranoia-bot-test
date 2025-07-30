// VULNERABILITY: API keys in source code
const STRIPE_SECRET_KEY = 'sk_test_fake_key_for_testing_only';
const PAYPAL_CLIENT_SECRET = 'fake_paypal_secret_key_for_testing';

class PaymentService {
  // VULNERABILITY: Price manipulation
  static async processPayment(order) {
    const amount = order.total; // Trust client-provided total
    
    // VULNERABILITY: No transaction verification
    return {
      success: true,
      transactionId: Math.random().toString(36),
      amount: amount
    };
  }
  
  // VULNERABILITY: Double spending prevention
  static async refundPayment(transactionId, reason) {
    // No check if already refunded
    return {
      success: true,
      refundId: Math.random().toString(36),
      message: `Refunded: ${reason}`
    };
  }
  
  // VULNERABILITY: Insufficient logging
  static async transferFunds(fromAccount, toAccount, amount) {
    // No audit trail for financial transactions
    console.log('Transfer completed');
    return { success: true };
  }
}

// VULNERABILITY: Discount manipulation
function calculateDiscount(originalPrice, discountCode) {
  const discounts = {
    'SAVE10': 0.1,
    'SAVE20': 0.2,
    'ADMIN': 0.9 // Dangerous admin discount
  };
  
  // No validation of discount limits
  const discount = discounts[discountCode] || 0;
  return originalPrice * (1 - discount);
}

module.exports = {
  PaymentService,
  calculateDiscount
};