import api from './api';

// Create Razorpay order
export const createPaymentOrder = async (amount) => {
  try {
    const response = await api.post('/payment/create-order', { amount });
    return response.data;
  } catch (error) {
    console.error('Error creating payment order:', error);
    throw error;
  }
};

// Verify payment
export const verifyPayment = async (paymentData) => {
  try {
    const response = await api.post('/payment/verify', paymentData);
    return response.data;
  } catch (error) {
    console.error('Error verifying payment:', error);
    throw error;
  }
};

// Initialize Razorpay payment
export const initiateRazorpayPayment = (options, onSuccess, onFailure) => {
  const razorpayOptions = {
    key: options.keyId,
    amount: options.amount,
    currency: options.currency,
    name: 'LiveMART',
    description: 'Order Payment',
    order_id: options.orderId,
    handler: function (response) {
      onSuccess(response);
    },
    prefill: {
      name: options.customerName || '',
      email: options.customerEmail || '',
      contact: options.customerPhone || '',
    },
    theme: {
      color: '#3b82f6',
    },
    modal: {
      ondismiss: function() {
        onFailure('Payment cancelled by user');
      }
    }
  };

  const razorpay = new window.Razorpay(razorpayOptions);
  razorpay.open();
};