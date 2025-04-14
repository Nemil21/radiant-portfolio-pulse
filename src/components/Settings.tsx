import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateUserSettings } from '../store/slices/userSlice';
import type { RootState } from '../store';

export default function Settings() {
  const dispatch = useDispatch();
  const { profile, loading } = useSelector((state: RootState) => state.user);
  const [isSaving, setIsSaving] = useState(false);

  const [settings, setSettings] = useState({
    theme: profile?.theme || 'light',
    currency: profile?.currency || 'USD',
    displayPreferences: profile?.display_preferences || {
      showPortfolioValue: true,
      showPercentageChange: true,
      defaultTimeframe: '1M',
    },
    notificationPreferences: profile?.notification_preferences || {
      emailAlerts: true,
      priceAlerts: true,
      newsAlerts: false,
      portfolioSummary: 'weekly',
    },
  });

  const handleThemeChange = (theme: string) => {
    setSettings((prev) => ({ ...prev, theme }));
    // Apply theme immediately
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
  };

  const handleCurrencyChange = (currency: string) => {
    setSettings((prev) => ({ ...prev, currency }));
  };

  const handleDisplayPreferenceChange = (key: string, value: boolean | string) => {
    setSettings((prev) => ({
      ...prev,
      displayPreferences: {
        ...prev.displayPreferences,
        [key]: value,
      },
    }));
  };

  const handleNotificationPreferenceChange = (key: string, value: boolean | string) => {
    setSettings((prev) => ({
      ...prev,
      notificationPreferences: {
        ...prev.notificationPreferences,
        [key]: value,
      },
    }));
  };

  const handleSave = async () => {
    if (!profile?.id) return;

    setIsSaving(true);
    try {
      await dispatch(updateUserSettings({
        userId: profile.id,
        theme: settings.theme,
        currency: settings.currency,
        displayPreferences: settings.displayPreferences,
        notificationPreferences: settings.notificationPreferences,
      })).unwrap();
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-medium mb-4">Appearance</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Theme
            </label>
            <select
              value={settings.theme}
              onChange={(e) => handleThemeChange(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-lg"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Currency
            </label>
            <select
              value={settings.currency}
              onChange={(e) => handleCurrencyChange(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-lg"
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="JPY">JPY (¥)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-medium mb-4">Display Preferences</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">
              Show Portfolio Value
            </label>
            <input
              type="checkbox"
              checked={settings.displayPreferences.showPortfolioValue}
              onChange={(e) => handleDisplayPreferenceChange('showPortfolioValue', e.target.checked)}
              className="h-4 w-4 text-blue-600 rounded border-gray-300"
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">
              Show Percentage Change
            </label>
            <input
              type="checkbox"
              checked={settings.displayPreferences.showPercentageChange}
              onChange={(e) => handleDisplayPreferenceChange('showPercentageChange', e.target.checked)}
              className="h-4 w-4 text-blue-600 rounded border-gray-300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Default Timeframe
            </label>
            <select
              value={settings.displayPreferences.defaultTimeframe}
              onChange={(e) => handleDisplayPreferenceChange('defaultTimeframe', e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-lg"
            >
              <option value="1D">1 Day</option>
              <option value="1W">1 Week</option>
              <option value="1M">1 Month</option>
              <option value="3M">3 Months</option>
              <option value="1Y">1 Year</option>
              <option value="ALL">All Time</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-medium mb-4">Notifications</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">
              Email Alerts
            </label>
            <input
              type="checkbox"
              checked={settings.notificationPreferences.emailAlerts}
              onChange={(e) => handleNotificationPreferenceChange('emailAlerts', e.target.checked)}
              className="h-4 w-4 text-blue-600 rounded border-gray-300"
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">
              Price Alerts
            </label>
            <input
              type="checkbox"
              checked={settings.notificationPreferences.priceAlerts}
              onChange={(e) => handleNotificationPreferenceChange('priceAlerts', e.target.checked)}
              className="h-4 w-4 text-blue-600 rounded border-gray-300"
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">
              News Alerts
            </label>
            <input
              type="checkbox"
              checked={settings.notificationPreferences.newsAlerts}
              onChange={(e) => handleNotificationPreferenceChange('newsAlerts', e.target.checked)}
              className="h-4 w-4 text-blue-600 rounded border-gray-300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Portfolio Summary
            </label>
            <select
              value={settings.notificationPreferences.portfolioSummary}
              onChange={(e) => handleNotificationPreferenceChange('portfolioSummary', e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-lg"
            >
              <option value="never">Never</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
} 