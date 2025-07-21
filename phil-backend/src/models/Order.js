import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  client:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name:    String, // para facilitar
  company: String,
  email:   String,
  phone:   String,
  vessel:  String,
  port:    String,
  date:    Date,
  services:[String],
  notes:   String,
  invoice: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },
  status:  { type: String, enum: ['pending','in_progress','completed'], default: 'pending' }
}, { timestamps: true });
export default mongoose.model('Order', schema);
