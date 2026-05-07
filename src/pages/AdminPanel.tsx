import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, query, where, getDocs, updateDoc, doc, getDoc, setDoc, orderBy, limit, startAfter, getCountFromServer, addDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { UserPlus, Edit, Edit2, Save, ShieldAlert, Loader2, TrendingUp, User, Key, Mail, MessageCircle, FileText, Trash2, Plus, GripVertical, CheckCircle2, AlertCircle, Activity } from 'lucide-react';
import { useFeatures } from '@/hooks/useFeatures';
import { UserSelector } from '@/components/UserSelector';
import { ClientResults } from '@/components/ClientResults';
import { DataTableFilter } from '@/components/DataTableFilter';
import { Pagination } from '@/components/Pagination';
import { BatchExportButton } from '@/components/BatchExportButton';
import { EngagementIndicator } from '@/components/EngagementIndicator';
import { PlanManager } from '@/components/PlanManager';
import { handleApiResponse, formatDateTime, cn } from '@/lib/utils';
import { AuditLogService } from '@/services/AuditLogService';
import { toast } from 'sonner';
import { TableSkeleton } from '@/components/skeletons/FeedbackSkeletons';
import { AdminMetricsGrid } from '@/components/AdminMetricsGrid';
import { History, Search, Filter, Calendar } from 'lucide-react';
import { UserRole } from '@/types/enums';

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
          role: userEdit.role || UserRole.USER
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
        {['dashboard', 'usuarios', 'planos', 'resultados', 'faq', 'logs', 'config'].map(tab => (
          <button
            key={tab}
            onClick={() => setAbaAtiva(tab)}
            className={`whitespace-nowrap px-4 py-2 rounded-md text-sm font-medium capitalize transition-colors ${abaAtiva === tab ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            {tab === 'dashboard' ? 'Métricas Globais' : 
             tab === 'usuarios' ? 'Assinantes e Usuários' : 
             tab === 'planos' ? 'Planos (Mercado Pago)' : 
             tab === 'resultados' ? 'Resultados por Cliente' : 
             tab === 'faq' ? 'Gestão de FAQ' : 
             tab === 'logs' ? 'Logs de Atividade' : 'Configuração'}
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
                              disabled={u.role === UserRole.ADMIN || mutationUpdateUser.isPending} 
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
                            <Button variant="ghost" size="icon" onClick={() => { setUserToDelete(u); setIsDeleteOpen(true); }} title="Excluir Usuário" disabled={u.role === UserRole.ADMIN}>
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

      {abaAtiva === 'config' && (
        <SystemConfigTab />
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
                    value={userEdit.role || UserRole.USER}
                    onChange={e => setUserEdit({...userEdit, role: e.target.value})}
                  >
                    <option value={UserRole.USER}>Mentor</option>
                    <option value={UserRole.CLIENT}>Cliente</option>
                    <option value={UserRole.ADMIN}>Admin</option>
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
                  value={(inviteData as any).role || UserRole.USER}
                  onChange={e => setInviteData({...inviteData, role: e.target.value} as any)}
                >
                  <option value={UserRole.USER}>Mentor / Profissional</option>
                  <option value={UserRole.CLIENT}>Cliente</option>
                  <option value={UserRole.ADMIN}>Administrador</option>
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
  const [faqToEdit, setFaqToEdit] = useState<any>(null);
  const [isEditFaqOpen, setIsEditFaqOpen] = useState(false);
  
  const [isEditingSupportConfig, setIsEditingSupportConfig] = useState(false);
  const [supportDraft, setSupportDraft] = useState<any>(null);

  const { data: supportConfig } = useQuery({
    queryKey: ['support-config-admin'],
    queryFn: async () => {
      const docRef = doc(db, 'settings', 'support');
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? docSnap.data() : null;
    }
  });

  const mutationUpdateSupport = useMutation({
    mutationFn: async (data: any) => {
      await setDoc(doc(db, 'settings', 'support'), data, { merge: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-config'] });
      queryClient.invalidateQueries({ queryKey: ['support-config-admin'] });
      toast.success('Configurações de suporte atualizadas!');
      setIsEditingSupportConfig(false);
    }
  });

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

  const mutationUpdateFaq = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: any }) => {
      await updateDoc(doc(db, 'faqs', id), data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faqs'] });
      setIsEditFaqOpen(false);
      setFaqToEdit(null);
      toast.success('FAQ atualizado com sucesso!');
    }
  });

  if (isLoading) return <TableSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/40 p-4 rounded-xl border border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Conteúdo de Suporte</h2>
          <p className="text-sm text-slate-500">Configure o cabeçalho e canais de contato da página de suporte.</p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => {
            setSupportDraft(supportConfig || {
              header: { 
                title: "Como podemos ajudar?", 
                description: "Encontre respostas rápidas para suas dúvidas ou entre em contato com nossa equipe de suporte." 
              },
              contactCards: [
                { id: "email", title: "Email", description: "Respondemos em até 24h úteis.", link: "mailto:suporte@powerlife.com", linkText: "suporte@powerlife.com", color: "blue", icon: "Mail" },
                { id: "whatsapp", title: "WhatsApp", description: "Atendimento em horário comercial.", link: "https://wa.me/5511999999999", linkText: "(11) 99999-9999", color: "green", icon: "MessageCircle" },
                { id: "manuais", title: "Manuais", description: "Guias detalhados das ferramentas.", link: "/ajuda/manuais", linkText: "Acessar Guias", color: "purple", icon: "FileText" }
              ]
            });
            setIsEditingSupportConfig(true);
          }}
          className="border-blue-200 text-blue-600 hover:bg-blue-50"
        >
          <Edit2 className="w-4 h-4 mr-2" />
          Editar Página de Suporte
        </Button>
      </div>

      <div className="flex justify-between items-center pt-4 border-t border-slate-100">
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
                      <Button variant="ghost" size="icon" onClick={() => { setFaqToEdit(faq); setIsEditFaqOpen(true); }} className="text-slate-500 hover:text-blue-600">
                        <Edit className="w-4 h-4" />
                      </Button>
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

      <Dialog open={isEditFaqOpen} onOpenChange={setIsEditFaqOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar FAQ</DialogTitle>
          </DialogHeader>
          {faqToEdit && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Input value={faqToEdit.category} onChange={e => setFaqToEdit({...faqToEdit, category: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Pergunta</Label>
                <Input value={faqToEdit.question} onChange={e => setFaqToEdit({...faqToEdit, question: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Resposta</Label>
                <textarea 
                  className="w-full min-h-[100px] p-3 rounded-md border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  value={faqToEdit.answer} 
                  onChange={e => setFaqToEdit({...faqToEdit, answer: e.target.value})}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditFaqOpen(false)}>Cancelar</Button>
            <Button onClick={() => mutationUpdateFaq.mutate({ id: faqToEdit.id, data: { category: faqToEdit.category, question: faqToEdit.question, answer: faqToEdit.answer } })} disabled={mutationUpdateFaq.isPending} className="bg-blue-600 hover:bg-blue-700">
              {mutationUpdateFaq.isPending ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditingSupportConfig} onOpenChange={setIsEditingSupportConfig}>
        <DialogContent className="max-w-3xl overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Configuração da Página de Suporte</DialogTitle>
          </DialogHeader>
          {supportDraft && (
            <div className="space-y-8 py-4">
              <div className="space-y-4">
                <h3 className="font-bold text-blue-600 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Cabeçalho
                </h3>
                <div className="grid grid-cols-1 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="space-y-2">
                    <Label>Título</Label>
                    <Input 
                      value={supportDraft.header?.title} 
                      onChange={e => setSupportDraft({...supportDraft, header: {...supportDraft.header, title: e.target.value}})} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Descrição</Label>
                    <textarea 
                      className="w-full min-h-[80px] p-2 rounded-md border border-slate-200 text-sm"
                      value={supportDraft.header?.description} 
                      onChange={e => setSupportDraft({...supportDraft, header: {...supportDraft.header, description: e.target.value}})} 
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-bold text-green-600 flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  Canais de Contato
                </h3>
                <div className="space-y-6">
                  {supportDraft.contactCards?.map((card: any, idx: number) => (
                    <div key={idx} className="p-4 border border-slate-200 rounded-xl space-y-4 relative bg-white shadow-sm hover:shadow-md transition-shadow">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="absolute top-2 right-2 text-red-400 hover:text-red-600 hover:bg-red-50"
                        onClick={() => {
                          const cards = [...supportDraft.contactCards];
                          cards.splice(idx, 1);
                          setSupportDraft({...supportDraft, contactCards: cards});
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Título do Card</Label>
                          <Input 
                            value={card.title} 
                            onChange={e => {
                              const cards = [...supportDraft.contactCards];
                              cards[idx].title = e.target.value;
                              setSupportDraft({...supportDraft, contactCards: cards});
                            }} 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Ícone</Label>
                          <select 
                            className="w-full p-2 rounded-md border border-slate-200 text-sm"
                            value={card.icon}
                            onChange={e => {
                              const cards = [...supportDraft.contactCards];
                              cards[idx].icon = e.target.value;
                              setSupportDraft({...supportDraft, contactCards: cards});
                            }}
                          >
                            <option value="Mail">Email (Mail)</option>
                            <option value="MessageCircle">WhatsApp (MessageCircle)</option>
                            <option value="FileText">Manuais (FileText)</option>
                            <option value="Activity">Atividade (Activity)</option>
                            <option value="ExternalLink">Link Externo</option>
                            <option value="ShieldAlert">Escudo/Segurança</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label>Texto do Link</Label>
                          <Input 
                            value={card.linkText} 
                            onChange={e => {
                              const cards = [...supportDraft.contactCards];
                              cards[idx].linkText = e.target.value;
                              setSupportDraft({...supportDraft, contactCards: cards});
                            }} 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Cor (Tailwind name)</Label>
                          <select 
                            className="w-full p-2 rounded-md border border-slate-200 text-sm"
                            value={card.color}
                            onChange={e => {
                              const cards = [...supportDraft.contactCards];
                              cards[idx].color = e.target.value;
                              setSupportDraft({...supportDraft, contactCards: cards});
                            }}
                          >
                            <option value="blue">Azul</option>
                            <option value="green">Verde</option>
                            <option value="purple">Roxo</option>
                            <option value="orange">Laranja</option>
                            <option value="red">Vermelho</option>
                          </select>
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label>Descrição</Label>
                          <Input 
                            value={card.description} 
                            onChange={e => {
                              const cards = [...supportDraft.contactCards];
                              cards[idx].description = e.target.value;
                              setSupportDraft({...supportDraft, contactCards: cards});
                            }} 
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label>Link (URL, mailto: ou rota local)</Label>
                          <Input 
                            value={card.link} 
                            onChange={e => {
                              const cards = [...supportDraft.contactCards];
                              cards[idx].link = e.target.value;
                              setSupportDraft({...supportDraft, contactCards: cards});
                            }} 
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  <Button 
                    variant="outline" 
                    className="w-full border-dashed py-6"
                    onClick={() => {
                      const cards = supportDraft.contactCards || [];
                      setSupportDraft({
                        ...supportDraft, 
                        contactCards: [...cards, { id: `card-${Date.now()}`, title: "Novo Canal", description: "Descrição aqui", link: "#", linkText: "Clique aqui", color: "blue", icon: "Mail" }]
                      });
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Novo Card de Contato
                  </Button>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditingSupportConfig(false)}>Cancelar</Button>
            <Button 
              onClick={() => mutationUpdateSupport.mutate(supportDraft)} 
              disabled={mutationUpdateSupport.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {mutationUpdateSupport.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Salvar Configurações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SystemConfigTab() {
  const { user, isAdmin } = useAuth();
  
  const { data: health, isLoading } = useQuery<any>({
    queryKey: ['system-health-detailed'],
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
    enabled: !!user && isAdmin
  });

  if (isLoading) return <TableSkeleton />;

  const featureItems = [
    { id: 'firebase', name: 'Firebase Firestore', description: 'Banco de dados central e persistência de dados.', env: 'FIREBASE_SERVICE_ACCOUNT_KEY / ADC' },
    { id: 'gemini', name: 'Gemini AI', description: 'Geração de relatórios automáticos com inteligência artificial.', env: 'GEMINI_API_KEY' },
    { id: 'resend', name: 'Resend (E-mail)', description: 'Envio de convites, lembretes e notificações por e-mail.', env: 'RESEND_API_KEY' },
    { id: 'stripe', name: 'Stripe', description: 'Processamento de pagamentos globais e assinaturas recorrentes.', env: 'STRIPE_SECRET_KEY' },
    { id: 'mercadopago', name: 'Mercado Pago', description: 'Gateway de pagamento brasileiro (Pix e cartões).', env: 'MERCADOPAGO_ACCESS_TOKEN' },
    { id: 'googleOAuth', name: 'Google OAuth & Calendar', description: 'Sincronização de sessões e tarefas com a agenda do Google.', env: 'GOOGLE_CLIENT_ID / SECRET' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Diagnóstico de Integrações</h2>
          <p className="text-sm text-slate-500">Monitoramento em tempo real dos serviços externos e chaves de API.</p>
        </div>
        <Badge variant="outline" className="bg-blue-50 text-blue-700 flex gap-2 items-center px-3 py-1">
          <Activity className="w-3 h-3" />
          Live Status
        </Badge>
      </div>

      <div className="grid gap-4">
        {featureItems.map((item) => {
          const status = health?.[item.id];
          const isEnabled = item.id === 'firebase' ? (status?.status === 'ok' || status?.status === 'warning') : status?.enabled;
          const statusMessage = status?.message || (isEnabled ? 'Configurado e pronto' : 'Não configurado');
          
          return (
            <Card key={item.id} className="bg-white border-slate-200 group hover:border-blue-200 transition-all">
              <CardContent className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-full transition-colors ${
                    isEnabled ? 'bg-green-50 text-green-600' : 'bg-slate-50 text-slate-400'
                  }`}>
                    {isEnabled ? <CheckCircle2 className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-800">{item.name}</h3>
                      {item.id === 'firebase' && status?.status === 'warning' && (
                        <Badge className="bg-orange-100 text-orange-700 text-[10px]">Fallback Activo</Badge>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 mb-1">{item.description}</p>
                    <div className="flex items-center gap-2">
                      <code className="text-[10px] bg-slate-50 px-2 py-0.5 rounded border border-slate-100 font-mono text-slate-500">
                        {item.env}
                      </code>
                      <span className="text-[10px] text-slate-400">•</span>
                      <span className={cn(
                        "text-[10px] font-medium",
                        isEnabled ? "text-green-600" : "text-slate-400"
                      )}>
                        {statusMessage}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <Badge className={cn(
                    "shadow-none border",
                    isEnabled 
                      ? 'bg-green-100 text-green-700 border-green-200' 
                      : 'bg-slate-100 text-slate-500 border-slate-200'
                  )}>
                    {isEnabled ? 'Ativo' : 'Indisponível'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex gap-3">
        <Key className="w-5 h-5 text-blue-600 shrink-0" />
        <div className="text-sm text-blue-700">
          <p className="font-bold mb-1">Como configurar?</p>
          <p>Para ativar recursos pendentes, acesse o painel lateral no <strong>AI Studio</strong>, clique em <strong>Secrets</strong> e adicione as variáveis de ambiente mencionadas acima. Os recursos serão ativados automaticamente após a atualização.</p>
        </div>
      </div>

      <Card className="bg-white border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-600" />
            Suporte e Testes de E-mail
          </CardTitle>
          <CardDescription>Verifique se o serviço Resend está operando e envie e-mails de teste.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
             <div className="flex-1 space-y-2">
                <Label>E-mail do Destinatário</Label>
                <Input 
                  placeholder="exemplo@gmail.com" 
                  value={(health as any)?.testEmail || ''} 
                  onChange={(e) => {
                    // This is local state for testing, we use setAbaAtiva or a local state
                  }}
                  id="test-email-input"
                />
             </div>
             <div className="flex items-end">
                <Button 
                  onClick={async () => {
                    const email = (document.getElementById('test-email-input') as HTMLInputElement)?.value;
                    if (!email) return toast.error('Digite um e-mail de teste');
                    
                    try {
                      const token = await user?.getIdToken();
                      const res = await fetch('/api/notifications/test-email', {
                        method: 'POST',
                        headers: { 
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                          to: email,
                          subject: "Teste de Integração PowerLife",
                          body: "<h1>Sucesso!</h1><p>A integração com o Resend está funcionando corretamente no seu ambiente.</p>"
                        })
                      });
                      if (res.ok) toast.success('E-mail de teste enviado com sucesso!');
                      else toast.error('Falha ao enviar e-mail de teste');
                    } catch (e) {
                      toast.error('Erro na requisição');
                    }
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={!health?.resend?.enabled}
                >
                  Enviar Teste
                </Button>
             </div>
          </div>
          {!health?.resend?.enabled && (
            <p className="text-xs text-amber-600 font-medium flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              O serviço de e-mail está inativo. Configure a RESEND_API_KEY para habilitar.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
