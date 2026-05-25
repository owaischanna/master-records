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

const writeUsers = (users) => {
  fs.writeFileSync(usersPath, JSON.stringify(users, null, 2), 'utf8');
};

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed.' });
  }

  const { name, email, password } = req.body || {};

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required.' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const users = readUsers();

  if (users.some((user) => user.email === normalizedEmail)) {
    return res.status(409).json({ message: 'Email is already registered.' });
  }

  const newUser = {
    id: crypto.randomUUID(),
    name: String(name).trim(),
    email: normalizedEmail,
    passwordHash: hashPassword(String(password)),
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  writeUsers(users);

  return res.status(201).json({ message: 'Signup successful. Please log in.' });
}
