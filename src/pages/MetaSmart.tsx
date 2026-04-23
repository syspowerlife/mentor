import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  Timestamp 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ExportPdfButton } from '@/components/ExportPdfButton';
import { Badge } from '@/components/ui/badge';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Plus, GripVertical, Calendar, Target, Pencil, Trash2, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { metaSmartSchema, MetaSmartFormData } from '@/types/schemas';
import { sendNotification } from '@/lib/notifications';

const COLUMNS = {
  a_fazer: { id: 'a_fazer', title: 'A Fazer', color: 'bg-slate-100' },
  em_andamento: { id: 'em_andamento', title: 'Em Andamento', color: 'bg-blue-50' },
  concluido: { id: 'concluido', title: 'Concluída', color: 'bg-green-50' },
  pausada: { id: 'pausada', title: 'Pausada', color: 'bg-orange-50' },
  pendente: { id: 'pendente', title: 'Pendente', color: 'bg-yellow-50' }
};

export function MetaSmart() {
  const { user, userData } = useAuth();
  const [searchParams] = useSearchParams();
  const clienteId = searchParams.get('clienteId');
  
  const [metas, setMetas] = useState<any[]>([]);
  const [sessoes, setSessoes] = useState<any[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingMeta, setEditingMeta] = useState<any>(null);
  const [deletingMetaId, setDeletingMetaId] = useState<string | null>(null);

  // Load metas in real-time
  useEffect(() => {
    if (!user) return;

    const path = 'metas_smart';
    let q = query(
      collection(db, path),
      where('created_by', '==', user.uid),
      orderBy('created_at', 'desc')
    );

    // If we have a clienteId, we might want to filter by it, 
    // but the Kanban usually shows all metas for the mentor or all for a specific client.
    // Let's filter by client if provided.
    if (clienteId) {
      q = query(
        collection(db, path),
        where('created_by', '==', user.uid),
        where('cliente_id', '==', clienteId),
        orderBy('created_at', 'desc')
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const metasData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMetas(metasData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });

    return () => unsubscribe();
  }, [user, clienteId]);

  // Load mentoring sessions to count associations
  useEffect(() => {
    if (!user) return;

    const path = 'sessoes_mentoring';
    let q = query(
      collection(db, path),
      where('created_by', '==', user.uid)
    );

    if (clienteId) {
      q = query(
        collection(db, path),
        where('created_by', '==', user.uid),
        where('cliente_id', '==', clienteId)
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setSessoes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsubscribe();
  }, [user, clienteId]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors }
  } = useForm<MetaSmartFormData>({
    resolver: zodResolver(metaSmartSchema),
    defaultValues: {
      status: 'a_fazer'
    }
  });

  const createMutation = useMutation({
    mutationFn: async (novaMeta: any) => {
      const path = 'metas_smart';
      try {
        await addDoc(collection(db, path), {
          ...novaMeta,
          created_by: user?.uid,
          created_at: Timestamp.now(),
          cliente_id: clienteId || null
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, path);
      }
    },
    onSuccess: (_, variables) => {
      setIsAddOpen(false);
      reset();
      toast.success('Meta criada com sucesso!');
      
      if (user) {
        sendNotification({
          userId: user.uid,
          title: 'Nova Meta SMART',
          message: `A meta "${variables.titulo}" foi definida com sucesso.`,
          type: 'success'
        });
      }
    },
    onError: (error: any) => toast.error(error.message || 'Erro ao criar meta.')
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: any }) => {
      const path = 'metas_smart';
      try {
        const docRef = doc(db, path, id);
        await updateDoc(docRef, data);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, path);
      }
    },
    onSuccess: (_, variables) => {
      setEditingMeta(null);
      toast.success('Meta atualizada!');

      if (variables.data.status === 'concluido' && user) {
        const preferences = userData?.notification_preferences || { goals: true };
        
        if (preferences.goals !== false) {
          sendNotification({
            userId: user.uid,
            title: 'Meta Concluída! 🎉',
            message: 'Parabéns por atingir seu objetivo. Continue com esse foco!',
            type: 'success',
            link: '/MetaSmart'
          });
        }
      }
    },
    onError: (error: any) => toast.error(error.message || 'Erro ao atualizar meta.')
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const path = 'metas_smart';
      try {
        const docRef = doc(db, path, id);
        await deleteDoc(docRef);
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, path);
      }
    },
    onSuccess: () => {
      setDeletingMetaId(null);
      toast.success('Meta excluída!');
    },
    onError: (error: any) => toast.error(error.message || 'Erro ao excluir meta.')
  });

  const onSubmit = (data: MetaSmartFormData) => {
    createMutation.mutate(data);
  };

  const onEditSubmit = (data: MetaSmartFormData) => {
    if (!editingMeta) return;
    updateMutation.mutate({ id: editingMeta.id, data });
  };

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    updateMutation.mutate({
      id: draggableId,
      data: { status: destination.droppableId }
    });
  };

  const getMetasByStatus = (statusId: string) => {
    return metas.filter((m: any) => (m.status || 'a_fazer') === statusId);
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 h-full flex flex-col">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <Target className="w-8 h-8 text-blue-600" />
            Metas SMART
          </h1>
          <p className="text-slate-500 mt-1">Acompanhe suas metas através do quadro Kanban.</p>
        </div>
        <div className="flex gap-3">
          <ExportPdfButton targetId="print-meta" filename="meta-smart" title="Relatório: Meta SMART" />
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" /> Nova Meta
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Criar Nova Meta SMART</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Título da Meta</Label>
                  <Input {...register('titulo')} placeholder="Ex: Aumentar faturamento em 20%" />
                  {errors.titulo && <p className="text-xs text-red-500">{errors.titulo.message}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label className="text-blue-600 font-bold">S - Específica (Specific)</Label>
                  <Input {...register('especifica')} placeholder="O que exatamente você quer alcançar?" />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-green-600 font-bold">M - Mensurável (Measurable)</Label>
                  <Input {...register('mensuravel')} placeholder="Como você vai medir o progresso?" />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-purple-600 font-bold">A - Atingível (Achievable)</Label>
                  <Input {...register('atingivel')} placeholder="É realista e possível de alcançar?" />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-orange-600 font-bold">R - Relevante (Relevant)</Label>
                  <Input {...register('relevante')} placeholder="Por que isso é importante agora?" />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-red-600 font-bold">T - Temporal (Time-bound)</Label>
                  <Input {...register('temporal')} placeholder="Qual é o prazo final?" />
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2">
                    <Label>Data Limite</Label>
                    <Input type="date" {...register('prazo')} />
                  </div>
                  <div className="space-y-2">
                    <Label>Status Inicial</Label>
                    <Select value={watch('status')} onValueChange={v => setValue('status', v as any)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="a_fazer">A Fazer</SelectItem>
                        <SelectItem value="em_andamento">Em Andamento</SelectItem>
                        <SelectItem value="pendente">Pendente</SelectItem>
                        <SelectItem value="concluido">Concluída</SelectItem>
                        <SelectItem value="pausada">Pausada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button type="submit" className="w-full mt-4 bg-blue-600 hover:bg-blue-700" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Salvando...' : 'Salvar Meta'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto pb-4" id="print-meta">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-6 min-w-max h-full items-start">
            {Object.values(COLUMNS).map(column => (
              <div key={column.id} className={`w-80 rounded-xl flex flex-col max-h-full ${column.color} border border-slate-200/60`}>
                <div className="p-4 border-b border-slate-200/50 flex justify-between items-center bg-white/50 rounded-t-xl">
                  <h3 className="font-bold text-slate-700">{column.title}</h3>
                  <Badge variant="secondary" className="bg-white text-slate-600">{getMetasByStatus(column.id).length}</Badge>
                </div>
                
                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 p-4 space-y-3 min-h-[200px] transition-colors ${snapshot.isDraggingOver ? 'bg-slate-200/30' : ''}`}
                    >
                      {getMetasByStatus(column.id).map((meta: any, index: number) => (
                        <Draggable key={meta.id} draggableId={meta.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              style={{ ...provided.draggableProps.style }}
                              className={`bg-white p-4 rounded-lg shadow-sm border border-slate-200 group ${snapshot.isDragging ? 'shadow-md ring-2 ring-blue-400 ring-opacity-50' : 'hover:border-blue-300'}`}
                            >
                              <div className="flex items-start gap-2">
                                <GripVertical className="w-4 h-4 text-slate-300 mt-1 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="flex-1">
                                  <div className="flex justify-between items-start">
                                    <h4 className="font-bold text-slate-800 text-sm leading-tight mb-2">{meta.titulo}</h4>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button onClick={() => setEditingMeta(meta)} className="text-slate-400 hover:text-blue-600"><Pencil className="w-3 h-3" /></button>
                                      <button onClick={() => setDeletingMetaId(meta.id)} className="text-slate-400 hover:text-red-600"><Trash2 className="w-3 h-3" /></button>
                                    </div>
                                  </div>
                                  {meta.prazo && (
                                    <div className="flex items-center text-xs text-slate-500 bg-slate-50 w-fit px-2 py-1 rounded-md">
                                      <Calendar className="w-3 h-3 mr-1" />
                                      {new Date(meta.prazo).toLocaleDateString('pt-BR')}
                                    </div>
                                  )}

                                  {/* Session Indicator */}
                                  {sessoes.some(s => s.meta_ids?.includes(meta.id)) && (
                                    <div className="flex items-center text-[10px] text-blue-600 mt-2 font-semibold">
                                      <MessageSquare className="w-3 h-3 mr-1" />
                                      {sessoes.filter(s => s.meta_ids?.includes(meta.id)).length} sessões relacionadas
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      </div>

      {/* Edit Modal */}
      <EditMetaModal 
        isOpen={!!editingMeta} 
        onClose={() => setEditingMeta(null)} 
        meta={editingMeta}
        onSave={onEditSubmit}
        isLoading={updateMutation.isPending}
      />

      {/* Delete Dialog */}
      <DeleteConfirmDialog 
        isOpen={!!deletingMetaId}
        onClose={() => setDeletingMetaId(null)}
        onConfirm={() => deletingMetaId && deleteMutation.mutate(deletingMetaId)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

function EditMetaModal({ isOpen, onClose, meta, onSave, isLoading }: any) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors }
  } = useForm<MetaSmartFormData>({
    resolver: zodResolver(metaSmartSchema)
  });

  React.useEffect(() => {
    if (meta) {
      reset({
        titulo: meta.titulo,
        especifica: meta.especifica || '',
        mensuravel: meta.mensuravel || '',
        atingivel: meta.atingivel || '',
        relevante: meta.relevante || '',
        temporal: meta.temporal || '',
        prazo: meta.prazo || '',
        status: meta.status || 'a_fazer'
      });
    }
  }, [meta, reset]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Meta SMART</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSave)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Título da Meta</Label>
            <Input {...register('titulo')} />
            {errors.titulo && <p className="text-xs text-red-500">{errors.titulo.message}</p>}
          </div>
          
          <div className="space-y-2">
            <Label className="text-blue-600 font-bold">S - Específica</Label>
            <Input {...register('especifica')} />
          </div>
          
          <div className="space-y-2">
            <Label className="text-green-600 font-bold">M - Mensurável</Label>
            <Input {...register('mensuravel')} />
          </div>
          
          <div className="space-y-2">
            <Label className="text-purple-600 font-bold">A - Atingível</Label>
            <Input {...register('atingivel')} />
          </div>
          
          <div className="space-y-2">
            <Label className="text-orange-600 font-bold">R - Relevante</Label>
            <Input {...register('relevante')} />
          </div>
          
          <div className="space-y-2">
            <Label className="text-red-600 font-bold">T - Temporal</Label>
            <Input {...register('temporal')} />
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="space-y-2">
              <Label>Data Limite</Label>
              <Input type="date" {...register('prazo')} />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={watch('status')} onValueChange={v => setValue('status', v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="a_fazer">A Fazer</SelectItem>
                  <SelectItem value="em_andamento">Em Andamento</SelectItem>
                  <SelectItem value="concluido">Concluída</SelectItem>
                  <SelectItem value="pausada">Pausada</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                </SelectContent>
              </Select>
            </div>
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

