import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, query, where, getDocs, updateDoc, doc, orderBy, limit, startAfter, getCountFromServer, addDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { UserPlus, Edit, ShieldAlert, Loader2, TrendingUp, User, Key, Mail, Trash2, Plus, GripVertical } from 'lucide-react';
import { UserSelector } from '@/components/UserSelector';
import { ClientResults } from '@/components/ClientResults';
import { DataTableFilter } from '@/components/DataTableFilter';
import { Pagination } from '@/components/Pagination';
import { BatchExportButton } from '@/components/BatchExportButton';
import { EngagementIndicator } from '@/components/EngagementIndicator';
import { PlanManager } from '@/components/PlanManager';
import { handleApiResponse, formatDateTime } from '@/lib/utils';
import { AuditLogService } from '@/services/AuditLogService';
import { toast } from 'sonner';
import { TableSkeleton } from '@/components/skeletons/FeedbackSkeletons';
import { AdminMetricsGrid } from '@/components/AdminMetricsGrid';
import { History, Search, Filter, Calendar } from 'lucide-react';

export function AdminPanel() {
  const queryClient = useQueryClient();
  const { user: currentUser, isAdmin, loading: authLoading } = useAuth();
  const [abaAtiva, setAbaAtiva] = useState('dashboard');
  const [clienteSelecionado, setClienteSelecionado] = useState('');
  
  const [userEdit, setUserEdit] = useState<any>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<any>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const { data: isAdminInCollection } = useQuery({
    queryKey: ['is-admin-in-collection', currentUser?.uid],
    queryFn: async () => {
      if (!currentUser) return false;
      const docRef = doc(db, 'admins', currentUser.uid);
      const docSnap = await getDocs(query(collection(db, 'admins'), where('uid', '==', currentUser.uid)));
      return !docSnap.empty;
    },
    enabled: !!currentUser
  });

  const mutationBootstrapAdmin = useMutation({
    mutationFn: async () => {
      if (!currentUser) return;
      await addDoc(collection(db, 'admins'), {
        uid: currentUser.uid,
        email: currentUser.email,
        added_at: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['is-admin-in-collection'] });
      toast.success('Você foi adicionado à coleção de administradores!');
    }
  });

  useEffect(() => {
    if (isAdmin && isAdminInCollection === false && currentUser?.email === "sys.powerlife@gmail.com") {
      mutationBootstrapAdmin.mutate();
    }
  }, [isAdmin, isAdminInCollection, currentUser]);

  const handleDeleteConfirm = () => {
    if (userToDelete) {
      mutationDeleteUser.mutate(userToDelete.id);
      setIsDeleteOpen(false);
      setUserToDelete(null);
    }
  };

  // Invitation state
  const [inviteData, setInviteData] = useState({ name: '', email: '' });
  const [isInviting, setIsInviting] = useState(false);

  // Pagination and Filtering state
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const itemsPerPage = 10;

  const { data: allUsers = [], isLoading: isLoadingUsers } = useQuery({ 
    queryKey: ['usuarios-all'], 
    queryFn: async () => {
      const usersRef = collection(db, 'users');
      // Fetch all users to allow fast, reactive local filtering for multiple combined fields.
      const snapshot = await getDocs(query(usersRef, orderBy('name')));
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() as any }));
    },
    enabled: isAdmin
  });

  const { filteredUsers, paginatedUsers, totalUsers } = React.useMemo(() => {
    let result = [...allUsers];

    // Filter by Status (Habilitado)
    if (statusFilter !== 'all') {
      const isActive = statusFilter === 'ativo';
      result = result.filter(u => u.habilitado === isActive);
    }

    // Filter by Search Term (Name, Email, or Profession - Case Insensitive)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(u => 
        (u.name && u.name.toLowerCase().includes(term)) ||
        (u.email && u.email.toLowerCase().includes(term)) ||
        (u.profissao && u.profissao.toLowerCase().includes(term))
      );
    }

    // Pagination
    const paginated = result.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return {
      filteredUsers: result,
      paginatedUsers: paginated,
      totalUsers: result.length
    };
  }, [allUsers, searchTerm, statusFilter, currentPage]);

  const mutationDeleteUser = useMutation({
    mutationFn: async (userId: string) => {
      const userToDeleteInfo = allUsers.find(u => u.id === userId);
      const token = await currentUser?.getIdToken();
      const response = await fetch('/api/admin/delete-user', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId })
      });
      await handleApiResponse(response, 'Erro ao excluir usuário');
      
      await AuditLogService.logAction({
        action: 'USER_DELETED',
        details: `Excluiu o usuário ${userToDeleteInfo?.email || userId}`,
        metadata: { userId, email: userToDeleteInfo?.email }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios-all'] });
      toast.success('Usuário excluído com sucesso!');
    },
    onError: (error: any) => toast.error(error.message)
  });

  const mutationCreateUser = useMutation({
    mutationFn: async (data: any) => {
      const token = await currentUser?.getIdToken();
      const response = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      const result = await handleApiResponse(response, 'Erro ao criar usuário');
      
      await AuditLogService.logAction({
        action: 'USER_CREATED',
        details: `Criou o usuário ${data.email}`,
        metadata: { email: data.email, role: data.role }
      });
      
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios-all'] });
      setIsAddOpen(false);
      toast.success('Usuário criado com sucesso!');
    },
    onError: (error: any) => toast.error(error.message)
  });

  const mutationUpdateUser = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: any }) => {
      const userRef = doc(db, 'users', id);
      await updateDoc(userRef, data);
      
      await AuditLogService.logAction({
        action: 'USER_UPDATED',
        details: `Atualizou os dados de ${id}`,
        metadata: { userId: id, updatedFields: Object.keys(data) }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios-all'] });
      setIsEditOpen(false);
      toast.success('Usuário atualizado com sucesso!');
    },
    onError: (error: any) => toast.error(error.message || 'Erro ao atualizar usuário.')
  });

  const handleToggleStatus = async (user: any) => {
    try {
      const token = await currentUser?.getIdToken();
      const response = await fetch('/api/admin/toggle-user-status', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId: user.id, habilitado: !user.habilitado })
      });
      await handleApiResponse(response, 'Erro ao atualizar status');
      
      await AuditLogService.logAction({
        action: 'USER_STATUS_TOGGLE',
        details: `${!user.habilitado ? 'Ativou' : 'Desativou'} o usuário ${user.email}`,
        metadata: { userId: user.id, email: user.email, newStatus: !user.habilitado }
      });

      queryClient.invalidateQueries({ queryKey: ['usuarios-all'] });
      toast.success(`Usuário ${!user.habilitado ? 'ativado' : 'desativado'} com sucesso!`);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleResetPassword = async (email: string) => {
    try {
      const token = await currentUser?.getIdToken();
      const response = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email })
      });
      await handleApiResponse(response, 'Erro ao enviar reset de senha');
      toast.success('Email de redefinição enviado com sucesso!');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleInviteUser = async () => {
    if (!inviteData.name || !inviteData.email) {
      toast.error('Preencha todos os campos do convite.');
      return;
    }

    setIsInviting(true);
    try {
      const token = await currentUser?.getIdToken();
      const response = await fetch('/api/admin/invite', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          ...inviteData, 
          invitedBy: currentUser?.uid 
        })
      });
      await handleApiResponse(response, 'Erro ao enviar convite');
      toast.success('Convite enviado com sucesso!');
      setIsAddOpen(false);
      setInviteData({ name: '', email: '' });
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsInviting(false);
    }
  };

  const handleSaveEdit = () => {
    if (userEdit) {
      mutationUpdateUser.mutate({ 
        id: userEdit.id, 
        data: { 
          profissao: userEdit.profissao, 
          especialidade: userEdit.especialidade, 
          telefone: userEdit.telefone,
          plan: userEdit.plan || 'free',
          role: userEdit.role || 'user'
        } 
      });
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  if (authLoading || isLoadingUsers) {
    return <TableSkeleton />;
  }

  if (!isAdmin) {
    return (
      <div className="p-8 text-center flex flex-col items-center justify-center h-[60vh]">
        <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-slate-800">Acesso Negado</h2>
        <p className="text-slate-500 mt-2">Você não tem permissão para acessar esta página.</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Painel de Administração</h1>
          <p className="text-slate-500 mt-1">Gerencie usuários, permissões e visualize resultados globais.</p>
        </div>
        <Button onClick={() => setIsAddOpen(true)} className="bg-slate-800 hover:bg-slate-900">
          <UserPlus className="w-4 h-4 mr-2" />
          Cadastrar Usuário
        </Button>
      </div>

      <div className="flex space-x-1 bg-slate-200/50 p-1 rounded-lg w-fit overflow-x-auto max-w-full">
        {['dashboard', 'usuarios', 'planos', 'resultados', 'faq', 'logs'].map(tab => (
          <button
            key={tab}
            onClick={() => setAbaAtiva(tab)}
            className={`whitespace-nowrap px-4 py-2 rounded-md text-sm font-medium capitalize transition-colors ${abaAtiva === tab ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            {tab === 'dashboard' ? 'Métricas Globais' : 
             tab === 'usuarios' ? 'Assinantes e Usuários' : 
             tab === 'planos' ? 'Planos (Mercado Pago)' : 
             tab === 'resultados' ? 'Resultados por Cliente' : 
             tab === 'faq' ? 'Gestão de FAQ' : 'Logs de Atividade'}
          </button>
        ))}
      </div>

      {abaAtiva === 'dashboard' && (
        <AdminMetricsGrid />
      )}

      {abaAtiva === 'usuarios' && (
        <div className="space-y-4">
          <DataTableFilter 
            onSearch={handleSearch}
            onFilterChange={handleStatusFilter}
            filterPlaceholder="Status"
            filterOptions={[
              { label: 'Ativos', value: 'ativo' },
              { label: 'Inativos', value: 'inativo' }
            ]}
            searchPlaceholder="Buscar por nome, email ou profissão..."
          />

          <Card className="bg-white/60 backdrop-blur-sm shadow-sm overflow-hidden border-slate-200">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 font-medium">Nome / Email</th>
                    <th className="px-6 py-4 font-medium">Profissão</th>
                    <th className="px-6 py-4 font-medium">Engajamento</th>
                    <th className="px-6 py-4 font-medium text-center">Status</th>
                    <th className="px-6 py-4 font-medium text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                        Nenhum usuário encontrado com os filtros aplicados.
                      </td>
                    </tr>
                  ) : (
                    paginatedUsers.map((u: any) => (
                      <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-800">{u.name || 'Sem nome'}</div>
                          <div className="text-slate-500">{u.email}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div>{u.profissao || '-'}</div>
                          <div className="text-xs text-slate-500">{u.especialidade}</div>
                        </td>
                        <td className="px-6 py-4">
                          <EngagementIndicator userId={u.id} />
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <Badge variant={u.habilitado ? 'success' : 'destructive'} className={u.habilitado ? 'bg-green-100 text-green-700' : ''}>
                              {u.habilitado ? 'Ativo' : 'Inativo'}
                            </Badge>
                            <Switch 
                              checked={u.habilitado} 
                              onCheckedChange={() => handleToggleStatus(u)} 
                              disabled={u.role === 'admin' || mutationUpdateUser.isPending} 
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Button variant="ghost" size="icon" onClick={() => { setUserEdit({...u}); setIsEditOpen(true); }} title="Editar">
                              <Edit className="w-4 h-4 text-slate-500" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleResetPassword(u.email)} title="Resetar Senha">
                              <Key className="w-4 h-4 text-orange-500" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => { setUserToDelete(u); setIsDeleteOpen(true); }} title="Excluir Usuário" disabled={u.role === 'admin'}>
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {totalUsers > 0 && (
            <Pagination 
              currentPage={currentPage}
              totalItems={totalUsers}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          )}
        </div>
      )}

      {abaAtiva === 'planos' && (
        <PlanManager />
      )}

      {abaAtiva === 'resultados' && (
        <Card className="bg-white/60 backdrop-blur-sm shadow-sm min-h-[400px] border-slate-200">
          <CardHeader>
            <CardTitle className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <span className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Dossiê de Resultados por Cliente
              </span>
              <div className="flex items-center gap-4">
                <BatchExportButton />
                <UserSelector value={clienteSelecionado} onChange={setClienteSelecionado} />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!clienteSelecionado ? (
              <div className="text-center text-slate-500 py-16 flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-slate-300" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-800">Nenhum cliente selecionado</h3>
                  <p className="text-sm mt-1">Selecione um cliente acima para visualizar o dossiê consolidado de resultados.</p>
                </div>
              </div>
            ) : (
              <ClientResults userId={clienteSelecionado} />
            )}
          </CardContent>
        </Card>
      )}

      {abaAtiva === 'faq' && (
        <FAQEditor />
      )}

      {abaAtiva === 'logs' && (
        <ActivityLogTable />
      )}

      {/* Dialog Editar Usuário */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Dados do Usuário</DialogTitle>
            <DialogDescription>Atualize as informações profissionais de {userEdit?.email}</DialogDescription>
          </DialogHeader>
          {userEdit && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Plano</Label>
                  <select 
                    className="w-full p-2 rounded-md border border-slate-200 text-sm"
                    value={userEdit.plan || 'free'}
                    onChange={e => setUserEdit({...userEdit, plan: e.target.value})}
                  >
                    <option value="free">Free</option>
                    <option value="pro">Pro</option>
                    <option value="master">Master</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Tipo (Role)</Label>
                  <select 
                    className="w-full p-2 rounded-md border border-slate-200 text-sm"
                    value={userEdit.role || 'user'}
                    onChange={e => setUserEdit({...userEdit, role: e.target.value})}
                  >
                    <option value="user">Mentor</option>
                    <option value="client">Cliente</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Profissão</Label>
                <Input value={userEdit.profissao || ''} onChange={e => setUserEdit({...userEdit, profissao: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Especialidade</Label>
                <Input value={userEdit.especialidade || ''} onChange={e => setUserEdit({...userEdit, especialidade: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input value={userEdit.telefone || ''} onChange={e => setUserEdit({...userEdit, telefone: e.target.value})} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveEdit} disabled={mutationUpdateUser.isPending} className="bg-blue-600 hover:bg-blue-700">
              {mutationUpdateUser.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Cadastrar Usuário */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Usuário</DialogTitle>
            <DialogDescription>Crie uma conta diretamente ou envie um convite por e-mail.</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome Completo</Label>
                <Input 
                  placeholder="Ex: João Silva" 
                  value={inviteData.name} 
                  onChange={e => setInviteData({...inviteData, name: e.target.value})} 
                />
              </div>
              <div className="space-y-2">
                <Label>E-mail</Label>
                <Input 
                  type="email" 
                  placeholder="joao@exemplo.com" 
                  value={inviteData.email} 
                  onChange={e => setInviteData({...inviteData, email: e.target.value})} 
                />
              </div>
              <div className="space-y-2">
                <Label>Senha (para criação direta)</Label>
                <Input 
                  type="password" 
                  placeholder="Mínimo 6 caracteres" 
                  value={(inviteData as any).password || ''} 
                  onChange={e => setInviteData({...inviteData, password: e.target.value} as any)} 
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo de Usuário</Label>
                <select 
                  className="w-full p-2 rounded-md border border-slate-200 text-sm"
                  value={(inviteData as any).role || 'user'}
                  onChange={e => setInviteData({...inviteData, role: e.target.value} as any)}
                >
                  <option value="user">Mentor / Profissional</option>
                  <option value="client">Cliente</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Button 
                onClick={() => mutationCreateUser.mutate(inviteData)} 
                disabled={mutationCreateUser.isPending || !(inviteData as any).password}
                className="bg-slate-800 hover:bg-slate-900"
              >
                {mutationCreateUser.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                Criar Conta Diretamente
              </Button>
              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-500">Ou</span></div>
              </div>
              <Button 
                variant="outline"
                onClick={handleInviteUser} 
                disabled={isInviting}
              >
                {isInviting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Mail className="w-4 h-4 mr-2" />}
                Enviar Convite por E-mail
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Confirmar Exclusão */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <ShieldAlert className="w-5 h-5" />
              Confirmar Exclusão
            </DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o usuário <strong>{userToDelete?.email}</strong>? 
              Esta ação é irreversível e removerá o acesso do usuário imediatamente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={mutationDeleteUser.isPending}>
              {mutationDeleteUser.isPending ? 'Excluindo...' : 'Sim, Excluir Usuário'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ActivityLogTable() {
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [filterAction, setFilterAction] = useState('all');

  const fetchLogs = async (isNew = false) => {
    setLoading(true);
    try {
      const logsRef = collection(db, 'system_logs');
      let q = query(logsRef, orderBy('timestamp', 'desc'), limit(15));

      if (!isNew && lastDoc) {
        q = query(logsRef, orderBy('timestamp', 'desc'), startAfter(lastDoc), limit(15));
      }

      if (filterAction !== 'all') {
        q = query(logsRef, where('action', '==', filterAction), orderBy('timestamp', 'desc'), limit(15));
        if (!isNew && lastDoc) {
          q = query(logsRef, where('action', '==', filterAction), orderBy('timestamp', 'desc'), startAfter(lastDoc), limit(15));
        }
      }

      const snapshot = await getDocs(q);
      const newLogs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

      if (isNew) {
        setLogs(newLogs);
      } else {
        setLogs(prev => [...prev, ...newLogs]);
      }

      setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      setHasMore(snapshot.docs.length === 15);
    } catch (error) {
      console.error('Error fetching logs:', error);
      toast.error('Erro ao carregar logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(true);
  }, [filterAction]);

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'USER_CREATED': return <Badge className="bg-green-100 text-green-700 font-normal">Criação</Badge>;
      case 'USER_DELETED': return <Badge className="bg-red-100 text-red-700 font-normal">Exclusão</Badge>;
      case 'USER_UPDATED': return <Badge className="bg-blue-100 text-blue-700 font-normal">Edição</Badge>;
      case 'USER_STATUS_TOGGLE': return <Badge className="bg-orange-100 text-orange-700 font-normal">Status</Badge>;
      case 'PLAN_CREATED': return <Badge className="bg-purple-100 text-purple-700 font-normal">Plano +</Badge>;
      case 'PLAN_UPDATED': return <Badge className="bg-indigo-100 text-indigo-700 font-normal">Plano ±</Badge>;
      case 'PLAN_DELETED': return <Badge className="bg-gray-100 text-gray-700 font-normal">Plano -</Badge>;
      case 'LOGIN': return <Badge className="bg-slate-100 text-slate-700 font-normal">Login</Badge>;
      default: return <Badge variant="outline" className="font-normal">{action}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-slate-100 rounded-lg">
            <History className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">Histórico de Atividade</h2>
            <p className="text-xs text-slate-500">Rastreamento de ações administrativas</p>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select 
            className="text-sm p-2 bg-slate-50 rounded-md border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-auto"
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
          >
            <option value="all">Todas as Ações</option>
            <option value="USER_CREATED">Criação de Usuário</option>
            <option value="USER_DELETED">Exclusão de Usuário</option>
            <option value="USER_UPDATED">Atualização de Usuário</option>
            <option value="USER_STATUS_TOGGLE">Alteração de Status</option>
            <option value="PLAN_CREATED">Criação de Plano</option>
            <option value="LOGIN">Admin Logins</option>
          </select>
        </div>
      </div>

      <Card className="bg-white/60 backdrop-blur-sm shadow-sm overflow-hidden border-slate-200 rounded-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50/80 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold tracking-wider">Data / Hora</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Admin</th>
                <th className="px-6 py-4 font-semibold tracking-wider text-center">Ação</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Detalhes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.length === 0 && !loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <Search className="w-8 h-8 opacity-20" />
                      <p>Nenhum registro encontrado.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 opacity-40" />
                        {log.timestamp?.toDate ? formatDateTime(log.timestamp.toDate()) : '---'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-700">{log.userName || 'Admin'}</div>
                      <div className="text-[11px] text-slate-400 font-mono uppercase">{log.userEmail}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {getActionBadge(log.action)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-slate-600 font-medium">{log.details}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {loading && (
          <div className="p-12 text-center border-t border-slate-100">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600 opacity-50" />
            <p className="text-xs font-medium text-slate-400 mt-3 animate-pulse uppercase tracking-widest">Carregando logs...</p>
          </div>
        )}

        {hasMore && !loading && (
          <div className="p-4 bg-slate-50/30 text-center">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => fetchLogs()} 
              className="px-8 border-slate-200 text-slate-600 hover:bg-white shadow-sm"
            >
              Carregar mais atividades
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}

function FAQEditor() {
  const queryClient = useQueryClient();
  const [isAddFaqOpen, setIsAddFaqOpen] = useState(false);
  const [newFaq, setNewFaq] = useState({ question: '', answer: '', category: 'Geral', active: true });

  const { data: faqs, isLoading } = useQuery({
    queryKey: ['faqs'],
    queryFn: async () => {
      const faqsRef = collection(db, 'faqs');
      const q = query(faqsRef, orderBy('order', 'asc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    }
  });

  const mutationAddFaq = useMutation({
    mutationFn: async (data: any) => {
      const faqsRef = collection(db, 'faqs');
      const countSnapshot = await getCountFromServer(faqsRef);
      await addDoc(faqsRef, { ...data, order: countSnapshot.data().count, created_at: new Date().toISOString() });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faqs'] });
      setIsAddFaqOpen(false);
      setNewFaq({ question: '', answer: '', category: 'Geral', active: true });
      toast.success('Pergunta adicionada ao FAQ!');
    }
  });

  const mutationDeleteFaq = useMutation({
    mutationFn: async (id: string) => {
      await deleteDoc(doc(db, 'faqs', id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faqs'] });
      toast.success('Pergunta removida do FAQ.');
    }
  });

  const mutationToggleFaq = useMutation({
    mutationFn: async ({ id, active }: { id: string, active: boolean }) => {
      await updateDoc(doc(db, 'faqs', id), { active });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['faqs'] })
  });

  if (isLoading) return <TableSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Gestão de FAQ</h2>
          <p className="text-sm text-slate-500">Adicione, remova ou edite as perguntas frequentes exibidas aos usuários.</p>
        </div>
        <Button onClick={() => setIsAddFaqOpen(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Nova Pergunta
        </Button>
      </div>

      <div className="grid gap-4">
        {faqs?.length === 0 ? (
          <Card className="p-12 text-center text-slate-500">
            Nenhuma pergunta cadastrada no FAQ.
          </Card>
        ) : (
          faqs?.map((faq: any) => (
            <Card key={faq.id} className="bg-white/60 backdrop-blur-sm border-slate-200">
              <CardContent className="p-4 flex items-start gap-4">
                <div className="mt-1 text-slate-300 cursor-grab">
                  <GripVertical className="w-5 h-5" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-[10px] uppercase tracking-wider">{faq.category}</Badge>
                    <div className="flex items-center gap-2">
                      <Switch 
                        checked={faq.active} 
                        onCheckedChange={(checked) => mutationToggleFaq.mutate({ id: faq.id, active: checked })} 
                      />
                      <Button variant="ghost" size="icon" onClick={() => mutationDeleteFaq.mutate(faq.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <h4 className="font-bold text-slate-800">{faq.question}</h4>
                  <p className="text-sm text-slate-600">{faq.answer}</p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={isAddFaqOpen} onOpenChange={setIsAddFaqOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Pergunta para o FAQ</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Input value={newFaq.category} onChange={e => setNewFaq({...newFaq, category: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Pergunta</Label>
              <Input value={newFaq.question} onChange={e => setNewFaq({...newFaq, question: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Resposta</Label>
              <textarea 
                className="w-full min-h-[100px] p-3 rounded-md border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={newFaq.answer} 
                onChange={e => setNewFaq({...newFaq, answer: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddFaqOpen(false)}>Cancelar</Button>
            <Button onClick={() => mutationAddFaq.mutate(newFaq)} disabled={mutationAddFaq.isPending} className="bg-blue-600 hover:bg-blue-700">
              {mutationAddFaq.isPending ? 'Salvando...' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
