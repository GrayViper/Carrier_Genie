import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const DEFAULT_SECRET = process.env.JWT_SECRET || 'careergenie-dev-secret';

export const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
};

export const verifyPassword = async (password, hashedPassword) => {
  return bcrypt.compare(password, hashedPassword);
};

export const createToken = async (payload, secret = DEFAULT_SECRET) => {
  return jwt.sign(payload, secret, { expiresIn: '7d' });
};

export const decodeToken = async (token, secret = DEFAULT_SECRET) => {
  return jwt.verify(token, secret);
};
