import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, LayoutTemplate, History, PlusCircle, ArrowUpRight } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { motion } from 'framer-motion';
import { usePermissions } from '../../../hooks/usePermissions';

export const DocumentDashboard: React.FC = () => {
  const { can } = usePermissions();

  const actions = [
    {
      title: 'Template Builder',
      description: 'Design A4, Letter, and Legal document templates.',
      icon: LayoutTemplate,
      link: '/portal/documents/templates',
      color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      permission: 'document.template.manage',
    },
    {
      title: 'Issue Document',
      description: 'Generate Bonafides, TCs, Marks Sheets, and Letters.',
      icon: PlusCircle,
      link: '/portal/documents/generate',
      color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
      permission: 'document.issue',
    },
    {
      title: 'Document Ledger',
      description: 'Audit logs of all generated certificates and their status.',
      icon: History,
      link: '/portal/documents/history',
      color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      permission: 'document.read',
    },
    {
      title: 'My Documents',
      description: 'View and download documents issued to you.',
      icon: FileText,
      link: '/portal/documents/my-documents',
      color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
      permission: 'document.self',
    },
  ];

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 rounded-xl">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Document Center</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Manage and generate official school certificates and documents.
            </p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {actions
          .filter((a) => a.permission === 'document.self' || can(a.permission))
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
                      <ArrowUpRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition-colors" />
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
    </div>
  );
};
