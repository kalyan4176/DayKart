import mongoose from 'mongoose';

const bankDetailsSchema = new mongoose.Schema({
  accountNumber: { type: String, required: true },
  ifsc: { type: String, required: true },
  bankName: { type: String, required: true },
  accountHolderName: { type: String, required: true },
});

const sellerSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  storeName: { type: String, required: true, unique: true, trim: true },
  storeDescription: { type: String },
  gstin: { type: String, required: true },
  pan: { type: String, required: true },
  bankDetails: { type: bankDetailsSchema, required: true },
  storeAddress: {
    street: String,
    city: String,
    state: String,
    country: String,
    postalCode: String,
  },
  logo: { type: String },
  banner: { type: String },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  revenue: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },
}, {
  timestamps: true,
});

sellerSchema.index({ status: 1 });

const Seller = mongoose.model('Seller', sellerSchema);
export default Seller;
