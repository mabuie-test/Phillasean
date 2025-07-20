const { Schema, model, Types } = require('mongoose');

const OrderSchema = new Schema({
  client:    { type: Types.ObjectId, ref: 'User', required: true },
  details: {
    services:      req.body.services || [],
      notes:         req.body.notes,
      vessel:        req.body.vessel,
      port:          req.body.port,
      estimatedDate: req.body.date
  },
  status:    { type: String, enum: ['pending','in_progress','completed'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = model('Order', OrderSchema);
