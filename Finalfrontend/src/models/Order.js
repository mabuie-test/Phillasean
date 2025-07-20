// src/models/Order.js
import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  vessel: String,
  port: String,
  date: Date,
  services: [String],
  notes: String,
  invoice: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },
  status: { type: String, enum: ['pending','in_progress','completed'], default: 'pending' }
}, { timestamps: true });

export default mongoose.model('Order', orderSchema);
