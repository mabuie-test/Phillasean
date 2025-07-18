const { Schema, model, Types } = require('mongoose');

const invoiceSchema = new Schema({
  orderId:   { type: Types.ObjectId, ref: 'Order', required: true },
  pdfPath:   { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = model('Invoice', invoiceSchema);
