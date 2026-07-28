import React from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Link } from 'react-router-dom';

export const NotFoundShell: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <Card title="404 — Page Not Found" subtitle="Little Angels School">
          <p className="text-sm text-slate-600 mb-6">
            The requested page does not exist in the Phase 1 application shell.
          </p>
          <Link to="/">
            <Button variant="primary" className="w-full">
              Return to Home
            </Button>
          </Link>
        </Card>
      </div>
    </div>
  );
};
