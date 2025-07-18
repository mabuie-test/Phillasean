const mongoose = require('mongoose');
const { MONGODB_URI } = process.env;

module.exports = async function connectDB() {
  await mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
  console.log('MongoDB conectado');
};
