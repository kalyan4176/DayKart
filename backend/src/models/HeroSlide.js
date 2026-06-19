import mongoose from 'mongoose';

const heroSlideSchema = new mongoose.Schema({
  tagline: { type: String, required: true },
  title: { type: String, required: true },
  titleAccent: { type: String, required: true },
  description: { type: String, required: true },
  ctaText: { type: String, required: true },
  ctaLink: { type: String, required: true },
  secondaryCtaText: { type: String, default: '' },
  secondaryCtaLink: { type: String, default: '' },
  categoryName: { type: String, default: '' },
  categorySlug: { type: String, default: null },
  glowColor1: { type: String, default: 'bg-cyan-500/10' },
  glowColor2: { type: String, default: 'bg-orange-500/10' },
  products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  order: { type: Number, default: 0 }
}, { timestamps: true });

const HeroSlide = mongoose.model('HeroSlide', heroSlideSchema);
export default HeroSlide;
