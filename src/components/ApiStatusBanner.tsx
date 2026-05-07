import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, Activity, CheckCircle2, ChevronRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface SystemStatusItem {
  status?: 'ok' | 'error' | 'warning' | 'initializing';
  enabled?: boolean;
  message: string;
}

interface SystemStatus {
  firebase: SystemStatusItem;
  resend: SystemStatusItem;
  stripe: SystemStatusItem;
  mercadopago: SystemStatusItem;
  googleOAuth: SystemStatusItem;
}

export const ApiStatusBanner: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [isVisible, setIsVisible] = React.useState(true);

  const { data: health, isLoading } = useQuery<SystemStatus>({
    queryKey: ['system-health'],
    queryFn: async () => {
      const token = await user?.getIdToken();
      const response = await fetch('/api/admin/health', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch health');
      return response.json();
    },
    enabled: !!user && isAdmin,
    refetchInterval: 60000 // Refresh every minute
  });

  if (!isAdmin || !isVisible || isLoading || !health) return null;

  const issues = Object.entries(health).filter(([key, value]) => {
    // Firebase status check
    if (key === 'firebase' && (value.status === 'error' || value.status === 'warning')) return true;
    
    // Integration checks (only show if they are expected to be enabled but aren't)
    // Actually, for a health banner, we want to know if something is MISSING but requested by the PRD.
    if (key !== 'firebase' && value.enabled === false) return true;
    
    return false;
  });

  if (issues.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className="bg-amber-50 border-b border-amber-200 overflow-hidden"
      >
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="bg-amber-100 p-1.5 rounded-full shrink-0">
              <AlertCircle className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-sm text-amber-800 truncate">
              <span className="font-bold mr-1">Diagnóstico de Sistema:</span>
              <span className="opacity-90">
                {issues.length} {issues.length === 1 ? 'item requer' : 'itens requerem'} atenção nas configurações.
              </span>
            </div>
            <div className="hidden md:flex gap-1">
              {issues.slice(0, 3).map(([key, _]) => (
                <Badge key={key} variant="outline" className="bg-white/50 border-amber-200 text-amber-700 text-[10px] uppercase h-5">
                  {key}
                </Badge>
              ))}
              {issues.length > 3 && <span className="text-[10px] text-amber-500">+{issues.length - 3}</span>}
            </div>
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 text-amber-700 hover:bg-amber-100 font-bold text-xs"
              onClick={() => window.location.href = '/AdminPanel'}
            >
              Ver Detalhes
              <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
            <button 
              onClick={() => setIsVisible(false)}
              className="p-1 hover:bg-amber-100 rounded-full text-amber-500 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
