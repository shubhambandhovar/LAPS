import React, { useEffect, useState } from 'react';
import { apiClient } from '../../lib/api';
import {
  Sliders,
  CheckCircle2,
  AlertCircle,
  Save,
  Bell,
  Mail,
  Smartphone,
} from 'lucide-react';

interface CategoryPreference {
  inApp: boolean;
  email: boolean;
  sms: boolean;
}

interface PreferencesMap {
  attendance: CategoryPreference;
  homework: CategoryPreference;
  exam: CategoryPreference;
  result: CategoryPreference;
  fee: CategoryPreference;
  general: CategoryPreference;
  system: CategoryPreference;
}

const CATEGORY_LABELS: Record<keyof PreferencesMap, { title: string; desc: string }> = {
  attendance: {
    title: 'Attendance Alerts',
    desc: 'Daily absence alerts, late arrival notifications, and monthly attendance summaries',
  },
  homework: {
    title: 'Homework & Assignments',
    desc: 'New homework postings, submission reminders, and graded rubric reviews',
  },
  exam: {
    title: 'Examinations & Timetables',
    desc: 'Exam schedule releases, hall ticket availability, and room seating alerts',
  },
  result: {
    title: 'Results & Report Cards',
    desc: 'Published marks, report card availability, and promotion decisions',
  },
  fee: {
    title: 'Fee Management & Finance',
    desc: 'Invoice generation, installment due date reminders, and payment receipts',
  },
  general: {
    title: 'General Announcements',
    desc: 'Campus events, holiday notices, and non-academic circulars',
  },
  system: {
    title: 'System Notifications',
    desc: 'Account security alerts, password resets, and login notifications',
  },
};

export const NotificationPreferences: React.FC = () => {
  const [preferences, setPreferences] = useState<PreferencesMap>({
    attendance: { inApp: true, email: true, sms: true },
    homework: { inApp: true, email: true, sms: true },
    exam: { inApp: true, email: true, sms: true },
    result: { inApp: true, email: true, sms: true },
    fee: { inApp: true, email: true, sms: true },
    general: { inApp: true, email: true, sms: true },
    system: { inApp: true, email: true, sms: true },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchMyPreferences = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/preferences/my');
      if (res.data.data?.preferences) {
        setPreferences(res.data.data.preferences);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load notification preferences');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyPreferences();
  }, []);

  const handleToggle = (
    categoryKey: keyof PreferencesMap,
    channel: keyof CategoryPreference
  ) => {
    setPreferences((prev) => ({
      ...prev,
      [categoryKey]: {
        ...prev[categoryKey],
        [channel]: !prev[categoryKey][channel],
      },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await apiClient.put('/preferences/my', preferences);
      setSuccessMsg('Your notification preferences have been saved successfully');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update preferences');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-sky-50 text-sky-600 rounded-xl">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notification Preferences</h1>
            <p className="text-sm text-gray-500">
              Customize your opt-in channels for institutional alerts and academic updates
            </p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center space-x-2 px-5 py-2.5 bg-sky-600 text-white rounded-lg hover:bg-sky-700 font-semibold text-sm transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving Changes...' : 'Save Preferences'}</span>
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-3 text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center space-x-3 text-emerald-700">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading your preferences...</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between text-xs font-bold uppercase text-gray-500">
            <span className="w-1/2">Notification Category</span>
            <div className="w-1/2 flex items-center justify-end space-x-8 pr-4">
              <span className="flex items-center space-x-1">
                <Bell className="w-3.5 h-3.5" />
                <span>In-App</span>
              </span>
              <span className="flex items-center space-x-1">
                <Mail className="w-3.5 h-3.5" />
                <span>Email</span>
              </span>
              <span className="flex items-center space-x-1">
                <Smartphone className="w-3.5 h-3.5" />
                <span>SMS</span>
              </span>
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {(Object.keys(CATEGORY_LABELS) as (keyof PreferencesMap)[]).map((catKey) => {
              const meta = CATEGORY_LABELS[catKey];
              const val = preferences[catKey];
              return (
                <div key={catKey} className="p-4 flex items-center justify-between hover:bg-gray-50/50">
                  <div className="w-1/2 pr-4">
                    <h3 className="text-sm font-bold text-gray-900">{meta.title}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{meta.desc}</p>
                  </div>

                  <div className="w-1/2 flex items-center justify-end space-x-12 pr-6">
                    <input
                      type="checkbox"
                      checked={val.inApp}
                      onChange={() => handleToggle(catKey, 'inApp')}
                      className="w-4 h-4 text-sky-600 rounded border-gray-300 focus:ring-sky-500"
                    />
                    <input
                      type="checkbox"
                      checked={val.email}
                      onChange={() => handleToggle(catKey, 'email')}
                      className="w-4 h-4 text-sky-600 rounded border-gray-300 focus:ring-sky-500"
                    />
                    <input
                      type="checkbox"
                      checked={val.sms}
                      onChange={() => handleToggle(catKey, 'sms')}
                      className="w-4 h-4 text-sky-600 rounded border-gray-300 focus:ring-sky-500"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
