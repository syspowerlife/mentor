import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDoc,
  Timestamp 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';
import { FeatureFallback } from '@/components/FeatureFallback';
import { useSearchParams } from 'react-router-dom';
import { useAgendamentos } from '@/hooks/useAgendamentos';
import { useMetas } from '@/hooks/useMetas';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { parseSafeDate, safeFormat, formatDateOrTimestamp, formatForDateTimeLocal, handleApiResponse } from '@/lib/utils';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Link as LinkIcon, 
  Pencil, 
  Trash2, 
  RefreshCw, 
  Globe,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { agendamentoSchema, AgendamentoFormData } from '@/types/schemas';
import { AgendamentoTipo, AgendamentoStatus, NotificationType } from '@/types/enums';
import { CardListSkeleton } from '@/components/skeletons/FeedbackSkeletons';
import { sendNotification } from '@/lib/notifications';

import { PlanGate } from '@/components/PlanGate';

export function Agendamentos() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const clienteId = searchParams.get('clienteId');
  const clienteUid = searchParams.get('clienteUid');
  
  const { agendamentos, isLoading: isLoadingAgendamentos } = useAgendamentos(clienteId);
  const { metas, isLoading: isLoadingMetas } = useMetas();
  const loading = isLoadingAgendamentos || isLoadingMetas;

  const [editingAgendamento, setEditingAgendamento] = useState<any>(null);
  const [deletingAgendamentoId, setDeletingAgendamentoId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [preSelectedClient, setPreSelectedClient] = useState<any>(null);

  React.useEffect(() => {
    if (user) {
      checkGoogleConnection();
    }
    if (clienteId) {
      fetchPreSelectedClient();
    }
  }, [user, clienteId]);

  const fetchPreSelectedClient = async () => {
    try {
      const docRef = doc(db, 'clientes', clienteId!);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setPreSelectedClient({ id: docSnap.id, ...docSnap.data() });
      }
    } catch (error) {
      console.error('Error fetching pre-selected client:', error);
    }
  };

  const checkGoogleConnection = async () => {
    try {
      const response = await fetch(`/api/calendar/status?userId=${user?.uid}`);
      const data = await handleApiResponse(response, 'Erro ao verificar conexão (rede).');
      setIsGoogleConnected(data.connected);
    } catch (error) {
      console.error('Error checking Google connection:', error);
    }
  };

  const handleGoogleConnect = async () => {
    try {
      const response = await fetch('/api/auth/google/url');
      const { url } = await handleApiResponse(response, 'Serviço indisponível no momento.');
      
      const authWindow = window.open(url, 'google_oauth', 'width=600,height=700');
      
      if (!authWindow) {
        toast.error('O bloqueador de popups impediu a autenticação. Por favor, habilite popups.');
        return;
      }

      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === 'OAUTH_AUTH_SUCCESS' && event.data?.provider === 'google') {
          setIsGoogleConnected(true);
          toast.success('Google Calendar conectado com sucesso!');
          window.removeEventListener('message', handleMessage);
        }
      };

      window.addEventListener('message', handleMessage);
    } catch (error) {
      console.error('Error connecting to Google:', error);
      toast.error('Erro ao iniciar conexão com Google.');
    }
  };

  const handleSync = async () => {
    if (!isGoogleConnected) {
      handleGoogleConnect();
      return;
    }

    setIsSyncing(true);
    try {
      const response = await fetch('/api/calendar/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.uid })
      });
      
      const data = await handleApiResponse(response, 'Servidor de calendário inacessível (Erro 500).');
      
      if (data.synced !== undefined) {
        toast.success(`Sincronização concluída! ${data.synced} eventos sincronizados.`);
      } else {
        throw new Error(data.error || 'Erro na sincronização');
      }
    } catch (error: any) {
      console.error('Sync error:', error);
      toast.error(error.message || 'Erro ao sincronizar com Google Calendar.');
    } finally {
      setIsSyncing(false);
    }
  };

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors }
  } = useForm<AgendamentoFormData>({
    resolver: zodResolver(agendamentoSchema),
    defaultValues: {
      tipo: AgendamentoTipo.SESSAO,
      status: AgendamentoStatus.PENDENTE,
      meta_relacionada_id: 'none',
      google_event_id: null
    }
  });

  const createMutation = useMutation({
    mutationFn: async (novoAgendamento: any) => {
      const path = 'agendamentos';
      try {
        await addDoc(collection(db, path), {
          ...novoAgendamento,
          created_by: user?.uid,
          profissional_id: user?.uid,
          created_at: Timestamp.now(),
          cliente_id: clienteId || null,
          cliente_uid: clienteUid || null
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, path);
      }
    },
    onSuccess: (_, variables) => {
      reset();
      toast.success('Agendamento criado com sucesso!');
      
      if (user) {
        sendNotification({
          userId: user.uid,
          title: 'Novo Agendamento',
          message: `Sessão "${variables.titulo}" agendada para ${safeFormat(variables.data_inicio, 'dd/MM/yyyy HH:mm')}.`,
          type: NotificationType.INFO
        });
      }
    },
    onError: (error: any) => toast.error(error.message || 'Erro ao criar agendamento.')
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: any }) => {
      const path = 'agendamentos';
      try {
        const docRef = doc(db, path, id);
        await updateDoc(docRef, data);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, path);
      }
    },
    onSuccess: () => {
      setEditingAgendamento(null);
      toast.success('Agendamento atualizado com sucesso!');
    },
    onError: (error: any) => toast.error(error.message || 'Erro ao atualizar agendamento.')
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const path = 'agendamentos';
      try {
        const docRef = doc(db, path, id);
        await deleteDoc(docRef);
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, path);
      }
    },
    onSuccess: () => {
      setDeletingAgendamentoId(null);
      toast.success('Agendamento excluído com sucesso!');
    },
    onError: (error: any) => toast.error(error.message || 'Erro ao excluir agendamento.')
  });

  const onSubmit = (data: AgendamentoFormData) => {
    const payload = {
      ...data,
      data_inicio: parseSafeDate(data.data_inicio)?.toISOString() || '',
      data_fim: data.data_fim ? parseSafeDate(data.data_fim)?.toISOString() : null,
      meta_relacionada_id: data.meta_relacionada_id === 'none' ? null : data.meta_relacionada_id
    };
    createMutation.mutate(payload);
  };

  const onEditSubmit = (data: AgendamentoFormData) => {
    if (!editingAgendamento) return;
    const payload = {
      ...data,
      data_inicio: parseSafeDate(data.data_inicio)?.toISOString() || '',
      data_fim: data.data_fim ? parseSafeDate(data.data_fim)?.toISOString() : null,
      meta_relacionada_id: data.meta_relacionada_id === 'none' ? null : data.meta_relacionada_id
    };
    updateMutation.mutate({ id: editingAgendamento.id, data: payload });
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case AgendamentoStatus.CONCLUIDO: return <Badge className="bg-green-500">Concluído</Badge>;
      case AgendamentoStatus.EM_ANDAMENTO: return <Badge className="bg-blue-500">Em Andamento</Badge>;
      case AgendamentoStatus.CANCELADO: return <Badge variant="destructive">Cancelado</Badge>;
      default: return <Badge variant="secondary">Pendente</Badge>;
    }
  };

  const getTipoBadge = (tipo: string) => {
    switch(tipo) {
      case AgendamentoTipo.SESSAO: return <Badge variant="outline" className="border-purple-200 text-purple-700 bg-purple-50">Sessão</Badge>;
      case AgendamentoTipo.TAREFA: return <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50">Tarefa</Badge>;
      case AgendamentoTipo.ACOMPANHAMENTO: return <Badge variant="outline" className="border-orange-200 text-orange-700 bg-orange-50">Acompanhamento</Badge>;
      case AgendamentoTipo.REVISAO: return <Badge variant="outline" className="border-green-200 text-green-700 bg-green-50">Revisão</Badge>;
      default: return <Badge variant="outline">{tipo}</Badge>;
    }
  };



  if (loading) return <CardListSkeleton />;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-slate-800">Agendamentos</h1>
        <PlanGate feature="googleCalendar" showUpgradeModal={true}>
          <FeatureFallback feature="googleCalendar" hideIfMissing>
            <Button 
              variant={isGoogleConnected ? "outline" : "default"}
              className={`flex items-center gap-2 ${isGoogleConnected ? 'border-green-200 text-green-700 bg-green-50 hover:bg-green-100' : 'bg-blue-600 hover:bg-blue-700'}`}
              onClick={handleSync}
              disabled={isSyncing}
            >
              {isSyncing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Globe className="w-4 h-4" />
              )}
              {isGoogleConnected ? 'Sincronizar com Google Calendar' : 'Conectar Google Calendar'}
            </Button>
          </FeatureFallback>
        </PlanGate>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form */}
        <Card className="col-span-1 bg-white/60 backdrop-blur-sm shadow-sm h-fit">
          <CardHeader>
            <CardTitle>Novo Agendamento</CardTitle>
            {preSelectedClient && (
              <div className="mt-2 p-2 bg-blue-50 border border-blue-100 rounded-md flex items-center gap-2 text-xs text-blue-700">
                <CheckCircle2 className="w-3 h-3" />
                Agendando para: <strong>{preSelectedClient.nome}</strong>
              </div>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label>Título</Label>
                <Input {...register('titulo')} placeholder="Ex: Sessão 03 - Valores" />
                {errors.titulo && <p className="text-xs text-red-500">{errors.titulo.message}</p>}
              </div>
              
              <div className="space-y-2">
                <Label>Descrição</Label>
                <textarea 
                  {...register('descricao')}
                  className="w-full min-h-[80px] p-3 rounded-md border border-input bg-background text-sm"
                  placeholder="Detalhes do agendamento..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Início</Label>
                  <Input type="datetime-local" {...register('data_inicio')} />
                  {errors.data_inicio && <p className="text-xs text-red-500">{errors.data_inicio.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Fim (Opcional)</Label>
                  <Input type="datetime-local" {...register('data_fim')} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={watch('tipo')} onValueChange={v => setValue('tipo', v as any)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={AgendamentoTipo.SESSAO}>Sessão</SelectItem>
                      <SelectItem value={AgendamentoTipo.TAREFA}>Tarefa</SelectItem>
                      <SelectItem value={AgendamentoTipo.ACOMPANHAMENTO}>Acompanhamento</SelectItem>
                      <SelectItem value={AgendamentoTipo.REVISAO}>Revisão</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={watch('status')} onValueChange={v => setValue('status', v as any)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={AgendamentoStatus.PENDENTE}>Pendente</SelectItem>
                      <SelectItem value={AgendamentoStatus.EM_ANDAMENTO}>Em Andamento</SelectItem>
                      <SelectItem value={AgendamentoStatus.CONCLUIDO}>Concluído</SelectItem>
                      <SelectItem value={AgendamentoStatus.CANCELADO}>Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Vincular a Meta SMART (Opcional)</Label>
                <Select value={watch('meta_relacionada_id') || 'none'} onValueChange={v => setValue('meta_relacionada_id', v)}>
                  <SelectTrigger><SelectValue placeholder="Nenhuma meta vinculada" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhuma</SelectItem>
                    {metas.map((m: any) => (
                      <SelectItem key={m.id} value={m.id}>{m.titulo}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="w-full mt-4" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Salvando...' : 'Salvar Agendamento'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* List */}
        <div className="col-span-1 lg:col-span-2 space-y-4">
          <h2 className="text-xl font-bold text-slate-800">Próximos Agendamentos</h2>
          {agendamentos.length === 0 ? (
            <Card className="bg-white/60 backdrop-blur-sm shadow-sm"><CardContent className="p-6 text-center text-slate-500">Nenhum agendamento encontrado.</CardContent></Card>
          ) : (
            agendamentos.map((ag: any) => (
              <Card key={ag.id} className="bg-white/60 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow group">
                <CardContent className="p-5 flex flex-col md:flex-row gap-4 justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-lg text-slate-800">{ag.titulo}</h3>
                      {getTipoBadge(ag.tipo)}
                    </div>
                    {ag.descricao && <p className="text-sm text-slate-600">{ag.descricao}</p>}
                    
                    <div className="flex flex-wrap gap-4 text-sm text-slate-500 mt-2">
                      <div className="flex items-center gap-1">
                        <CalendarIcon className="w-4 h-4" />
                        {formatDateOrTimestamp(ag.data_inicio)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {safeFormat(ag.data_inicio, 'HH:mm')}
                        {ag.data_fim && ` - ${safeFormat(ag.data_fim, 'HH:mm')}`}
                      </div>
                      {ag.meta_relacionada_id && ag.meta_relacionada_id !== 'none' && (
                        <div className="flex items-center gap-1 text-blue-600">
                          <LinkIcon className="w-4 h-4" />
                          Meta Vinculada
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end justify-between gap-4">
                    {getStatusBadge(ag.status)}
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-slate-400 hover:text-blue-600"
                        onClick={() => setEditingAgendamento(ag)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-slate-400 hover:text-red-600"
                        onClick={() => setDeletingAgendamentoId(ag.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Edit Modal */}
      <EditAgendamentoModal 
        isOpen={!!editingAgendamento} 
        onClose={() => setEditingAgendamento(null)} 
        agendamento={editingAgendamento}
        onSave={onEditSubmit}
        isLoading={updateMutation.isPending}
        metas={metas}
      />

      {/* Delete Dialog */}
      <DeleteConfirmDialog 
        isOpen={!!deletingAgendamentoId}
        onClose={() => setDeletingAgendamentoId(null)}
        onConfirm={() => deletingAgendamentoId && deleteMutation.mutate(deletingAgendamentoId)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

function EditAgendamentoModal({ isOpen, onClose, agendamento, onSave, isLoading, metas }: any) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors }
  } = useForm<AgendamentoFormData>({
    resolver: zodResolver(agendamentoSchema)
  });

  React.useEffect(() => {
    if (agendamento) {
      reset({
        titulo: agendamento.titulo,
        descricao: agendamento.descricao || '',
        data_inicio: formatForDateTimeLocal(agendamento.data_inicio),
        data_fim: agendamento.data_fim ? formatForDateTimeLocal(agendamento.data_fim) : '',
        tipo: agendamento.tipo,
        status: agendamento.status,
        meta_relacionada_id: agendamento.meta_relacionada_id || 'none',
        google_event_id: agendamento.google_event_id || null
      });
    }
  }, [agendamento, reset]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Agendamento</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSave)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Título</Label>
            <Input {...register('titulo')} />
            {errors.titulo && <p className="text-xs text-red-500">{errors.titulo.message}</p>}
          </div>
          
          <div className="space-y-2">
            <Label>Descrição</Label>
            <textarea 
              {...register('descricao')}
              className="w-full min-h-[80px] p-3 rounded-md border border-input bg-background text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Início</Label>
              <Input type="datetime-local" {...register('data_inicio')} />
            </div>
            <div className="space-y-2">
              <Label>Fim</Label>
              <Input type="datetime-local" {...register('data_fim')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={watch('tipo')} onValueChange={v => setValue('tipo', v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={AgendamentoTipo.SESSAO}>Sessão</SelectItem>
                  <SelectItem value={AgendamentoTipo.TAREFA}>Tarefa</SelectItem>
                  <SelectItem value={AgendamentoTipo.ACOMPANHAMENTO}>Acompanhamento</SelectItem>
                  <SelectItem value={AgendamentoTipo.REVISAO}>Revisão</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={watch('status')} onValueChange={v => setValue('status', v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={AgendamentoStatus.PENDENTE}>Pendente</SelectItem>
                  <SelectItem value={AgendamentoStatus.EM_ANDAMENTO}>Em Andamento</SelectItem>
                  <SelectItem value={AgendamentoStatus.CONCLUIDO}>Concluído</SelectItem>
                  <SelectItem value={AgendamentoStatus.CANCELADO}>Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Meta SMART</Label>
            <Select value={watch('meta_relacionada_id') || 'none'} onValueChange={v => setValue('meta_relacionada_id', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhuma</SelectItem>
                {metas.map((m: any) => (
                  <SelectItem key={m.id} value={m.id}>{m.titulo}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
