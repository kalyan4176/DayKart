import mongoose from 'mongoose';

const variantSchema = new mongoose.Schema({
  sku: { type: String, required: true },
  price: { type: Number, required: true },
  inventory: { type: Number, required: true, default: 0 },
  attributes: { type: Map, of: String }, // e.g. color: 'Red', size: 'M'
  images: [String],
});

const productSchema = new mongoose.Schema({
  sku: { type: String, required: true, unique: true, trim: true },
  barcode: { type: String, trim: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller', required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  brand: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand', required: true },
  price: { type: Number, required: true },
  compareAtPrice: { type: Number },
  images: [{ type: String, required: true }],
  videos: [{ type: String }],
  variants: [variantSchema],
  attributes: { type: Map, of: mongoose.Schema.Types.Mixed }, // Dynamic Attribute Engine
  inventory: {
    quantity: { type: Number, required: true, default: 0 },
    lowStockThreshold: { type: Number, default: 5 },
  },
  ratings: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 },
  },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  tags: [{ type: String }],
}, {
  timestamps: true,
});

// Primary indexes for product search, sorting, filtering
productSchema.index({ seller: 1 });
productSchema.index({ category: 1 });
productSchema.index({ brand: 1 });
productSchema.index({ price: 1 });
productSchema.index({ status: 1 });
productSchema.index({ 'ratings.average': -1 });
productSchema.index({ category: 1, status: 1, price: 1 });

const Product = mongoose.model('Product', productSchema);
export default Product;
