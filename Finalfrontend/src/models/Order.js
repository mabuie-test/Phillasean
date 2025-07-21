// src/models/Order.js
import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  company: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  vessel: {
    type: String,
    required: true,
    trim: true
  },
  port: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: Date,
    required: true
  },
  services: {
    type: [String],
    required: true,
    validate: {
      validator: arr => Array.isArray(arr) && arr.length > 0,
      message: 'Deve haver ao menos um serviço selecionado'
    }
  },
  notes: {
    type: String,
    trim: true
  },
  invoice: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice'
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed'],
    default: 'pending'
  }
}, {
  timestamps: true
});

export default mongoose.model('Order', orderSchema);
