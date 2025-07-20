const { Schema, model, Types } = require('mongoose');

const OrderSchema = new Schema({
  client:    { type: Types.ObjectId, ref: 'User', required: true },
  details: {
    services:      [{ type: String }],    // agora é array de strings
    notes:         String,
    vessel:        String,
    port:          String,
    estimatedDate: Date
  },
  status:    { type: String, enum: ['pending','in_progress','completed'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = model('Order', OrderSchema);
