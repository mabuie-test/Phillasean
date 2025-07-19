const mongoose = require('mongoose');
const { MONGO_URI } = process.env;

module.exports = async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB conectado');
  } catch (err) {
    console.error('Erro ao conectar MongoDB:', err);
    process.exit(1);
  }
};

