const { Schema, model, Types } = require('mongoose');

const InvoiceSchema = new Schema({
  order:     { type: Types.ObjectId, ref: 'Order', required: true },
  reference: String,
  date:      { type: Date, default: Date.now },
  dueDate:   Date,
  items: [
    {
      name:       String,
      qty:        Number,
      unitPrice:  Number
    }
  ]
});

module.exports = model('Invoice', InvoiceSchema);
