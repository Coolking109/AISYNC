'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock, CheckCircle, XCircle } from 'lucide-react';

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isTokenValid, setIsTokenValid] = useState<boolean | null>(null);

  useEffect(() => {
    const resetToken = searchParams.get('token');
    if (resetToken) {
      setToken(resetToken);
      // Optionally validate token here
      setIsTokenValid(true);
    } else {
      setIsTokenValid(false);
      setMessage('Invalid or missing reset token');
    }
  }, [searchParams]);

  const validatePassword = (password: string) => {
    const minLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return {
      isValid: minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar,
      requirements: {
        minLength,
        hasUpperCase,
        hasLowerCase,
        hasNumbers,
        hasSpecialChar
      }
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      setMessage('Invalid reset token');
      return;
    }

    if (password !== confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      setMessage('Password does not meet requirements');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          newPassword: password,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setIsSuccess(true);
        setMessage('Password reset successfully! You can now login with your new password.');
        setTimeout(() => {
          router.push('/');
        }, 3000);
      } else {
        setMessage(data.message || 'Failed to reset password');
      }
    } catch (error) {
      setMessage('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const passwordValidation = validatePassword(password);

  if (isTokenValid === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background-secondary to-background flex items-center justify-center p-4">
        <div className="glass rounded-2xl p-8 w-full max-w-md text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-text mb-2">Invalid Reset Link</h1>
          <p className="text-text-secondary mb-6">
            This password reset link is invalid or has expired.
          </p>
          <button
            onClick={() => router.push('/')}
            className="w-full bg-accent hover:bg-accent-hover text-white py-3 rounded-xl font-medium transition-all duration-200"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background-secondary to-background flex items-center justify-center p-4">
        <div className="glass rounded-2xl p-8 w-full max-w-md text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-text mb-2">Password Reset Successful!</h1>
          <p className="text-text-secondary mb-6">
            Your password has been updated successfully. You will be redirected to the home page shortly.
          </p>
          <button
            onClick={() => router.push('/')}
            className="w-full bg-accent hover:bg-accent-hover text-white py-3 rounded-xl font-medium transition-all duration-200"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background-secondary to-background flex items-center justify-center p-4">
      <div className="glass rounded-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <Lock className="w-12 h-12 text-accent mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-text mb-2">Reset Your Password</h1>
          <p className="text-text-secondary">
            Enter your new password below
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-text mb-2">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full glass text-text border border-glass rounded-xl px-4 py-3 pr-12 focus:outline-none focus:border-accent transition-all duration-200"
                placeholder="Enter new password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Password Requirements */}
          {password && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-text">Password Requirements:</p>
              <div className="space-y-1">
                {Object.entries({
                  'At least 8 characters': passwordValidation.requirements.minLength,
                  'One uppercase letter': passwordValidation.requirements.hasUpperCase,
                  'One lowercase letter': passwordValidation.requirements.hasLowerCase,
                  'One number': passwordValidation.requirements.hasNumbers,
                  'One special character': passwordValidation.requirements.hasSpecialChar,
                }).map(([requirement, met]) => (
                  <div key={requirement} className="flex items-center space-x-2">
                    {met ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                    <span className={`text-sm ${met ? 'text-green-500' : 'text-red-500'}`}>
                      {requirement}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-text mb-2">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full glass text-text border border-glass rounded-xl px-4 py-3 pr-12 focus:outline-none focus:border-accent transition-all duration-200"
                placeholder="Confirm new password"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {confirmPassword && password !== confirmPassword && (
              <p className="text-red-500 text-sm mt-1">Passwords do not match</p>
            )}
          </div>

          {/* Error Message */}
          {message && !isSuccess && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
              <p className="text-red-500 text-sm">{message}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !passwordValidation.isValid || password !== confirmPassword}
            className="w-full bg-accent hover:bg-accent-hover disabled:bg-accent/50 disabled:cursor-not-allowed text-white py-3 rounded-xl font-medium transition-all duration-200 flex items-center justify-center"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              'Reset Password'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => router.push('/')}
            className="text-accent hover:text-accent-hover text-sm transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
