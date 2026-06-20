import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  description: { type: String },
  discountType: { type: String, enum: ['flat', 'percentage', 'bogo', 'free_shipping'], required: true },
  discountValue: { type: Number, required: true },
  minOrderValue: { type: Number, default: 0 },
  maxDiscount: { type: Number },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller', default: null },
  scope: { type: String, enum: ['seller', 'platform'], default: 'platform' },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  usageLimit: { type: Number },
  usedCount: { type: Number, default: 0 },
  userLimit: { type: Number, default: 1 },
  active: { type: Boolean, default: true },
  firstNOrders: { type: Number, default: 0 },
  isRandomPool: { type: Boolean, default: false },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, {
  timestamps: true,
});

couponSchema.index({ active: 1, endDate: 1 });
couponSchema.index({ seller: 1 });

const Coupon = mongoose.model('Coupon', couponSchema);
export default Coupon;
