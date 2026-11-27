
const mongoose = require('mongoose');

const connectDb = async () => {
  await mongoose.connect(process.env.MONGODB_URL);
  console.log('Database connected successfully');
};

module.exports = connectDb;
