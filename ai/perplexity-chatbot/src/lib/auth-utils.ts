import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from './auth-types';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

export class AuthUtils {
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }

  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }

  static generateToken(user: Omit<User, 'passwordHash'>): string {
    return jwt.sign(
      { 
        userId: user._id, 
        email: user.email, 
        username: user.username 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
  }

  static generateResetToken(): string {
    const token = Math.random().toString(36).substring(2, 15) + 
                  Math.random().toString(36).substring(2, 15) +
                  Date.now().toString();
    return Buffer.from(token).toString('base64');
  }

  static verifyToken(token: string): any {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return null;
    }
  }

  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validatePassword(password: string): { valid: boolean; message?: string } {
    if (password.length < 6) {
      return { valid: false, message: 'Password must be at least 6 characters long' };
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return { 
        valid: false, 
        message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number' 
      };
    }
    return { valid: true };
  }

  static validateUsername(username: string): { valid: boolean; message?: string } {
    if (username.length < 3) {
      return { valid: false, message: 'Username must be at least 3 characters long' };
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return { valid: false, message: 'Username can only contain letters, numbers, and underscores' };
    }
    return { valid: true };
  }
}
