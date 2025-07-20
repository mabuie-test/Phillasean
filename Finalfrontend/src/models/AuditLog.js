// src/models/AuditLog.js
import mongoose from 'mongoose';

const auditSchema = new mongoose.Schema({
  user: String,
  action: String,
  timestamp: Date
});

export default mongoose.model('AuditLog', auditSchema);
