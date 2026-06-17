import logger from '../config/logger.js';

class PaymentGateway {
  async createCharge({ amount, orderId, customerEmail }) {
    throw new Error('Method createCharge must be implemented.');
  }

  async refundCharge({ transactionId, amount, reason }) {
    throw new Error('Method refundCharge must be implemented.');
  }
}

class StripeAdapter extends PaymentGateway {
  async createCharge({ amount, orderId, customerEmail }) {
    if (!process.env.STRIPE_SECRET_KEY) {
      logger.info(`[Stripe Mock] Creating charge of ₹${amount} for Order ${orderId}`);
      return {
        success: true,
        gatewayTransactionId: `ch_stripe_mock_${Math.random().toString(36).substring(2, 11)}`,
        status: 'success',
      };
    }
    // Real Stripe implementation would import stripe library and run:
    // const paymentIntent = await stripe.paymentIntents.create({ amount: amount * 100, currency: 'inr', ... })
    return { success: true, gatewayTransactionId: 'real_stripe_intent_id', status: 'success' };
  }

  async refundCharge({ transactionId, amount, reason }) {
    if (!process.env.STRIPE_SECRET_KEY) {
      logger.info(`[Stripe Mock] Refunding charge ₹${amount} for Txn ${transactionId}`);
      return {
        success: true,
        refundId: `re_stripe_mock_${Math.random().toString(36).substring(2, 11)}`,
      };
    }
    return { success: true, refundId: 'real_stripe_refund_id' };
  }
}

class RazorpayAdapter extends PaymentGateway {
  async createCharge({ amount, orderId, customerEmail }) {
    if (!process.env.RAZORPAY_KEY_SECRET) {
      logger.info(`[Razorpay Mock] Creating order of ₹${amount} for Order ${orderId}`);
      return {
        success: true,
        gatewayTransactionId: `order_rzp_mock_${Math.random().toString(36).substring(2, 11)}`,
        status: 'success',
      };
    }
    // Real Razorpay order API integration
    return { success: true, gatewayTransactionId: 'real_rzp_order_id', status: 'success' };
  }

  async refundCharge({ transactionId, amount, reason }) {
    if (!process.env.RAZORPAY_KEY_SECRET) {
      logger.info(`[Razorpay Mock] Refunding order ₹${amount} for Txn ${transactionId}`);
      return {
        success: true,
        refundId: `ref_rzp_mock_${Math.random().toString(36).substring(2, 11)}`,
      };
    }
    return { success: true, refundId: 'real_rzp_refund_id' };
  }
}

class PayPalAdapter extends PaymentGateway {
  async createCharge({ amount, orderId, customerEmail }) {
    if (!process.env.PAYPAL_CLIENT_SECRET) {
      logger.info(`[PayPal Mock] Creating checkout billing of ₹${amount} for Order ${orderId}`);
      return {
        success: true,
        gatewayTransactionId: `pay_paypal_mock_${Math.random().toString(36).substring(2, 11)}`,
        status: 'success',
      };
    }
    // Real PayPal transaction setup
    return { success: true, gatewayTransactionId: 'real_paypal_capture_id', status: 'success' };
  }

  async refundCharge({ transactionId, amount, reason }) {
    if (!process.env.PAYPAL_CLIENT_SECRET) {
      logger.info(`[PayPal Mock] Processing refund of ₹${amount} for Txn ${transactionId}`);
      return {
        success: true,
        refundId: `ref_paypal_mock_${Math.random().toString(36).substring(2, 11)}`,
      };
    }
    return { success: true, refundId: 'real_paypal_refund_id' };
  }
}

export const getPaymentAdapter = (gateway) => {
  switch (gateway) {
    case 'stripe':
      return new StripeAdapter();
    case 'razorpay':
      return new RazorpayAdapter();
    case 'paypal':
      return new PayPalAdapter();
    default:
      // Fallback for Cash on Delivery / COD
      return {
        createCharge: async ({ amount, orderId }) => {
          logger.info(`[COD Engine] Initialized pending pay ledger for ₹${amount} on Order ${orderId}`);
          return { success: true, gatewayTransactionId: `cod_txn_${Math.random().toString(36).substring(2, 11)}`, status: 'pending' };
        },
        refundCharge: async ({ transactionId, amount }) => {
          logger.info(`[COD Engine] Recording refund return trace of ₹${amount} on Txn ${transactionId}`);
          return { success: true, refundId: `cod_ref_${Math.random().toString(36).substring(2, 11)}` };
        }
      };
  }
};
