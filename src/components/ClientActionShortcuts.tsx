import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  Target, 
  ShieldAlert, 
  UserCircle, 
  Heart,
  PlusCircle
} from 'lucide-react';

interface ClientActionShortcutsProps {
  clienteId: string;
}

export function ClientActionShortcuts({ clienteId }: ClientActionShortcutsProps) {
  const navigate = useNavigate();

  const shortcuts = [
    {
      title: 'Roda da Vida',
      icon: <Activity className="w-4 h-4" />,
      path: `/RodaDaVida?clienteId=${clienteId}`,
      color: 'text-blue-600',
      bg: 'bg-blue-50'
    },
    {
      title: 'Meta SMART',
      icon: <Target className="w-4 h-4" />,
      path: `/MetaSmart?clienteId=${clienteId}`,
      color: 'text-green-600',
      bg: 'bg-green-50'
    },
    {
      title: 'Análise SWOT',
      icon: <ShieldAlert className="w-4 h-4" />,
      path: `/AnaliseSwot?clienteId=${clienteId}`,
      color: 'text-purple-600',
      bg: 'bg-purple-50'
    },
    {
      title: 'Perfil DISC',
      icon: <UserCircle className="w-4 h-4" />,
      path: `/PerfilDisc?clienteId=${clienteId}`,
      color: 'text-orange-600',
      bg: 'bg-orange-50'
    },
    {
      title: 'Valores Pessoais',
      icon: <Heart className="w-4 h-4" />,
      path: `/ValoresPessoais?clienteId=${clienteId}`,
      color: 'text-red-600',
      bg: 'bg-red-50'
    },
    {
      title: 'Novo PDI',
      icon: <Target className="w-4 h-4" />,
      path: `/ferramentas/pdi?clienteId=${clienteId}`,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50'
    },
    {
      title: 'Agendar Sessão',
      icon: <PlusCircle className="w-4 h-4" />,
      path: `/Agendamentos?clienteId=${clienteId}`,
      color: 'text-blue-600',
      bg: 'bg-blue-50'
    }
  ];

  return (
    <Card className="bg-white/60 backdrop-blur-sm border-slate-200 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <PlusCircle className="w-4 h-4 text-blue-600" />
          Ações Rápidas
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-2">
        {shortcuts.map((shortcut, index) => (
          <Button
            key={index}
            variant="ghost"
            className={`w-full justify-start gap-3 h-10 hover:${shortcut.bg} hover:${shortcut.color} transition-all`}
            onClick={() => navigate(shortcut.path)}
          >
            <div className={`p-1.5 rounded-md ${shortcut.bg} ${shortcut.color}`}>
              {shortcut.icon}
            </div>
            <span className="text-sm font-medium">{shortcut.title}</span>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}
