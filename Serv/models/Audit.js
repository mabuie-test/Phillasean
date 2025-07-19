const mongoose = require('mongoose');
const AuditSchema = new mongoose.Schema({
  admin:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action:   { type: String, required: true },            // e.g. 'create-admin', 'delete-admin'
  target:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  timestamp:{ type: Date, default: Date.now }
});
module.exports = mongoose.model('Audit', AuditSchema);
