import { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  User,
  Lock,
  Moon,
  Sun,
  Save,
  Shield,
  Mail,
  AlertCircle
} from 'lucide-react';
import {
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';
import { auth, db } from '../config/firebase';
import Card from '../components/Card';

const Settings = () => {
  const { currentUser } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const { showToast } = useToast();

  // Loading states
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [themeLoading, setThemeLoading] = useState(false);

  // Profile data from Firestore
  const [profileData, setProfileData] = useState({
    displayName: '',
    email: '',
    role: '',
    uid: ''
  });

  // Password form data
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Validation errors
  const [passwordErrors, setPasswordErrors] = useState({});

  // Load user profile from Firestore
  useEffect(() => {
    const loadUserProfile = async () => {
      if (!currentUser) return;

      try {
        setLoading(true);
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          setProfileData({
            displayName: userData.displayName || currentUser.displayName || userData.name || '',
            email: currentUser.email || '',
            role: userData.role || 'user',
            uid: currentUser.uid
          });
        } else {
          setProfileData({
            displayName: currentUser.displayName || '',
            email: currentUser.email || '',
            role: 'user',
            uid: currentUser.uid
          });
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        showToast('Failed to load profile data', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadUserProfile();
  }, [currentUser, showToast]);

  // Handle profile update
  const handleProfileUpdate = async (e) => {
    e.preventDefault();

    if (!currentUser) {
      showToast('No user logged in', 'error');
      return;
    }

    if (!profileData.displayName.trim()) {
      showToast('Display name cannot be empty', 'error');
      return;
    }

    setProfileLoading(true);

    try {
      // Update Firebase Auth displayName
      await updateProfile(currentUser, {
        displayName: profileData.displayName
      });

      // Update Firestore user document
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, {
        displayName: profileData.displayName,
        name: profileData.displayName // Keep 'name' field in sync
      });

      showToast('Profile updated successfully', 'success');
    } catch (error) {
      console.error('Error updating profile:', error);
      showToast(error.message || 'Failed to update profile', 'error');
    } finally {
      setProfileLoading(false);
    }
  };

  // Validate password form
  const validatePasswordForm = () => {
    const errors = {};

    if (!passwordData.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }

    if (!passwordData.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (passwordData.newPassword.length < 6) {
      errors.newPassword = 'Password must be at least 6 characters';
    }

    if (!passwordData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (passwordData.currentPassword && passwordData.newPassword &&
      passwordData.currentPassword === passwordData.newPassword) {
      errors.newPassword = 'New password must be different from current password';
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle password update
  const handlePasswordUpdate = async (e) => {
    e.preventDefault();

    if (!currentUser) {
      showToast('No user logged in', 'error');
      return;
    }

    if (!validatePasswordForm()) {
      return;
    }

    setPasswordLoading(true);

    try {
      // Reauthenticate user with current password
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        passwordData.currentPassword
      );

      await reauthenticateWithCredential(currentUser, credential);

      // Update password
      await updatePassword(currentUser, passwordData.newPassword);

      showToast('Password updated successfully', 'success');

      // Clear form
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setPasswordErrors({});
    } catch (error) {
      console.error('Error updating password:', error);

      // Handle specific Firebase errors
      if (error.code === 'auth/wrong-password') {
        setPasswordErrors({ currentPassword: 'Current password is incorrect' });
        showToast('Current password is incorrect', 'error');
      } else if (error.code === 'auth/weak-password') {
        setPasswordErrors({ newPassword: 'Password is too weak' });
        showToast('Password is too weak', 'error');
      } else if (error.code === 'auth/requires-recent-login') {
        showToast('Please log out and log in again to change your password', 'error');
      } else {
        showToast(error.message || 'Failed to update password', 'error');
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  // Handle theme toggle and save to Firestore
  const handleThemeToggle = async () => {
    if (!currentUser) {
      toggleTheme();
      return;
    }

    setThemeLoading(true);

    try {
      // Toggle theme immediately for better UX
      toggleTheme();

      // Save to Firestore
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, {
        theme: !isDarkMode ? 'dark' : 'light'
      });
    } catch (error) {
      console.error('Error saving theme preference:', error);
      // Don't show error toast for theme toggle, just log it
      // Theme still works via localStorage
    } finally {
      setThemeLoading(false);
    }
  };

  // Skeleton loader for profile section
  const ProfileSkeleton = () => (
    <div className="space-y-4">
      <div className="animate-pulse">
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/4 mb-2" />
        <div className="h-10 bg-gray-300 dark:bg-gray-600 rounded" />
      </div>
      <div className="animate-pulse">
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/4 mb-2" />
        <div className="h-10 bg-gray-300 dark:bg-gray-600 rounded" />
      </div>
      <div className="animate-pulse">
        <div className="h-10 bg-gray-300 dark:bg-gray-600 rounded w-32" />
      </div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white flex items-center">
          <SettingsIcon className="w-8 h-8 mr-3 text-primary-600" />
          Settings
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Profile Settings */}
      <Card className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-primary-100 dark:bg-primary-900/20 rounded-lg">
            <User className="w-6 h-6 text-primary-600 dark:text-primary-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Profile Information
          </h2>
        </div>

        {loading ? (
          <ProfileSkeleton />
        ) : (
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Display Name
              </label>
              <input
                type="text"
                value={profileData.displayName}
                onChange={(e) => setProfileData({ ...profileData, displayName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="Enter your name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={profileData.email}
                disabled
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 dark:text-gray-400 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Email cannot be changed
              </p>
            </div>

            <button
              type="submit"
              disabled={profileLoading}
              className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white px-6 py-2 rounded-lg transition-colors disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              <span>{profileLoading ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </form>
        )}
      </Card>

      {/* Password Settings */}
      <Card className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-primary-100 dark:bg-primary-900/20 rounded-lg">
            <Lock className="w-6 h-6 text-primary-600 dark:text-primary-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Change Password
          </h2>
        </div>

        <form onSubmit={handlePasswordUpdate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Current Password
            </label>
            <input
              type="password"
              value={passwordData.currentPassword}
              onChange={(e) => {
                setPasswordData({ ...passwordData, currentPassword: e.target.value });
                setPasswordErrors({ ...passwordErrors, currentPassword: '' });
              }}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${passwordErrors.currentPassword
                  ? 'border-red-500 dark:border-red-500'
                  : 'border-gray-300 dark:border-gray-600'
                }`}
              placeholder="Enter current password"
            />
            {passwordErrors.currentPassword && (
              <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {passwordErrors.currentPassword}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              New Password
            </label>
            <input
              type="password"
              value={passwordData.newPassword}
              onChange={(e) => {
                setPasswordData({ ...passwordData, newPassword: e.target.value });
                setPasswordErrors({ ...passwordErrors, newPassword: '' });
              }}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${passwordErrors.newPassword
                  ? 'border-red-500 dark:border-red-500'
                  : 'border-gray-300 dark:border-gray-600'
                }`}
              placeholder="Enter new password (min. 6 characters)"
            />
            {passwordErrors.newPassword && (
              <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {passwordErrors.newPassword}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Confirm New Password
            </label>
            <input
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) => {
                setPasswordData({ ...passwordData, confirmPassword: e.target.value });
                setPasswordErrors({ ...passwordErrors, confirmPassword: '' });
              }}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${passwordErrors.confirmPassword
                  ? 'border-red-500 dark:border-red-500'
                  : 'border-gray-300 dark:border-gray-600'
                }`}
              placeholder="Confirm new password"
            />
            {passwordErrors.confirmPassword && (
              <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {passwordErrors.confirmPassword}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={passwordLoading}
            className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white px-6 py-2 rounded-lg transition-colors disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            <span>{passwordLoading ? 'Updating...' : 'Update Password'}</span>
          </button>
        </form>
      </Card>

      {/* Appearance Settings */}
      <Card className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-primary-100 dark:bg-primary-900/20 rounded-lg">
            {isDarkMode ? (
              <Moon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            ) : (
              <Sun className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            )}
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Appearance
          </h2>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-900 dark:text-white">Dark Mode</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Toggle between light and dark theme
            </p>
          </div>
          <button
            onClick={handleThemeToggle}
            disabled={themeLoading}
            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${isDarkMode ? 'bg-primary-600' : 'bg-gray-300'
              } ${themeLoading ? 'opacity-50 cursor-wait' : ''}`}
            aria-label="Toggle dark mode"
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${isDarkMode ? 'translate-x-7' : 'translate-x-1'
                }`}
            />
          </button>
        </div>
      </Card>

      {/* Account Info */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Account Information
        </h2>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700 animate-pulse">
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/4" />
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
              <span className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                User ID
              </span>
              <span className="text-gray-900 dark:text-white font-mono text-sm break-all max-w-xs text-right">
                {profileData.uid}
              </span>
            </div>

            <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
              <span className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email
              </span>
              <span className="text-gray-900 dark:text-white text-sm">
                {profileData.email}
              </span>
            </div>

            <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
              <span className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                <User className="w-4 h-4" />
                Display Name
              </span>
              <span className="text-gray-900 dark:text-white text-sm">
                {profileData.displayName || 'Not set'}
              </span>
            </div>

            <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
              <span className="text-gray-600 dark:text-gray-400">Account Type</span>
              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400">
                {profileData.role.charAt(0).toUpperCase() + profileData.role.slice(1)}
              </span>
            </div>

            <div className="flex justify-between py-2">
              <span className="text-gray-600 dark:text-gray-400">Status</span>
              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                Active
              </span>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Settings;
