import jwt from 'jsonwebtoken';

type JwtPayload = string | { sub?: string; [key: string]: unknown };

const SECRET = process.env.JWT_SECRET ?? 'dev-secret';
const EXPIRES_IN = '1h';

export function signToken(payload: string) {
  return jwt.sign({ sub: payload }, SECRET, { expiresIn: EXPIRES_IN });
}

export function verifyToken(token: string) {
  return jwt.verify(token, SECRET) as JwtPayload;
}
