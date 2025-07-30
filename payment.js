const stripe = require('stripe')('sk_test_PLACEHOLDER_KEY_DO_NOT_USE');
const crypto = require('crypto');

// 🚨 VULNERABILITY 1: Direct price manipulation from client
async function processPayment(paymentData) {
  const { amount, currency, productId, userId } = paymentData;
  
  // Trusting amount from client without server-side validation
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount, // Client-controlled amount!
    currency: currency,
    metadata: {
      productId,
      userId
    }
  });
  
  return paymentIntent;
}

// 🚨 VULNERABILITY 2: Missing amount validation
function calculateTotal(items) {
  let total = 0;
  
  for (const item of items) {
    // No validation of item.price - could be negative
    total += item.quantity * item.price;
  }
  
  // No minimum amount check
  return total;
}

// 🚨 VULNERABILITY 3: Discount code manipulation
function applyDiscount(originalAmount, discountCode, userId) {
  const discounts = {
    'SAVE10': 0.10,
    'SAVE20': 0.20,
    'ADMIN50': 0.50, // Privileged discount code
    'FREE100': 1.00  // 100% discount
  };
  
  const discountRate = discounts[discountCode];
  
  if (discountRate) {
    // No user authorization check for privileged discounts
    // No usage limit check
    const discountAmount = originalAmount * discountRate;
    return originalAmount - discountAmount;
  }
  
  return originalAmount;
}

// 🚨 VULNERABILITY 4: Currency manipulation
function convertCurrency(amount, fromCurrency, toCurrency, exchangeRates) {
  // No validation of exchange rates - could be manipulated
  const rate = exchangeRates[`${fromCurrency}_${toCurrency}`];
  
  if (!rate) {
    // Fallback to 1:1 rate - dangerous!
    return amount;
  }
  
  return amount * rate;
}

// 🚨 VULNERABILITY 5: Refund amount manipulation
async function processRefund(orderId, refundAmount, reason) {
  // No validation that refundAmount <= original payment
  // No authorization check
  
  try {
    const refund = await stripe.refunds.create({
      amount: refundAmount, // Could be more than original payment!
      reason: reason,
      metadata: {
        orderId: orderId
      }
    });
    
    return { success: true, refundId: refund.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// 🚨 VULNERABILITY 6: Payment method storage without encryption
function storePaymentMethod(userId, cardDetails) {
  const paymentMethods = {
    userId: userId,
    cardNumber: cardDetails.number, // Storing in plain text!
    expiryMonth: cardDetails.exp_month,
    expiryYear: cardDetails.exp_year,
    cvv: cardDetails.cvc, // Storing CVV - PCI violation!
    createdAt: new Date()
  };
  
  // Save to database (in plain text)
  console.log('Storing payment method:', paymentMethods);
  return { success: true, id: crypto.randomBytes(16).toString('hex') };
}

// 🚨 VULNERABILITY 7: Business logic bypass - negative quantities
function calculateOrderTotal(cart) {
  let subtotal = 0;
  let shipping = 10; // Fixed shipping
  let tax = 0;
  
  for (const item of cart.items) {
    // No validation - negative quantities can reduce total
    const itemTotal = item.price * item.quantity;
    subtotal += itemTotal;
  }
  
  // Tax calculation allows manipulation
  tax = subtotal * (cart.taxRate || 0);
  
  const total = subtotal + shipping + tax;
  
  // No minimum total validation
  return {
    subtotal,
    shipping,
    tax,
    total: total < 0 ? 0 : total // Allows zero-dollar orders
  };
}

// 🚨 VULNERABILITY 8: Subscription price manipulation
function createSubscription(userId, planId, customPrice) {
  const plans = {
    'basic': { price: 999, features: ['basic'] },
    'premium': { price: 1999, features: ['basic', 'premium'] },
    'enterprise': { price: 4999, features: ['basic', 'premium', 'enterprise'] }
  };
  
  const plan = plans[planId];
  if (!plan) {
    return { error: 'Invalid plan' };
  }
  
  // Using custom price instead of plan price - manipulation possible
  const subscriptionPrice = customPrice || plan.price;
  
  return {
    userId,
    planId,
    price: subscriptionPrice,
    features: plan.features,
    createdAt: new Date()
  };
}

module.exports = {
  processPayment,
  calculateTotal,
  applyDiscount,
  convertCurrency,
  processRefund,
  storePaymentMethod,
  calculateOrderTotal,
  createSubscription
};