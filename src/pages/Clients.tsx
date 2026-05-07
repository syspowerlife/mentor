import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { collection, addDoc, updateDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';
import { useClients } from '@/hooks/useClients';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, Search, Mail, Phone, Calendar, ArrowRight, Pencil, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { clienteSchema, ClienteFormData } from '@/types/schemas';
import { ClienteStatus } from '@/types/enums';
import { CardListSkeleton } from '@/components/skeletons/FeedbackSkeletons';
import { sendNotification } from '@/lib/notifications';

import { usePlan } from '@/hooks/usePlan';
import { PlanGate } from '@/components/PlanGate';
import { UpgradeModal } from '@/components/UpgradeModal';

export function Clients() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { canAddClient, plan } = usePlan();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<any>(null);
  const [deletingClienteId, setDeletingClienteId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { clientes, isLoading } = useClients();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors }
  } = useForm<ClienteFormData>({
    resolver: zodResolver(clienteSchema),
    defaultValues: {
      status: ClienteStatus.ATIVO
    }
  });

  const handleOpenAdd = () => {
    if (!canAddClient(clientes.length)) {
      setIsUpgradeOpen(true);
      return;
    }
    setIsAddOpen(true);
  };

  const createMutation = useMutation({
    mutationFn: async (novoCliente: any) => {
      const path = 'clientes';
      try {
        await addDoc(collection(db, path), {
          ...novoCliente,
          data_inicio: Timestamp.now(),
          profissional_id: user?.uid
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, path);
      }
    },
    onSuccess: (_, variables) => {
      setIsAddOpen(false);
      reset();
      toast.success('Cliente cadastrado com sucesso!');
      
      if (user) {
        sendNotification({
          userId: user.uid,
          title: 'Novo Cliente',
          message: `O cliente ${variables.nome} foi cadastrado com sucesso.`,
          type: 'success'
        });
      }
    },
    onError: (error: any) => {
      console.error(error);
      toast.error(error.message || 'Erro ao cadastrar cliente.');
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: any }) => {
      const path = `clientes/${id}`;
      try {
        await updateDoc(doc(db, 'clientes', id), data);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, path);
      }
    },
    onSuccess: () => {
      setEditingCliente(null);
      toast.success('Cliente atualizado!');
    },
    onError: (error: any) => {
      console.error(error);
      toast.error(error.message || 'Erro ao atualizar cliente.');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const path = `clientes/${id}`;
      try {
        await deleteDoc(doc(db, 'clientes', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, path);
      }
    },
    onSuccess: () => {
      setDeletingClienteId(null);
      toast.success('Cliente removido!');
    },
    onError: (error: any) => {
      console.error(error);
      toast.error(error.message || 'Erro ao remover cliente.');
    }
  });

  const onSubmit = (data: ClienteFormData) => {
    createMutation.mutate(data);
  };

  const onEditSubmit = (data: ClienteFormData) => {
    if (!editingCliente) return;
    updateMutation.mutate({ id: editingCliente.id, data });
  };

  const filteredClientes = clientes.filter((c: any) => 
    c.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) return <CardListSkeleton />;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Meus Clientes</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-slate-500">Gerencie seus clientes e acompanhe o progresso.</p>
            {plan && (
              <Badge variant="outline" className="text-[10px] uppercase tracking-tighter text-slate-400 border-slate-200">
                {clientes.length} / {plan.limits.maxClients > 1000 ? '∞' : plan.limits.maxClients}
              </Badge>
            )}
          </div>
        </div>
        <Button onClick={handleOpenAdd} className="bg-blue-600 hover:bg-blue-700">
          <UserPlus className="w-4 h-4 mr-2" />
          Novo Cliente
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
        <Input 
          className="pl-10 bg-white" 
          placeholder="Buscar cliente por nome ou email..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClientes.map((cliente: any) => (
            <Card key={cliente.id} className="bg-white hover:shadow-md transition-shadow border-slate-200 group">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xl font-bold">
                    {cliente.nome.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant={cliente.status === ClienteStatus.ATIVO ? 'success' : 'secondary'} className={cliente.status === ClienteStatus.ATIVO ? 'bg-green-100 text-green-700' : ''}>
                      {cliente.status === ClienteStatus.ATIVO ? 'Ativo' : 'Inativo'}
                    </Badge>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setEditingCliente(cliente)} className="text-slate-400 hover:text-blue-600"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => setDeletingClienteId(cliente.id)} className="text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                </div>
                
                <h3 className="text-xl font-bold text-slate-800 mb-1">{cliente.nome}</h3>
                
                <div className="space-y-2 mt-4">
                  <div className="flex items-center text-sm text-slate-600">
                    <Mail className="w-4 h-4 mr-2 text-slate-400" />
                    {cliente.email}
                  </div>
                  <div className="flex items-center text-sm text-slate-600">
                    <Phone className="w-4 h-4 mr-2 text-slate-400" />
                    {cliente.telefone || 'Não informado'}
                  </div>
                  <div className="flex items-center text-sm text-slate-600">
                    <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                    Início: {new Date(cliente.data_inicio).toLocaleDateString('pt-BR')}
                  </div>
                </div>

                <Button 
                  variant="outline" 
                  className="w-full mt-6 text-blue-600 border-blue-200 hover:bg-blue-50"
                  onClick={() => navigate(`/Clientes/${cliente.id}`)}
                >
                  Ver Perfil <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          ))}
          
          {filteredClientes.length === 0 && (
            <div className="col-span-full text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
              <p className="text-slate-500">Nenhum cliente encontrado.</p>
            </div>
          )}
        </div>

      {/* Upgrade Modal */}
      <UpgradeModal 
        isOpen={isUpgradeOpen} 
        onClose={() => setIsUpgradeOpen(false)}
        title="Limite de Clientes Atingido"
        description={`Seu plano atual permite até ${plan?.limits.maxClients} clientes ativos. Faça o upgrade para continuar crescendo!`}
        feature="Clientes ilimitados"
      />

      {/* Add Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Novo Cliente</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Nome Completo</Label>
              <Input {...register('nome')} placeholder="Ex: João da Silva" />
              {errors.nome && <p className="text-xs text-red-500">{errors.nome.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" {...register('email')} placeholder="joao@exemplo.com" />
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Telefone / WhatsApp</Label>
              <Input {...register('telefone')} placeholder="(11) 99999-9999" />
            </div>
            <div className="space-y-2">
              <Label>Status Inicial</Label>
              <Select value={watch('status')} onValueChange={v => setValue('status', v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ClienteStatus.ATIVO}>Ativo</SelectItem>
                  <SelectItem value={ClienteStatus.INATIVO}>Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancelar</Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Salvando...' : 'Salvar Cliente'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <EditClienteModal 
        isOpen={!!editingCliente} 
        onClose={() => setEditingCliente(null)} 
        cliente={editingCliente}
        onSave={onEditSubmit}
        isLoading={updateMutation.isPending}
      />

      {/* Delete Dialog */}
      <DeleteConfirmDialog 
        isOpen={!!deletingClienteId}
        onClose={() => setDeletingClienteId(null)}
        onConfirm={() => deletingClienteId && deleteMutation.mutate(deletingClienteId)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

function EditClienteModal({ isOpen, onClose, cliente, onSave, isLoading }: any) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors }
  } = useForm<ClienteFormData>({
    resolver: zodResolver(clienteSchema)
  });

  React.useEffect(() => {
    if (cliente) {
      reset({
        nome: cliente.nome,
        email: cliente.email,
        telefone: cliente.telefone || '',
        status: cliente.status || ClienteStatus.ATIVO
      });
    }
  }, [cliente, reset]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Cliente</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSave)} className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>Nome Completo</Label>
            <Input {...register('nome')} />
            {errors.nome && <p className="text-xs text-red-500">{errors.nome.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" {...register('email')} />
            {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Telefone / WhatsApp</Label>
            <Input {...register('telefone')} />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={watch('status')} onValueChange={v => setValue('status', v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ClienteStatus.ATIVO}>Ativo</SelectItem>
                <SelectItem value={ClienteStatus.INATIVO}>Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
              {isLoading ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
