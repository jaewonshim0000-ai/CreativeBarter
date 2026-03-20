import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma';
import { config } from '../config';
import { AppError } from '../middleware/errorHandler';

// ============================================================
// Types
// ============================================================

interface RegisterInput {
  email: string;
  password: string;
  name: string;
}

interface LoginInput {
  email: string;
  password: string;
}

interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  token: string;
}

// ============================================================
// Service Functions
// ============================================================

/**
 * Register a new user with hashed password and return JWT.
 */
export async function registerUser(input: RegisterInput): Promise<AuthResponse> {
  const { email, password, name } = input;

  // Check if user already exists
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AppError('A user with this email already exists.', 409);
  }

  // Hash password (12 salt rounds for security)
  const passwordHash = await bcrypt.hash(password, 12);

  // Create user in database
  const user = await prisma.user.create({
    data: { email, passwordHash, name },
  });

  // Generate JWT
  const token = generateToken(user.id, user.role);

  return {
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
    token,
  };
}

/**
 * Authenticate user with email and password, return JWT.
 */
export async function loginUser(input: LoginInput): Promise<AuthResponse> {
  const { email, password } = input;

  // Find user by email
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new AppError('Invalid email or password.', 401);
  }

  // Verify password
  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    throw new AppError('Invalid email or password.', 401);
  }

  const token = generateToken(user.id, user.role);

  return {
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
    token,
  };
}

/**
 * Generate a signed JWT token.
 */
function generateToken(userId: string, role: string): string {
  return jwt.sign(
    { userId, role },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn as any }
  );
}
