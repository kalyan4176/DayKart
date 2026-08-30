import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  variantSku: { type: String },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller', required: true },
});

const statusTimelineSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['pending', 'placed', 'processed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned'],
    required: true,
  },
  timestamp: { type: Date, default: Date.now },
  message: { type: String },
});

const orderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [orderItemSchema],
  shippingAddress: {
    street: String,
    city: String,
    state: String,
    country: String,
    postalCode: String,
  },
  billingAddress: {
    street: String,
    city: String,
    state: String,
    country: String,
    postalCode: String,
  },
  pricing: {
    subtotal: { type: Number, required: true },
    shippingCharges: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, required: true },
    onlineAdvancePaid: { type: Number, default: 0 },
    cashOnDeliveryBalance: { type: Number, default: 0 },
  },
  payment: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
  coupon: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon' },
  status: {
    type: String,
    enum: ['pending', 'placed', 'processed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned'],
    default: 'pending',
  },
  statusTimeline: [statusTimelineSchema],
  tracking: {
    carrier: { type: String },
    trackingNumber: { type: String },
    estimatedDelivery: { type: Date },
  },
  deliveryPartner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  deliveryOtp: { type: String, default: null },
  preferredDeliveryDate: { type: Date },
}, {
  timestamps: true,
});

orderSchema.index({ customer: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ 'items.seller': 1 });
orderSchema.index({ createdAt: -1 });

const Order = mongoose.model('Order', orderSchema);
export default Order;
