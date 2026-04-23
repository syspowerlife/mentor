import React from 'react';
import { Link } from 'react-router-dom';
import { Ghost, Home, ArrowLeft } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="relative">
          <div className="text-9xl font-black text-slate-200 select-none">404</div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Ghost className="w-24 h-24 text-blue-600 animate-bounce" />
          </div>
        </div>
        
        <div className="space-y-3">
          <h1 className="text-3xl font-bold text-slate-900">Página não encontrada</h1>
          <p className="text-slate-500">
            Parece que você se perdeu no caminho. A página que você está procurando não existe ou foi movida.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            to={-1 as any} 
            className={cn(buttonVariants({ variant: "outline" }), "gap-2")}
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Link>
          <Link 
            to="/Dashboard" 
            className={cn(buttonVariants({ variant: "default" }), "gap-2 bg-blue-600 hover:bg-blue-700")}
          >
            <Home className="w-4 h-4" />
            Ir para o Início
          </Link>
        </div>
      </div>
    </div>
  );
}
