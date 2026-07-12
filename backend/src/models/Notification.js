import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
   type: { type: String, enum: ['order', 'support', 'promotion', 'kyc', 'info', 'alert'], required: true },
  read: { type: Boolean, default: false },
  link: { type: String, default: '' },
  metadata: {
    orderId: String,
    ticketId: String,
    url: String,
  }
}, {
  timestamps: true
});

notificationSchema.index({ recipient: 1, read: 1 });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
