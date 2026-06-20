import mongoose from 'mongoose';

const shippingRuleSchema = new mongoose.Schema({
  minCartValue: { type: Number, required: true, min: 0 },
  maxCartValue: { type: Number, default: null }, // null means no upper limit
  charge: { type: Number, required: true, min: 0 },
}, {
  timestamps: true,
});

const ShippingRule = mongoose.model('ShippingRule', shippingRuleSchema);
export default ShippingRule;
