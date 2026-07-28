import React, { useState, useEffect } from 'react';
import { RefreshSessionInfo, ApiResponse } from '@laps/shared';
import { apiClient } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/feedback/Spinner';
import {
  Laptop,
  Smartphone,
  ShieldAlert,
  LogOut,
  Trash2,
  X,
  CheckCircle2,
} from 'lucide-react';

export interface SessionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SessionsModal: React.FC<SessionsModalProps> = ({ isOpen, onClose }) => {
  const { logoutAll } = useAuth();
  const [sessions, setSessions] = useState<RefreshSessionInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [isLoggingOutAll, setIsLoggingOutAll] = useState(false);

  const fetchSessions = async () => {
    setLoading(true);
    setActionError(null);
    try {
      const res = await apiClient.get<ApiResponse<RefreshSessionInfo[]>>(
        '/auth/sessions',
      );
      if (res.data?.data) {
        setSessions(res.data.data);
      }
    } catch {
      setActionError('Failed to load active sessions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      void fetchSessions();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRevokeSession = async (sessionId: string) => {
    setRevokingId(sessionId);
    setActionError(null);
    try {
      await apiClient.delete(`/auth/sessions/${sessionId}`);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch {
      setActionError('Failed to revoke session. Please try again.');
    } finally {
      setRevokingId(null);
    }
  };

  const handleLogoutAll = async () => {
    setIsLoggingOutAll(true);
    setActionError(null);
    try {
      await logoutAll();
      onClose();
    } catch {
      setActionError('Failed to log out all sessions.');
      setIsLoggingOutAll(false);
    }
  };

  const getDeviceIcon = (deviceInfo: string) => {
    const lower = deviceInfo.toLowerCase();
    if (lower.includes('iphone') || lower.includes('android') || lower.includes('ipad')) {
      return <Smartphone className="w-5 h-5 text-indigo-500" />;
    }
    return <Laptop className="w-5 h-5 text-indigo-500" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-indigo-600" />
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Multi-Device Active Sessions
              </h2>
              <p className="text-xs text-slate-500">
                Manage your active logins and session families across devices
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 max-h-[65vh] overflow-y-auto space-y-4">
          {actionError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
              {actionError}
            </div>
          )}

          {loading ? (
            <div className="py-12 text-center">
              <Spinner size="md" className="text-indigo-600 mx-auto" />
              <p className="text-xs text-slate-500 mt-2">Loading active sessions...</p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-sm">
              No active sessions found.
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className={`p-4 rounded-xl border transition-all flex items-center justify-between gap-4 ${
                    session.isCurrent
                      ? 'bg-indigo-50/60 border-indigo-200'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="p-2.5 rounded-lg bg-slate-100 shrink-0">
                      {getDeviceIcon(session.deviceInfo)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-slate-900 truncate">
                          {session.deviceInfo}
                        </span>
                        {session.isCurrent && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-100 text-indigo-700 border border-indigo-200">
                            <CheckCircle2 className="w-3 h-3" />
                            Current Device
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        IP: <span className="font-mono">{session.ipAddress}</span> •{' '}
                        Family ID:{' '}
                        <span className="font-mono text-[10px] text-slate-400">
                          {session.sessionFamilyId.slice(0, 8)}...
                        </span>
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Active:{' '}
                        {session.lastUsedAt
                          ? new Date(session.lastUsedAt).toLocaleString()
                          : 'Just now'}
                      </p>
                    </div>
                  </div>

                  {!session.isCurrent && (
                    <Button
                      variant="secondary"
                      onClick={() => handleRevokeSession(session.id)}
                      disabled={revokingId === session.id}
                      className="shrink-0 text-xs text-red-600 hover:bg-red-50 hover:border-red-200"
                    >
                      {revokingId === session.id ? (
                        <Spinner size="sm" />
                      ) : (
                        <span className="flex items-center gap-1.5">
                          <Trash2 className="w-3.5 h-3.5" />
                          Revoke
                        </span>
                      )}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50">
          <p className="text-xs text-slate-500">
            Revoking a session family invalidates refresh tokens on that device.
          </p>
          <div className="flex items-center gap-2.5">
            <Button variant="secondary" onClick={onClose} className="text-xs">
              Close
            </Button>
            <Button
              variant="primary"
              onClick={handleLogoutAll}
              disabled={isLoggingOutAll}
              className="text-xs bg-red-600 hover:bg-red-700 text-white shadow-sm"
            >
              <LogOut className="w-3.5 h-3.5 mr-1.5" />
              {isLoggingOutAll ? 'Revoking All...' : 'Log Out All Devices'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
