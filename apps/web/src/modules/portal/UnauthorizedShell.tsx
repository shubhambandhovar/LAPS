import React from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Link } from 'react-router-dom';

export const UnauthorizedShell: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <Card title="403 Unauthorized Access" subtitle="Little Angels School — Security Portal">
          <p className="text-sm text-slate-600 mb-6">
            You do not have permission to view this resource. Role-Based Access Control (RBAC) will
            be enforced starting in Phase 2.
          </p>
          <Link to="/">
            <Button variant="secondary" className="w-full">
              Return to Website
            </Button>
          </Link>
        </Card>
      </div>
    </div>
  );
};
