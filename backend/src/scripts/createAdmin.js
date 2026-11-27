
require('dotenv').config();

const connectDb = require('../utils/connectDb');
const User = require('../models/User');
const { hashPassword } = require('../utils/hashService');

const createAdmin = async () => {
  try {
    await connectDb();

    const { ADMIN_NAME, ADMIN_PHONE, ADMIN_PASSWORD } = process.env;

    if (!ADMIN_NAME || !ADMIN_PHONE || !ADMIN_PASSWORD) {
      throw new Error('Admin environment variables are missing');
    }

    const existingAdmin = await User.findOne({ phone: ADMIN_PHONE });

    if (existingAdmin) {
      console.log('A user with this phone already exists');
      return;
    }

    await User.create({
      name: ADMIN_NAME,
      phone: ADMIN_PHONE,
      password: await hashPassword(ADMIN_PASSWORD),
      role: 'admin'
    });

    console.log('Admin created successfully');
  } catch (error) {
    console.error(error.message);
  } finally {
    const mongoose = require('mongoose');
    await mongoose.disconnect();
  }
};

createAdmin();
