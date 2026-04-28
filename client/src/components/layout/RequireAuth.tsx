import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface RequireAuthProps {
  children: React.ReactNode;
}

export function RequireAuth({ children }: RequireAuthProps) {
  const { coach, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#40A2C0] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!coach) {
    return <Navigate to="/coach" replace />;
  }

  return <>{children}</>;
}
