const { Schema, model, Types } = require('mongoose');

const HistorySchema = new Schema({
  order:     { type: Types.ObjectId, ref: 'Order', required: true },
  status:    String,
  changedAt: { type: Date, default: Date.now },
  by:        { type: String, enum: ['client','admin'] }
});

module.exports = model('OrderHistory', HistorySchema);
