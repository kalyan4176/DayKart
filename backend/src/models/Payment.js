import mongoose from 'mongoose';

const refundDetailSchema = new mongoose.Schema({
  refundId: { type: String, required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'success', 'failed'], default: 'pending' },
  reason: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const paymentSchema = new mongoose.Schema({
  paymentId: { type: String, required: true, unique: true },
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  gateway: { type: String, enum: ['stripe', 'razorpay', 'paypal', 'phonepe', 'paytm', 'cod'], required: true },
  gatewayTransactionId: { type: String },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  status: { type: String, enum: ['pending', 'success', 'failed', 'refunded'], default: 'pending' },
  refundDetails: [refundDetailSchema],
  webhookLogs: [mongoose.Schema.Types.Mixed],
  createdAt: { type: Date, default: Date.now },
});

paymentSchema.index({ order: 1 });
paymentSchema.index({ status: 1 });

const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;
