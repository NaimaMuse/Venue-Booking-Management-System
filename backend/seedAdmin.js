require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const bcrypt = require('bcryptjs');
const { connectDB, disconnectDB } = require('./config/db');
const User = require('./models/User');

const seedAdmin = async () => {
  const email = (process.env.ADMIN_EMAIL || 'admin@hargeisahallfinder.com')
    .toLowerCase()
    .trim();
  const password = process.env.ADMIN_PASSWORD || 'AdminPass123!';
  const fullName = process.env.ADMIN_NAME || 'System Admin';
  const phone = process.env.ADMIN_PHONE || '';

  if (!password || password.length < 6) {
    throw new Error('ADMIN_PASSWORD must be at least 6 characters');
  }

  await connectDB(process.env.MONGODB_URI || process.env.MONGO_URI);

  const existing = await User.findOne({ email });
  if (existing) {
    if (existing.role !== 'admin') {
      existing.role = 'admin';
      await existing.save();
      console.log(`Updated existing user to admin: ${email}`);
    } else {
      console.log(`Admin already exists: ${email}`);
    }
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await User.create({
    fullName,
    email,
    password: hashedPassword,
    phone,
    role: 'admin',
  });

  console.log('Admin user created successfully');
  console.log(`  Email: ${email}`);
  console.log(`  Password: ${password}`);
  console.log('Change ADMIN_PASSWORD in .env for production.');
};

seedAdmin()
  .catch((err) => {
    console.error('Seed admin failed:', err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectDB();
  });
