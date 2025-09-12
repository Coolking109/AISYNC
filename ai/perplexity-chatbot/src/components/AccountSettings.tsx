'use client';

import React, { useState, useEffect } from 'react';
import { User, Mail, Lock, Eye, EyeOff, Settings, Save, X, Shield, Bell, Palette, Globe } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';

interface AccountSettingsProps {
  onClose?: () => void;
}

export const AccountSettings: React.FC<AccountSettingsProps> = ({ onClose }) => {
  const { user, logout, token, updateUser } = useAuth();
  const { theme, language, setTheme, setLanguage } = useTheme();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'preferences'>('profile');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Email verification state
  const [emailVerificationStep, setEmailVerificationStep] = useState<'edit' | 'verify'>('edit');
  const [verificationCode, setVerificationCode] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');

  // 2FA state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorQrCode, setTwoFactorQrCode] = useState('');
  const [twoFactorSecret, setTwoFactorSecret] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [twoFactorStep, setTwoFactorStep] = useState<'setup' | 'verify' | 'disable'>('setup');
  const [disablePassword, setDisablePassword] = useState('');

  const [profileData, setProfileData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    pushNotifications: false,
    theme: 'dark',
    language: 'en',
    autoSave: true,
    sessionTimeout: '30',
  });

  // Load user preferences on mount
  useEffect(() => {
    const loadPreferences = async () => {
      if (!token) return;
      
      try {
        const response = await fetch('/api/auth/get-preferences', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        const data = await response.json();
        if (data.success) {
          setPreferences(data.preferences);
        }
      } catch (error) {
        console.error('Failed to load preferences:', error);
      }
    };

    // Set 2FA status from user data
    if (user?.twoFactorEnabled) {
      setTwoFactorEnabled(true);
    }

    loadPreferences();
  }, [token, user]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validate form data
    if (!profileData.username.trim()) {
      setError('Username is required');
      setLoading(false);
      return;
    }

    if (!profileData.email.trim()) {
      setError('Email is required');
      setLoading(false);
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(profileData.email)) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    console.log('Submitting profile update:', profileData);

    // Check if email has changed - if so, trigger verification flow
    const emailChanged = profileData.email !== user?.email;
    
    if (emailChanged) {
      // Send verification code to new email
      try {
        const response = await fetch('/api/auth/send-email-verification', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ newEmail: profileData.email }),
        });

        const data = await response.json();
        
        if (data.success) {
          setPendingEmail(profileData.email);
          setEmailVerificationStep('verify');
          setSuccess('Verification code sent to your new email address. Please check your inbox.');
          setLoading(false);
          return;
        } else {
          setError(data.message || 'Failed to send verification code');
          setLoading(false);
          return;
        }
      } catch (error) {
        console.error('Email verification error:', error);
        setError('Failed to send verification code');
        setLoading(false);
        return;
      }
    }

    // If email hasn't changed, proceed with normal profile update
    try {
      const response = await fetch('/api/auth/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(profileData),
      });

      const data = await response.json();
      console.log('Profile update response:', data);

      if (data.success) {
        setSuccess('Profile updated successfully!');
        // Update local user data using the auth context
        if (data.user) {
          console.log('Updating user context with server data:', data.user);
          updateUser({
            username: data.user.username,
            email: data.user.email,
            firstName: data.user.firstName,
            lastName: data.user.lastName,
          });
        } else {
          // Fallback to profile data if server doesn't return user
          console.log('Updating user context with form data:', profileData);
          updateUser(profileData);
        }
      } else {
        setError(data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!verificationCode.trim()) {
      setError('Please enter the verification code');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/verify-email-change', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ verificationCode }),
      });

      const data = await response.json();
      
      console.log('Email verification response:', data);
      
      if (data.success) {
        setSuccess('Email address updated successfully!');
        // Update user context with new email
        if (data.user) {
          console.log('Updating user context with new email:', data.user.email);
          updateUser(data.user);
          setProfileData(prev => ({ ...prev, email: data.user.email }));
        }
        // Reset verification state
        setEmailVerificationStep('edit');
        setVerificationCode('');
        setPendingEmail('');
      } else {
        setError(data.message || 'Invalid verification code');
      }
    } catch (error) {
      console.error('Email verification error:', error);
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const cancelEmailVerification = () => {
    setEmailVerificationStep('edit');
    setVerificationCode('');
    setPendingEmail('');
    setProfileData(prev => ({ ...prev, email: user?.email || '' }));
    setError('');
    setSuccess('');
  };

  const setup2FA = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/auth/setup-2fa', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      
      if (data.success) {
        setTwoFactorQrCode(data.qrCode);
        setTwoFactorSecret(data.secret);
        setTwoFactorStep('verify');
        setSuccess('QR code generated! Scan it with your authenticator app.');
      } else {
        setError(data.message || 'Failed to setup 2FA');
      }
    } catch (error) {
      console.error('2FA setup error:', error);
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const enable2FA = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    if (!twoFactorCode.trim()) {
      setError('Please enter the 6-digit code from your authenticator app');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/enable-2fa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ code: twoFactorCode }),
      });

      const data = await response.json();
      
      if (data.success) {
        setTwoFactorEnabled(true);
        setTwoFactorStep('setup');
        setTwoFactorCode('');
        setTwoFactorQrCode('');
        setTwoFactorSecret('');
        setSuccess('Two-factor authentication enabled successfully!');
      } else {
        setError(data.message || 'Invalid verification code');
      }
    } catch (error) {
      console.error('2FA enable error:', error);
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const disable2FA = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    if (!twoFactorCode.trim() || !disablePassword.trim()) {
      setError('Please enter both your password and 2FA code');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/disable-2fa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          code: twoFactorCode, 
          password: disablePassword 
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setTwoFactorEnabled(false);
        setTwoFactorStep('setup');
        setTwoFactorCode('');
        setDisablePassword('');
        setSuccess('Two-factor authentication disabled successfully.');
      } else {
        setError(data.message || 'Failed to disable 2FA');
      }
    } catch (error) {
      console.error('2FA disable error:', error);
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const cancel2FASetup = () => {
    setTwoFactorStep('setup');
    setTwoFactorCode('');
    setTwoFactorQrCode('');
    setTwoFactorSecret('');
    setError('');
    setSuccess('');
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      setLoading(false);
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setError('New password must be at least 8 characters long');
      setLoading(false);
      return;
    }

    console.log('Submitting password change request');

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      const data = await response.json();

      console.log('Password change response:', data);

      if (data.success) {
        setSuccess('Password changed successfully! A confirmation email has been sent to your email address.');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setError(data.message || 'Failed to change password');
      }
    } catch (error) {
      console.error('Password change error:', error);
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handlePreferencesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Only update non-theme/language preferences here
      // Theme and language are handled by the theme context
      const preferencesToUpdate = {
        emailNotifications: preferences.emailNotifications,
        pushNotifications: preferences.pushNotifications,
        autoSave: preferences.autoSave,
        sessionTimeout: preferences.sessionTimeout,
        theme: theme, // Include current theme
        language: language, // Include current language
      };

      const response = await fetch('/api/auth/update-preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(preferencesToUpdate),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Preferences updated successfully!');
      } else {
        setError(data.message || 'Failed to update preferences');
      }
    } catch (error) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone and will permanently delete all your data.'
    );

    if (!confirmed) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/delete-account', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        // Clear all local storage
        localStorage.clear();
        sessionStorage.clear();
        
        // Logout and close modal
        logout();
        onClose?.();
        
        // Redirect to home page
        window.location.href = '/';
      } else {
        setError(data.message || 'Failed to delete account');
      }
    } catch (error) {
      console.error('Delete account error:', error);
      setError('Network error occurred while deleting account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-overlay backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass border border-glass rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-glass">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-accent" />
            <h2 className="text-2xl font-bold text-text">{t('accountSettings')}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text transition-colors p-2 hover:bg-glass rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          
          {/* Sidebar Navigation */}
          <div className="w-64 border-r border-glass p-4">
            <nav className="space-y-2">
              <button
                onClick={() => setActiveTab('profile')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  activeTab === 'profile' 
                    ? 'bg-accent text-white' 
                    : 'text-text-secondary hover:text-text hover:bg-glass'
                }`}
              >
                <User className="w-5 h-5" />
                {t('profile')}
              </button>
              
              <button
                onClick={() => setActiveTab('security')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  activeTab === 'security' 
                    ? 'bg-accent text-white' 
                    : 'text-text-secondary hover:text-text hover:bg-glass'
                }`}
              >
                <Shield className="w-5 h-5" />
                {t('security')}
              </button>
              
              <button
                onClick={() => setActiveTab('preferences')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  activeTab === 'preferences' 
                    ? 'bg-accent text-white' 
                    : 'text-text-secondary hover:text-text hover:bg-glass'
                }`}
              >
                <Palette className="w-5 h-5" />
                {t('preferences')}
              </button>
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            
            {/* Error/Success Messages */}
            {error && (
              <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
                {success}
              </div>
            )}

            {/* Profile Information Tab */}
            {activeTab === 'profile' && (
              <div>
                <h3 className="text-xl font-semibold text-text mb-6">Profile Information</h3>
                
                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    <div>
                      <label className="block text-sm font-medium text-text mb-2">
                        {t('username')}
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-secondary" />
                        <input
                          type="text"
                          value={profileData.username}
                          onChange={(e) => setProfileData(prev => ({ ...prev, username: e.target.value }))}
                          className="w-full pl-10 pr-4 py-3 glass border border-glass rounded-lg focus:outline-none focus:border-accent transition-colors text-text"
                          placeholder="Enter username"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text mb-2">
                        {t('email')}
                      </label>
                      
                      {emailVerificationStep === 'edit' ? (
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-secondary" />
                          <input
                            type="email"
                            value={profileData.email}
                            onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                            className="w-full pl-10 pr-4 py-3 glass border border-glass rounded-lg focus:outline-none focus:border-accent transition-colors text-text"
                            placeholder="Enter email"
                            required
                          />
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                            <p className="text-blue-400 text-sm">
                              📧 Verification code sent to: <strong>{pendingEmail}</strong>
                            </p>
                            <p className="text-text-secondary text-xs mt-1">
                              Check your inbox and enter the 6-digit code below
                            </p>
                          </div>
                          
                          <form onSubmit={handleEmailVerification} className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-text mb-2">
                                Verification Code
                              </label>
                              <input
                                type="text"
                                value={verificationCode}
                                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                className="w-full px-4 py-3 glass border border-glass rounded-lg focus:outline-none focus:border-accent transition-colors text-text text-center font-mono text-lg tracking-widest"
                                placeholder="000000"
                                maxLength={6}
                                required
                              />
                            </div>
                            
                            <div className="flex gap-3">
                              <button
                                type="submit"
                                disabled={loading || verificationCode.length !== 6}
                                className="flex-1 bg-gradient-to-r from-accent to-accent-secondary text-white px-4 py-3 rounded-lg font-medium hover:shadow-neon transition-all duration-200 disabled:opacity-50"
                              >
                                {loading ? 'Verifying...' : 'Verify Email'}
                              </button>
                              
                              <button
                                type="button"
                                onClick={cancelEmailVerification}
                                className="px-4 py-3 glass border border-glass rounded-lg text-text-secondary hover:text-text hover:bg-glass transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </form>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text mb-2">
                        {t('firstName')}
                      </label>
                      <input
                        type="text"
                        value={profileData.firstName}
                        onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                        className="w-full px-4 py-3 glass border border-glass rounded-lg focus:outline-none focus:border-accent transition-colors text-text"
                        placeholder="Enter first name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text mb-2">
                        {t('lastName')}
                      </label>
                      <input
                        type="text"
                        value={profileData.lastName}
                        onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
                        className="w-full px-4 py-3 glass border border-glass rounded-lg focus:outline-none focus:border-accent transition-colors text-text"
                        placeholder="Enter last name"
                      />
                    </div>
                  </div>

                  {emailVerificationStep === 'edit' && (
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex items-center gap-2 bg-gradient-to-r from-accent to-accent-secondary text-white px-6 py-3 rounded-lg font-medium hover:shadow-neon transition-all duration-200 disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      {loading ? t('loading') : t('updateProfile')}
                    </button>
                  )}
                </form>
              </div>
            )}

            {/* Security & Privacy Tab */}
            {activeTab === 'security' && (
              <div>
                <h3 className="text-xl font-semibold text-text mb-6">Security & Privacy</h3>
                
                {/* Change Password Section */}
                <div className="mb-8">
                  <h4 className="text-lg font-medium text-text mb-4">Change Password</h4>
                  
                  <form onSubmit={handlePasswordSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-text mb-2">
                        Current Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-secondary" />
                        <input
                          type={showCurrentPassword ? 'text' : 'password'}
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                          className="w-full pl-10 pr-12 py-3 glass border border-glass rounded-lg focus:outline-none focus:border-accent transition-colors text-text"
                          placeholder="Enter current password"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary hover:text-text transition-colors"
                        >
                          {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text mb-2">
                        New Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-secondary" />
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                          className="w-full pl-10 pr-12 py-3 glass border border-glass rounded-lg focus:outline-none focus:border-accent transition-colors text-text"
                          placeholder="Enter new password"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary hover:text-text transition-colors"
                        >
                          {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text mb-2">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-secondary" />
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          className="w-full pl-10 pr-12 py-3 glass border border-glass rounded-lg focus:outline-none focus:border-accent transition-colors text-text"
                          placeholder="Confirm new password"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary hover:text-text transition-colors"
                        >
                          {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="flex items-center gap-2 bg-gradient-to-r from-accent to-accent-secondary text-white px-6 py-3 rounded-lg font-medium hover:shadow-neon transition-all duration-200 disabled:opacity-50"
                    >
                      <Shield className="w-4 h-4" />
                      {loading ? 'Changing...' : 'Change Password'}
                    </button>
                  </form>
                </div>

                {/* Two-Factor Authentication Section */}
                <div className="mb-8">
                  <h4 className="text-lg font-medium text-text mb-4">Two-Factor Authentication</h4>
                  
                  {!twoFactorEnabled ? (
                    // 2FA Setup/Enable Flow
                    <div className="space-y-4">
                      {twoFactorStep === 'setup' && (
                        <div>
                          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg mb-4">
                            <p className="text-blue-400 text-sm">
                              🔐 Enable two-factor authentication for enhanced account security
                            </p>
                          </div>
                          
                          <button
                            onClick={setup2FA}
                            disabled={loading}
                            className="flex items-center gap-2 bg-gradient-to-r from-accent to-accent-secondary text-white px-6 py-3 rounded-lg font-medium hover:shadow-neon transition-all duration-200 disabled:opacity-50"
                          >
                            <Shield className="w-4 h-4" />
                            {loading ? 'Setting up...' : 'Setup 2FA'}
                          </button>
                        </div>
                      )}

                      {twoFactorStep === 'verify' && (
                        <div className="space-y-4">
                          <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                            <p className="text-green-400 text-sm mb-2">
                              📱 Step 1: Scan the QR code with your authenticator app
                            </p>
                            <p className="text-text-secondary text-xs">
                              Use Google Authenticator, Authy, or any TOTP-compatible app
                            </p>
                          </div>

                          <div className="bg-surface p-4 rounded-lg text-center border border-glass">
                            <img src={twoFactorQrCode} alt="2FA QR Code" className="mx-auto mb-4" />
                            <p className="text-sm text-text-secondary mb-2">Or enter this key manually:</p>
                            <code className="bg-glass px-2 py-1 rounded text-sm font-mono break-all text-text">
                              {twoFactorSecret}
                            </code>
                          </div>

                          <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                            <p className="text-yellow-400 text-sm">
                              📱 Step 2: Enter the 6-digit code from your app
                            </p>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-text mb-2">
                              Verification Code
                            </label>
                            <input
                              type="text"
                              value={twoFactorCode}
                              onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                              className="w-full px-4 py-3 glass border border-glass rounded-lg focus:outline-none focus:border-accent transition-colors text-text text-center font-mono text-lg tracking-widest"
                              placeholder="000000"
                              maxLength={6}
                              required
                            />
                          </div>

                          <div className="flex gap-3">
                            <button
                              onClick={enable2FA}
                              disabled={loading || twoFactorCode.length !== 6}
                              className="flex-1 bg-gradient-to-r from-accent to-accent-secondary text-white px-4 py-3 rounded-lg font-medium hover:shadow-neon transition-all duration-200 disabled:opacity-50"
                            >
                              {loading ? 'Enabling...' : 'Enable 2FA'}
                            </button>
                            
                            <button
                              onClick={cancel2FASetup}
                              className="px-4 py-3 glass border border-glass rounded-lg text-text-secondary hover:text-text hover:bg-glass transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    // 2FA Enabled - Disable Flow
                    <div className="space-y-4">
                      {twoFactorStep === 'setup' && (
                        <div>
                          <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg mb-4">
                            <p className="text-green-400 text-sm">
                              ✅ Two-factor authentication is enabled and protecting your account
                            </p>
                          </div>
                          
                          <button
                            onClick={() => setTwoFactorStep('disable')}
                            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
                          >
                            <Shield className="w-4 h-4" />
                            Disable 2FA
                          </button>
                        </div>
                      )}

                      {twoFactorStep === 'disable' && (
                        <div className="space-y-4">
                          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                            <p className="text-red-400 text-sm">
                              ⚠️ Disabling 2FA will reduce your account security
                            </p>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-text mb-2">
                              Current Password
                            </label>
                            <input
                              type="password"
                              value={disablePassword}
                              onChange={(e) => setDisablePassword(e.target.value)}
                              className="w-full px-4 py-3 glass border border-glass rounded-lg focus:outline-none focus:border-accent transition-colors text-text"
                              placeholder="Enter your password"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-text mb-2">
                              2FA Code
                            </label>
                            <input
                              type="text"
                              value={twoFactorCode}
                              onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                              className="w-full px-4 py-3 glass border border-glass rounded-lg focus:outline-none focus:border-accent transition-colors text-text text-center font-mono text-lg tracking-widest"
                              placeholder="000000"
                              maxLength={6}
                              required
                            />
                          </div>

                          <div className="flex gap-3">
                            <button
                              onClick={disable2FA}
                              disabled={loading || twoFactorCode.length !== 6 || !disablePassword.trim()}
                              className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
                            >
                              {loading ? 'Disabling...' : 'Disable 2FA'}
                            </button>
                            
                            <button
                              onClick={() => {
                                setTwoFactorStep('setup');
                                setTwoFactorCode('');
                                setDisablePassword('');
                              }}
                              className="px-4 py-3 glass border border-glass rounded-lg text-text-secondary hover:text-text hover:bg-glass transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Danger Zone */}
                <div className="border-t border-red-500/30 pt-8 mt-8">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                      <span className="text-white text-sm font-bold">!</span>
                    </div>
                    <h4 className="text-lg font-medium text-red-400">Danger Zone</h4>
                  </div>
                  
                  <div className="glass-dark p-6 rounded-lg border border-red-500/30 bg-red-500/5">
                    <div className="mb-4">
                      <h5 className="text-red-300 font-medium mb-2">Account Deletion</h5>
                      <div className="text-text-secondary text-sm space-y-1 mb-4">
                        <p>⚠️ This action will permanently delete:</p>
                        <ul className="list-disc list-inside ml-4 space-y-1">
                          <li>Your entire account and profile</li>
                          <li>All your conversation history</li>
                          <li>All your saved preferences</li>
                          <li>Any session data</li>
                        </ul>
                        <p className="mt-3 font-medium text-red-300">This action cannot be undone!</p>
                      </div>
                    </div>
                    
                    <button
                      onClick={handleDeleteAccount}
                      disabled={loading}
                      className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Deleting Account...
                        </>
                      ) : (
                        <>
                          <span className="text-lg">🗑️</span>
                          Delete My Account Permanently
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
              <div>
                <h3 className="text-xl font-semibold text-text mb-6">Preferences</h3>
                
                <form onSubmit={handlePreferencesSubmit} className="space-y-6">
                  
                  {/* Notifications */}
                  <div>
                    <h4 className="text-lg font-medium text-text mb-4 flex items-center gap-2">
                      <Bell className="w-5 h-5" />
                      Notifications
                    </h4>
                    
                    <div className="space-y-3">
                      <label className="flex items-center justify-between">
                        <span className="text-text-secondary">Email notifications</span>
                        <input
                          type="checkbox"
                          checked={preferences.emailNotifications}
                          onChange={(e) => setPreferences(prev => ({ ...prev, emailNotifications: e.target.checked }))}
                          className="w-4 h-4 text-accent bg-glass border-glass rounded focus:ring-accent"
                        />
                      </label>
                      
                      <label className="flex items-center justify-between">
                        <span className="text-text-secondary">Push notifications</span>
                        <input
                          type="checkbox"
                          checked={preferences.pushNotifications}
                          onChange={(e) => setPreferences(prev => ({ ...prev, pushNotifications: e.target.checked }))}
                          className="w-4 h-4 text-accent bg-glass border-glass rounded focus:ring-accent"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Theme & Language */}
                  <div>
                    <h4 className="text-lg font-medium text-text mb-4 flex items-center gap-2">
                      <Globe className="w-5 h-5" />
                      {t('appearanceLanguage')}
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-text mb-2">
                          {t('theme')}
                        </label>
                        <select
                          value={theme}
                          onChange={(e) => setTheme(e.target.value as 'dark' | 'light' | 'auto')}
                          className="w-full px-4 py-3 glass border border-glass rounded-lg focus:outline-none focus:border-accent transition-colors text-text"
                        >
                          <option value="dark">{t('dark')}</option>
                          <option value="light">{t('light')}</option>
                          <option value="auto">{t('auto')}</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-text mb-2">
                          {t('language')}
                        </label>
                        <select
                          value={language}
                          onChange={(e) => setLanguage(e.target.value as 'en' | 'es' | 'fr' | 'de')}
                          className="w-full px-4 py-3 glass border border-glass rounded-lg focus:outline-none focus:border-accent transition-colors text-text"
                        >
                          <option value="en">English</option>
                          <option value="es">Español</option>
                          <option value="fr">Français</option>
                          <option value="de">Deutsch</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Chat Settings */}
                  <div>
                    <h4 className="text-lg font-medium text-text mb-4">Chat Settings</h4>
                    
                    <div className="space-y-4">
                      <label className="flex items-center justify-between">
                        <span className="text-text-secondary">Auto-save conversations</span>
                        <input
                          type="checkbox"
                          checked={preferences.autoSave}
                          onChange={(e) => setPreferences(prev => ({ ...prev, autoSave: e.target.checked }))}
                          className="w-4 h-4 text-accent bg-glass border-glass rounded focus:ring-accent"
                        />
                      </label>

                      <div>
                        <label className="block text-sm font-medium text-text mb-2">
                          Session timeout (minutes)
                        </label>
                        <select
                          value={preferences.sessionTimeout}
                          onChange={(e) => setPreferences(prev => ({ ...prev, sessionTimeout: e.target.value }))}
                          className="w-full px-4 py-3 glass border border-glass rounded-lg focus:outline-none focus:border-accent transition-colors text-text"
                        >
                          <option value="15">15 minutes</option>
                          <option value="30">30 minutes</option>
                          <option value="60">1 hour</option>
                          <option value="120">2 hours</option>
                          <option value="0">Never</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2 bg-gradient-to-r from-accent to-accent-secondary text-white px-6 py-3 rounded-lg font-medium hover:shadow-neon transition-all duration-200 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {loading ? 'Saving...' : 'Save Preferences'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
