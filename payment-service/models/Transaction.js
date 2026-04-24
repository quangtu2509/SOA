const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  transactionId: { type: String, required: true, unique: true },
  orderId: { type: String },
  userId: { type: String, required: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['PAYMENT', 'REFUND', 'TOPUP'], required: true },
  status: { type: String, enum: ['SUCCESS', 'FAILED', 'REFUNDED'], required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Transaction', transactionSchema);