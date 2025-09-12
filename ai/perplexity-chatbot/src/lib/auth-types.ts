export interface User {
  _id?: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  passwordHash?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  twoFactorEnabled?: boolean;
  twoFactorSecret?: string;
  twoFactorEnabledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  defaultModelSelection?: {
    mode: 'all' | 'single';
    selectedModel?: string;
  };
  theme: 'dark' | 'light' | 'auto';
  language: 'en' | 'es' | 'fr' | 'de';
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  autoSave?: boolean;
  sessionTimeout?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  twoFactorCode?: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface AuthResponse {
  success: boolean;
  user?: Omit<User, 'passwordHash'>;
  token?: string;
  message?: string;
  requires2FA?: boolean;
}

export interface Session {
  _id?: string;
  userId: string;
  sessionId: string;
  title: string;
  messages: any[];
  createdAt: Date;
  updatedAt: Date;
}
