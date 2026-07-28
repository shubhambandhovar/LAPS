import { useAuthContext, AuthContextType } from '../context/AuthContext';

export function useAuth(): AuthContextType {
  return useAuthContext();
}
