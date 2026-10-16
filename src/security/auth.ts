import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET ?? 'dev-secret';

export function signToken(payload: string) {
  return jwt.sign({ sub: payload }, SECRET, { expiresIn: '1h' });
}

export function verifyToken(token: string) {
  return jwt.verify(token, SECRET);
}