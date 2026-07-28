import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import {
  Calendar,
  BookOpen,
  Users,
  Award,
  GraduationCap,
  UserCheck,
} from 'lucide-react';

export const PortalHomeShell: React.FC = () => {
  const academicModules = [
    {
      title: 'Academic Sessions',
      desc: 'Manage school years, start/end dates, and switch active current session.',
      to: '/portal/academic-sessions',
      icon: Calendar,
      color: 'bg-indigo-50 text-indigo-600',
    },
    {
      title: 'Classes',
      desc: 'Configure grade levels (Nursery to Class 10), order sequence & auto-generated codes.',
      to: '/portal/classes',
      icon: BookOpen,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      title: 'Sections',
      desc: 'Create class sections, assign room numbers and set student capacities.',
      to: '/portal/sections',
      icon: Users,
      color: 'bg-emerald-50 text-emerald-600',
    },
    {
      title: 'Global Subjects',
      desc: 'Manage school-wide master subjects, short codes, and THEORY/PRACTICAL types.',
      to: '/portal/subjects',
      icon: Award,
      color: 'bg-amber-50 text-amber-600',
    },
    {
      title: 'Teachers',
      desc: 'Faculty profiles with auto-generated employee IDs (TCH-0001) and photos.',
      to: '/portal/teachers',
      icon: GraduationCap,
      color: 'bg-purple-50 text-purple-600',
    },
    {
      title: 'Teaching Assignments',
      desc: 'Assign teachers to classes & sections and designate Class Teachers.',
      to: '/portal/teaching-assignments',
      icon: UserCheck,
      color: 'bg-rose-50 text-rose-600',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Card
        title="Little Angels School — ERP Portal"
        subtitle="Operational Management System for Pre-Primary up to Class 10"
      >
        <div className="p-4 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-900 text-sm mb-6">
          <p className="font-semibold">
            ✅ Phase 3: Academic Foundation & Master Data Active
          </p>
          <p className="mt-1 text-xs leading-relaxed text-indigo-700">
            All academic master data entities are configured with strict single-school architecture,
            global subjects, auto-generated codes, and soft archiving.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {academicModules.map((mod) => {
            const Icon = mod.icon;
            return (
              <Link
                key={mod.to}
                to={mod.to}
                className="group p-5 rounded-xl border border-slate-200 hover:border-indigo-500 bg-white hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${mod.color}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {mod.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                    {mod.desc}
                  </p>
                </div>
                <div className="mt-4 text-xs font-semibold text-indigo-600 group-hover:translate-x-0.5 transition-transform">
                  Manage →
                </div>
              </Link>
            );
          })}
        </div>
      </Card>
    </div>
  );
};
