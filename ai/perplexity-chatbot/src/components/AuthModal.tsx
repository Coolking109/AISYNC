'use client';

import React, { useState } from 'react';
import { Eye, EyeOff, User, Mail, Lock, Loader2, Shield } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface AuthModalProps {
  onClose?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [is2FARequired, setIs2FARequired] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    resetToken: '',
    newPassword: '',
  });

  const { login, register, forgotPassword, resetPassword } = useAuth();

  const handle2FAVerification = async () => {
    if (!twoFactorCode.trim()) {
      setError('Please enter the 6-digit code from your authenticator app');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Complete login with 2FA code
      const result = await login({
        email: formData.email,
        password: formData.password,
        twoFactorCode: twoFactorCode
      });
      
      if (result.success) {
        onClose?.();
      } else {
        setError(result.message || 'Invalid 2FA code');
      }
    } catch (error) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      let result;
      
      if (isForgotPassword) {
        result = await forgotPassword(formData.email);
        if (result.success) {
          setSuccess(result.message || 'Password reset instructions sent to your email.');
          // Reset form and stay on forgot password screen
          setFormData({ email: '', username: '', password: '', resetToken: '', newPassword: '' });
        } else {
          setError(result.message || 'An error occurred');
        }
        return;
      }
      
      if (isResetPassword) {
        result = await resetPassword(formData.resetToken, formData.newPassword);
        if (result.success) {
          setSuccess(result.message || 'Password reset successfully. You can now log in.');
          setIsResetPassword(false);
          setIsForgotPassword(false);
          setIsLogin(true);
          setFormData({ email: '', username: '', password: '', resetToken: '', newPassword: '' });
        } else {
          setError(result.message || 'An error occurred');
        }
        return;
      }
      
      if (isLogin) {
        result = await login({
          email: formData.email,
          password: formData.password,
        });
        
        // Check if 2FA is required
        if (result.requires2FA) {
          setIs2FARequired(true);
          setError('');
          setSuccess('Please enter your two-factor authentication code');
          setLoading(false);
          return;
        }
      } else {
        result = await register({
          email: formData.email,
          username: formData.username,
          password: formData.password,
        });
      }

      if (result.success) {
        onClose?.();
      } else {
        setError(result.message || 'An error occurred');
      }
    } catch (error) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const resetForm = () => {
    setFormData({ email: '', username: '', password: '', resetToken: '', newPassword: '' });
    setTwoFactorCode('');
    setError('');
    setSuccess('');
    setIs2FARequired(false);
  };

  const switchToLogin = () => {
    setIsLogin(true);
    setIsForgotPassword(false);
    setIsResetPassword(false);
    setIs2FARequired(false);
    resetForm();
  };

  const switchToRegister = () => {
    setIsLogin(false);
    setIsForgotPassword(false);
    setIsResetPassword(false);
    resetForm();
  };

  const switchToForgotPassword = () => {
    setIsForgotPassword(true);
    setIsLogin(false);
    setIsResetPassword(false);
    resetForm();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass border border-glass rounded-2xl p-8 w-full max-w-md shadow-2xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-text mb-2">
            {isForgotPassword 
              ? 'Reset Password' 
              : isResetPassword 
                ? 'Set New Password'
                : isLogin 
                  ? 'Welcome Back' 
                  : 'Create Account'
            }
          </h2>
          <p className="text-text-secondary">
            {isForgotPassword 
              ? 'Enter your email address to receive reset instructions'
              : isResetPassword
                ? 'Enter your new password below'
                : isLogin 
                  ? 'Sign in to access your personalized AI chat experience' 
                  : 'Join to save your conversations and preferences'
            }
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
              {success}
            </div>
          )}

          {/* Reset Token (only for reset password) */}
          {isResetPassword && (
            <div>
              <label className="block text-sm font-medium text-text mb-2">
                Reset Token
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-secondary" />
                <input
                  type="text"
                  name="resetToken"
                  value={formData.resetToken}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 glass border border-glass rounded-lg focus:outline-none focus:border-accent transition-colors text-text"
                  placeholder="Enter reset token from email"
                  required
                />
              </div>
            </div>
          )}

          {/* Email/Username field */}
          {!isResetPassword && (
            <div>
              <label className="block text-sm font-medium text-text mb-2">
                {isLogin ? 'Email or Username' : isForgotPassword ? 'Email Address' : 'Email Address'}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-secondary" />
                <input
                  type="text"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 glass border border-glass rounded-lg focus:outline-none focus:border-accent transition-colors text-text"
                  placeholder={isLogin ? "Enter your email or username" : "Enter your email"}
                  required
                />
              </div>
            </div>
          )}

          {/* Username (only for register) */}
          {!isLogin && !isForgotPassword && !isResetPassword && (
            <div>
              <label className="block text-sm font-medium text-text mb-2">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-secondary" />
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 glass border border-glass rounded-lg focus:outline-none focus:border-accent transition-colors text-text"
                  placeholder="Choose a username"
                  required
                />
              </div>
            </div>
          )}

          {/* Password */}
          {!isForgotPassword && (
            <div>
              <label className="block text-sm font-medium text-text mb-2">
                {isResetPassword ? 'New Password' : 'Password'}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-secondary" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name={isResetPassword ? 'newPassword' : 'password'}
                  value={isResetPassword ? formData.newPassword : formData.password}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-12 py-3 glass border border-glass rounded-lg focus:outline-none focus:border-accent transition-colors text-text"
                  placeholder={isResetPassword ? 'Enter your new password' : 'Enter your password'}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary hover:text-text transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          )}

          {/* Two-Factor Authentication */}
          {is2FARequired && (
            <div>
              <label className="block text-sm font-medium text-text mb-2">
                Two-Factor Authentication Code
              </label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-secondary" />
                <input
                  type="text"
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full pl-10 pr-4 py-3 glass border border-glass rounded-lg focus:outline-none focus:border-accent transition-colors text-text text-center font-mono text-lg tracking-widest"
                  placeholder="000000"
                  maxLength={6}
                  required
                />
              </div>
              <p className="text-text-secondary text-xs mt-2">
                Enter the 6-digit code from your authenticator app
              </p>
            </div>
          )}

          {is2FARequired ? (
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handle2FAVerification}
                disabled={loading || twoFactorCode.length !== 6}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-accent to-accent-secondary text-white rounded-lg font-medium hover:shadow-neon transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Verify & Sign In'
                )}
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setIs2FARequired(false);
                  setTwoFactorCode('');
                  setError('');
                  setSuccess('');
                }}
                className="px-4 py-3 glass border border-glass rounded-lg text-text-secondary hover:text-text hover:bg-glass transition-colors"
              >
                Back
              </button>
            </div>
          ) : (
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-accent to-accent-secondary text-white rounded-lg font-medium hover:shadow-neon transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {isForgotPassword 
                    ? 'Send Reset Instructions'
                    : isResetPassword
                      ? 'Reset Password' 
                      : isLogin 
                        ? 'Sign In' 
                        : 'Create Account'
                  }
                </>
              )}
            </button>
          )}
        </form>

        <div className="mt-6 space-y-4">
          {!isForgotPassword && !isResetPassword && (
            <button
              onClick={switchToForgotPassword}
              className="w-full text-accent hover:text-accent-secondary transition-colors text-sm"
            >
              Forgot your password?
            </button>
          )}

          {isForgotPassword && (
            <button
              onClick={switchToLogin}
              className="w-full text-accent hover:text-accent-secondary transition-colors text-sm"
            >
              Back to Sign In
            </button>
          )}

          {!isForgotPassword && !isResetPassword && (
            <div className="text-center">
              <span className="text-text-secondary text-sm">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
              </span>
              <button
                onClick={isLogin ? switchToRegister : switchToLogin}
                className="text-accent hover:text-accent-secondary transition-colors text-sm font-medium"
              >
                {isLogin ? 'Sign Up' : 'Sign In'}
              </button>
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-text-secondary hover:text-text transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  );
};
