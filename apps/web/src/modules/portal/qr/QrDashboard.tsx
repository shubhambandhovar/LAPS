import React from 'react';
import { Link } from 'react-router-dom';
import { QrCode, ScanLine, Printer, History, ShieldAlert, ArrowUpRight } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { motion } from 'framer-motion';
import { usePermissions } from '../../../hooks/usePermissions';

export const QrDashboard: React.FC = () => {
  const { can } = usePermissions();

  const actions = [
    {
      title: 'Digital ID Generator',
      description: 'Generate & print Student, Staff, and Visitor QR ID Cards.',
      icon: Printer,
      link: '/portal/qr/id-cards',
      color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
      permission: 'qr.create',
    },
    {
      title: 'Universal Scanner',
      description: 'Scan any Institutional QR Code to resolve and take action.',
      icon: ScanLine,
      link: '/portal/qr/scan',
      color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
      permission: 'qr.scan',
    },
    {
      title: 'Scan Audit Logs',
      description: 'View the history of all QR scans, including location and device.',
      icon: History,
      link: '/portal/qr/history',
      color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      permission: 'qr.read',
    },
  ];

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 rounded-xl">
            <QrCode className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">QR Code & Identity Center</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Manage digital identities, print PVC cards, and audit institutional QR code scans.
            </p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {actions
          .filter((a) => can(a.permission))
          .map((action, idx) => {
            const Icon = action.icon;
            return (
              <motion.div
                key={action.title}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Link to={action.link} className="block group h-full">
                  <Card className="p-6 h-full hover:shadow-md transition-shadow border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <div className="flex justify-between items-start mb-4">
                      <div className={`p-3 rounded-xl ${action.color}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <ArrowUpRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                      {action.title}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {action.description}
                    </p>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 mb-4">
            <ShieldAlert className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Security Posture</h3>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            All generated QR codes use cryptographically secure 64-character tokens. No PII (Personally Identifiable Information) is embedded inside the barcode image, preventing data leakage if a card is lost.
          </p>
          <ul className="text-sm text-slate-500 space-y-2 list-disc list-inside">
            <li>State-backed token validation via MongoDB.</li>
            <li>Instant revocation of compromised or expired passes.</li>
            <li>Role-Based Access Control enforced on scan resolution.</li>
          </ul>
        </Card>
      </div>
    </div>
  );
};
