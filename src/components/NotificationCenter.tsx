import React from 'react';
import { Bell, Info, AlertTriangle, CheckCircle2, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useNotifications, Notification } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function NotificationCenter() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'info': return <Info className="w-4 h-4 text-blue-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'success': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      default: return <Info className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="relative hover:bg-slate-100 rounded-full p-2 transition-colors outline-none">
        <Bell className="w-5 h-5 text-slate-600" />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
            {unreadCount}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0 border-none shadow-2xl shadow-slate-200/80">
        <div className="flex items-center justify-between p-4 border-b border-slate-50">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="p-0 font-bold text-slate-800">Notificações</DropdownMenuLabel>
          </DropdownMenuGroup>
          {unreadCount > 0 && (
            <button 
              onClick={(e) => {
                e.preventDefault();
                markAllAsRead();
              }}
              className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
            >
              Marcar todas como lidas
            </button>
          )}
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <Bell className="w-6 h-6 text-slate-300" />
              </div>
              <p className="text-sm text-slate-500">Nenhuma notificação no momento.</p>
            </div>
          ) : (
            notifications.map((n) => (
              <DropdownMenuItem 
                key={n.id} 
                className={cn(
                  "flex flex-col items-start p-4 gap-1 cursor-pointer transition-colors focus:bg-slate-50",
                  !n.read && "bg-blue-50/30"
                )}
                onClick={() => markAsRead(n.id)}
              >
                <div className="flex items-center gap-2 w-full">
                  {getIcon(n.type)}
                  <span className={cn("text-sm font-semibold text-slate-800", !n.read && "text-blue-900")}>
                    {n.title}
                  </span>
                  {!n.read && <span className="w-2 h-2 rounded-full bg-blue-500 ml-auto" />}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {n.message}
                </p>
                <span className="text-[10px] text-slate-400 mt-1 font-medium">
                  {n.createdAt?.toDate ? formatDistanceToNow(n.createdAt.toDate(), { addSuffix: true, locale: ptBR }) : 'Agora'}
                </span>
              </DropdownMenuItem>
            ))
          )}
        </div>
        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator className="bg-slate-50" />
            <div className="p-2">
              <Button 
                variant="ghost" 
                className="w-full text-xs text-slate-500 hover:text-slate-800 h-8"
                onClick={() => window.location.href = '/notificacoes'}
              >
                Ver todo o histórico
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
