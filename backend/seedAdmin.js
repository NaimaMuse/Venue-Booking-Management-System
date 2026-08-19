require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const {
  MONGODB_URI,
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  ADMIN_NAME,
  ADMIN_PHONE,
} = process.env;

if (!MONGODB_URI) {
  console.error('MONGODB_URI is not set');
  process.exit(1);
}
if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('ADMIN_EMAIL and ADMIN_PASSWORD must be set');
  process.exit(1);
}

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const existing = await User.findOne({ email: ADMIN_EMAIL.toLowerCase() });
  if (existing) {
    if (existing.role !== 'admin') {
      existing.role = 'admin';
      await existing.save();
      console.log(`Updated existing user ${ADMIN_EMAIL} to admin role`);
    } else {
      console.log(`Admin ${ADMIN_EMAIL} already exists — skipping`);
    }
    await mongoose.disconnect();
    return;
  }

  const hashed = await bcrypt.hash(ADMIN_PASSWORD, 12);
  await User.create({
    fullName: ADMIN_NAME || 'HallHub Admin',
    email: ADMIN_EMAIL.toLowerCase(),
    password: hashed,
    phone: ADMIN_PHONE || '',
    role: 'admin',
  });

  console.log(`Admin account created: ${ADMIN_EMAIL}`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
