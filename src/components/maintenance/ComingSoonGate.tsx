import { useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ComingSoonPage } from './ComingSoonPage';

interface ComingSoonGateProps {
  children: ReactNode;
}

const ACCESS_KEY = 'wouaka_access_granted';

export function ComingSoonGate({ children }: ComingSoonGateProps) {
  const { role } = useAuth();
  const [isMaintenanceMode, setIsMaintenanceMode] = useState<boolean | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkMaintenanceMode();
    checkStoredAccess();
  }, []);

  const checkMaintenanceMode = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'maintenance_mode')
        .single();

      if (error) throw error;
      setIsMaintenanceMode(data?.value === 'true');
    } catch (error) {
      console.error('Error checking maintenance mode:', error);
      setIsMaintenanceMode(false);
    } finally {
      setIsLoading(false);
    }
  };

  const checkStoredAccess = () => {
    const storedAccess = sessionStorage.getItem(ACCESS_KEY);
    if (storedAccess === 'true') {
      setHasAccess(true);
    }
  };

  const handleAccessGranted = () => {
    sessionStorage.setItem(ACCESS_KEY, 'true');
    setHasAccess(true);
  };

  // Loading state
  if (isLoading || isMaintenanceMode === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse">
          <div className="w-16 h-16 rounded-full bg-primary/20" />
        </div>
      </div>
    );
  }

  // Super admins bypass maintenance mode
  if (role === 'SUPER_ADMIN') {
    return <>{children}</>;
  }

  // Maintenance mode is disabled
  if (!isMaintenanceMode) {
    return <>{children}</>;
  }

  // User has access via password
  if (hasAccess) {
    return <>{children}</>;
  }

  // Show Coming Soon page
  return <ComingSoonPage onAccessGranted={handleAccessGranted} />;
}
