import React from 'react';
import { Link } from 'react-router-dom';
import { BadgeCheck, LayoutTemplate, Printer, Users, UserSquare, Download, ArrowUpRight } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { motion } from 'framer-motion';
import { usePermissions } from '../../../hooks/usePermissions';

export const IdCardDashboard: React.FC = () => {
  const { can } = usePermissions();

  const actions = [
    {
      title: 'Template Builder',
      description: 'Design and customize digital ID card layouts for different roles.',
      icon: LayoutTemplate,
      link: '/portal/id-cards/templates',
      color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      permission: 'id_card.create',
    },
    {
      title: 'Bulk Generator',
      description: 'Generate ID cards in bulk for new admissions or staff.',
      icon: Users,
      link: '/portal/id-cards/bulk-generate',
      color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
      permission: 'id_card.create',
    },
    {
      title: 'Print Center',
      description: 'Print physical PVC CR80 standard ID cards.',
      icon: Printer,
      link: '/portal/id-cards/print',
      color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      permission: 'id_card.read',
    },
    {
      title: 'Download Center',
      description: 'Export digital passes as PDF or high-resolution PNGs.',
      icon: Download,
      link: '/portal/id-cards/downloads',
      color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      permission: 'id_card.read',
    },
    {
      title: 'My Digital ID',
      description: 'View and download your personal Digital ID Card.',
      icon: UserSquare,
      link: '/portal/id-cards/my-card',
      color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
      permission: 'id_card.self', // Not technically a permission we enforce strictly, but available to everyone
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
            <BadgeCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">ID Card Management</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Design templates, generate bulk digital identities, and manage PVC printing.
            </p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {actions
          .filter((a) => a.permission === 'id_card.self' || can(a.permission))
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
