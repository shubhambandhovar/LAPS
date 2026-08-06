import React from 'react';
import { ForbiddenShell } from '../errors/ForbiddenShell';

export const UnauthorizedShell: React.FC = () => {
  return <ForbiddenShell />;
};
