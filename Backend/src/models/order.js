const { Schema, model, Types } = require('mongoose');
const orderSchema = new Schema({
  userId:    { type: Types.ObjectId, ref: 'User', default: null },
  name:      { type: String, required: true },
  email:     { type: String, required: true },
  service:   { type: String, required: true },
  details:   { type: Schema.Types.Mixed, default: {} },
  createdAt: { type: Date, default: Date.now },
  status:    { type: String, enum: ['pending','processed','cancelled'], default: 'pending' }
});
module.exports = model('Order', orderSchema);
