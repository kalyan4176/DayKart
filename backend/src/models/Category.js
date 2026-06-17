import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  parentCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
  image: { type: String },
  description: { type: String },
  isActive: { type: Boolean, default: true },
}, {
  timestamps: true,
});

categorySchema.index({ parentCategory: 1 });

const Category = mongoose.model('Category', categorySchema);
export default Category;
