// src/models/Invoice.js
import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  number: String,
  date: Date,
  dueDate: Date,
  filename: String
}, { timestamps: true });

export default mongoose.model('Invoice', invoiceSchema);
