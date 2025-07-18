const mongoose = require('mongoose');
module.exports = function connectDB() {
  mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => console.log('MongoDB conectado'))
  .catch(err => {
    console.error('Falha ao conectar MongoDB:', err);
    process.exit(1);
  });
};
