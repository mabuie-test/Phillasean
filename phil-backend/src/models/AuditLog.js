import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  user:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action:    String,
  timestamp: Date
});
export default mongoose.model('AuditLog', schema);
