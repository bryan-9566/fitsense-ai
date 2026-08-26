const User = require('../models/User');
const { hashPassword, comparePassword } = require('../utils/password');
const { signToken } = require('../utils/jwt');

function publicUser(user) {
  return { id: user._id, name: user.name, email: user.email, role: user.role, profile: user.profile };
}

async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password || password.length < 6) return res.status(400).json({ message: 'Name, valid email and password (6+ chars) are required' });
    const normalized = email.toLowerCase().trim();
    if (await User.findOne({ email: normalized })) return res.status(409).json({ message: 'Email already registered' });
    const user = await User.create({ name: name.trim(), email: normalized, password: await hashPassword(password) });
    res.status(201).json({ token: signToken(user), user: publicUser(user) });
  } catch (err) { next(err); }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: String(email || '').toLowerCase().trim() });
    if (!user || !(await comparePassword(password || '', user.password))) return res.status(401).json({ message: 'Invalid email or password' });
    res.json({ token: signToken(user), user: publicUser(user) });
  } catch (err) { next(err); }
}

module.exports = { register, login };
