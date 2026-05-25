import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const usersPath = path.join(process.cwd(), 'data', 'users.json');
const AUTH_SECRET = process.env.AUTH_SECRET || 'individual-record-secret';

const hashPassword = (password) => crypto.createHash('sha256').update(password).digest('hex');

const ensureUsersFile = () => {
  const folder = path.dirname(usersPath);
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
  }
  if (!fs.existsSync(usersPath)) {
    fs.writeFileSync(usersPath, '[]', 'utf8');
  }
};

const readUsers = () => {
  ensureUsersFile();
  const raw = fs.readFileSync(usersPath, 'utf8');
  try {
    return JSON.parse(raw || '[]');
  } catch (error) {
    return [];
  }
};

const createToken = ({ email, name }) => {
  const exp = Date.now() + 3 * 24 * 60 * 60 * 1000;
  const payload = JSON.stringify({ email, name, exp });
  const encoded = Buffer.from(payload).toString('base64url');
  const signature = crypto.createHmac('sha256', AUTH_SECRET).update(encoded).digest('base64url');
  return `${encoded}.${signature}`;
};

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed.' });
  }

  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const users = readUsers();
  const user = users.find((item) => item.email === normalizedEmail);

  if (!user || user.passwordHash !== hashPassword(String(password))) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }

  const token = createToken({ email: user.email, name: user.name });
  return res.status(200).json({ token, user: { name: user.name, email: user.email }, expiresAt: Date.now() + 3 * 24 * 60 * 60 * 1000 });
}
