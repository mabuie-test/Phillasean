import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  name:     String,
  email:    { type: String, unique: true },
  password: String,
  role:     { type: String, enum: ['user','admin'], default: 'user' }
}, { timestamps: true });
export default mongoose.model('User', schema);
