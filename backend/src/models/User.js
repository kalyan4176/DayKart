import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const addressSchema = new mongoose.Schema({
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  country: { type: String, required: true },
  postalCode: { type: String, required: true },
  isDefault: { type: Boolean, default: false },
});

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: function() { return !this.googleId; } },
  role: { type: String, enum: ['customer', 'seller', 'admin', 'delivery_partner'], default: 'customer' },
  avatar: { type: String },
  phoneNumber: { type: String },
  googleId: { type: String },
  addresses: [addressSchema],
  savedCards: [{
    cardId: String,
    brand: String,
    last4: String,
    expMonth: Number,
    expYear: Number,
  }],
  savedUPIs: [{
    vpa: String,
    alias: String,
  }],
  isVerified: { type: Boolean, default: false },
  otp: { type: String },
  otpExpires: { type: Date },
  refreshToken: { type: String },
}, {
  timestamps: true,
});

userSchema.index({ role: 1 });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
