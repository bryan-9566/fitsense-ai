require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function run() {
  const email = process.argv[2];
  if (!email) throw new Error('Usage: node src/utils/makeAdmin.js user@example.com');
  await mongoose.connect(process.env.MONGO_URI);
  const user = await User.findOneAndUpdate({ email: email.toLowerCase() }, { role: 'ADMIN' }, { new: true });
  if (!user) throw new Error('User not found');
  console.log(`${user.email} is now ADMIN`);
  await mongoose.disconnect();
}

run().catch(err => { console.error(err.message); process.exit(1); });
