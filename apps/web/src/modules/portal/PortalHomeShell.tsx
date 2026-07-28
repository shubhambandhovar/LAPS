import React from 'react';
import { Card } from '../../components/ui/Card';

export const PortalHomeShell: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card
        title="Little Angels School — ERP Portal Shell"
        subtitle="Operational Management System for Pre-Primary up to Class 10"
      >
        <div className="p-4 rounded-lg bg-primary-50 border border-primary-200 text-primary-700 text-sm">
          <p className="font-semibold">ℹ️ Architectural Status: Phase 1 Shell Active</p>
          <p className="mt-1 text-xs leading-relaxed">
            Per the strict Phase 1 requirements, no fake dashboards or simulated business metrics
            have been rendered. Business modules will be introduced cleanly in their designated
            phases:
          </p>
          <ul className="mt-3 list-disc list-inside space-y-1 text-xs font-mono">
            <li>Phase 2: Authentication, Multi-Device RefreshSession & RBAC</li>
            <li>Phase 3: Academic Sessions & Class/Section Setup</li>
            <li>Phase 4: Student & Guardian Profiles (Normalized StudentGuardian)</li>
            <li>Phase 6: Daily Student Attendance Roster</li>
            <li>Phase 11: Offline Fee Billing & Receipts</li>
          </ul>
        </div>
      </Card>
    </div>
  );
};
