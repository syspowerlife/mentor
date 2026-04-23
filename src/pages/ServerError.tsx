import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Home, RefreshCcw } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function ServerError() {
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="mx-auto w-24 h-24 bg-red-100 text-red-600 rounded-full flex items-center justify-center shadow-lg shadow-red-100">
          <AlertTriangle className="w-12 h-12" />
        </div>
        
        <div className="space-y-3">
          <h1 className="text-3xl font-bold text-slate-900">Erro de Sistema</h1>
          <p className="text-slate-500">
            Desculpe, algo deu errado em nossos servidores. Nossa equipe técnica já foi notificada e está trabalhando para resolver.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={handleRefresh} variant="outline" className="gap-2">
            <RefreshCcw className="w-4 h-4" />
            Tentar Novamente
          </Button>
          <Link 
            to="/Dashboard" 
            className={cn(buttonVariants({ variant: "default" }), "gap-2 bg-blue-600 hover:bg-blue-700")}
          >
            <Home className="w-4 h-4" />
            Ir para o Início
          </Link>
        </div>

        <p className="text-xs text-slate-400">
          Código do Erro: 500_INTERNAL_SERVER_ERROR
        </p>
      </div>
    </div>
  );
}
