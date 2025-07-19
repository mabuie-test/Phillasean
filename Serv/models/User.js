const { Schema, model } = require('mongoose');

const UserSchema = new Schema({
  name:     { type: String, required: true },
  email:    { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role:     { type: String, enum: ['client','admin'], default: 'client' },
  createdAt:{ type: Date, default: Date.now }
});

module.exports = model('User', UserSchema);
