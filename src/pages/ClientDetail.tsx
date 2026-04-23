import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, doc, onSnapshot, query, where, orderBy, Timestamp, addDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  Calendar, 
  Target, 
  Activity, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Download, 
  Trash2, 
  Paperclip,
  Plus,
  Edit,
  Tag as TagIcon,
  ShieldCheck,
  Copy,
  X,
  UserCircle,
  Heart,
  Search,
  Filter
} from 'lucide-react';
import { FileUpload } from '@/components/FileUpload';
import { ClientActionShortcuts } from '@/components/ClientActionShortcuts';
import { ConsolidatedReportTemplate } from '@/components/ConsolidatedReportTemplate';
import { ExportPdfButton } from '@/components/ExportPdfButton';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatDateOrTimestamp, parseSafeDate, safeFormat, formatFileSize } from '@/lib/utils';

export function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, userData } = useAuth();
  
  const [cliente, setCliente] = useState<any>(null);
  const [metas, setMetas] = useState<any[]>([]);
  const [agendamentos, setAgendamentos] = useState<any[]>([]);
  const [anexos, setAnexos] = useState<any[]>([]);
  const [notas, setNotas] = useState<any[]>([]);
  const [avaliacoes, setAvaliacoes] = useState<any[]>([]);
  const [mensagens, setMensagens] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Edit Client State
  const [isEditClientOpen, setIsEditClientOpen] = useState(false);
  const [editClientData, setEditClientData] = useState<any>({});
  const [newTag, setNewTag] = useState('');

  // Professional Notes State
  const [isNoteOpen, setIsNoteOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<any>(null);
  const [noteContent, setNoteContent] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [evaluationFilter, setEvaluationFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  const handleSendMessage = async () => {
    if (!id || !user || !newMessage.trim()) return;
    setIsSendingMessage(true);
    try {
      await addDoc(collection(db, 'mensagens'), {
        cliente_id: id,
        mentor_id: user.uid,
        sender_id: user.uid,
        content: newMessage.trim(),
        created_at: Timestamp.now(),
        read: false
      });
      setNewMessage('');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao enviar mensagem.');
    } finally {
      setIsSendingMessage(false);
    }
  };

  useEffect(() => {
    if (!id || !user) return;

    const clientPath = `clientes/${id}`;
    const unsubscribeClient = onSnapshot(doc(db, 'clientes', id), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setCliente({
          id: docSnap.id,
          ...data,
          data_inicio: data.data_inicio instanceof Timestamp 
            ? data.data_inicio.toDate().toISOString() 
            : data.data_inicio
        });
        setEditClientData({
          nome: data.nome,
          email: data.email,
          telefone: data.telefone || '',
          status: data.status || 'ativo',
          tags: data.tags || []
        });
      } else {
        setCliente(null);
      }
      setIsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, clientPath);
      setIsLoading(false);
    });

    const metasPath = 'metas_smart';
    const qMetas = query(
      collection(db, metasPath),
      where('cliente_id', '==', id),
      orderBy('created_date', 'desc')
    );
    const unsubscribeMetas = onSnapshot(qMetas, (snapshot) => {
      setMetas(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, metasPath);
    });

    const agendamentosPath = 'agendamentos';
    const qAgendamentos = query(
      collection(db, agendamentosPath),
      where('cliente_id', '==', id),
      orderBy('data_inicio', 'desc')
    );
    const unsubscribeAgendamentos = onSnapshot(qAgendamentos, (snapshot) => {
      setAgendamentos(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, agendamentosPath);
    });

    const anexosPath = `clientes/${id}/anexos`;
    const qAnexos = query(
      collection(db, anexosPath),
      orderBy('uploadedAt', 'desc')
    );
    const unsubscribeAnexos = onSnapshot(qAnexos, (snapshot) => {
      setAnexos(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, anexosPath);
    });

    const notasPath = `clientes/${id}/professional_notes`;
    const qNotas = query(
      collection(db, notasPath),
      orderBy('created_at', 'desc')
    );
    const unsubscribeNotas = onSnapshot(qNotas, (snapshot) => {
      setNotas(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, notasPath);
    });

    // Unified Evaluations Listeners
    const evaluationCollections = [
      { name: 'rodas_da_vida', type: 'Roda da Vida' },
      { name: 'analises_swot', type: 'Análise SWOT' },
      { name: 'perfis_disc', type: 'Perfil DISC' },
      { name: 'valores_pessoais', type: 'Valores Pessoais' },
      { name: 'pdis', type: 'PDI' }
    ];

    const unsubscribes: (() => void)[] = [];
    const evaluationData: Record<string, any[]> = {};

    evaluationCollections.forEach(coll => {
      const q = query(
        collection(db, coll.name),
        where('cliente_id', '==', id),
        orderBy('created_at' in ({} as any) ? 'created_at' : ('created_date' in ({} as any) ? 'created_date' : 'created_at'), 'desc')
      );
      
      // Note: Some collections use created_at, others created_date. 
      // I'll use a more robust query if possible or just handle it.
      // Actually, let's just query without ordering if fields differ, and sort in memory.
      const qSimple = query(collection(db, coll.name), where('cliente_id', '==', id));

      const unsub = onSnapshot(qSimple, (snapshot) => {
        evaluationData[coll.name] = snapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data(),
          evaluationType: coll.type,
          collectionName: coll.name,
          date: doc.data().created_at || doc.data().created_date || doc.data().data_inicio
        }));
        
        // Merge all evaluation data
        const all = Object.values(evaluationData).flat().sort((a, b) => {
          const dateA = parseSafeDate(a.date) || new Date(0);
          const dateB = parseSafeDate(b.date) || new Date(0);
          return dateB.getTime() - dateA.getTime();
        });
        setAvaliacoes(all);
      });
      unsubscribes.push(unsub);
    });

    const mensagensPath = 'mensagens';
    const qMensagens = query(
      collection(db, mensagensPath),
      where('cliente_id', '==', id),
      orderBy('created_at', 'asc')
    );
    const unsubscribeMensagens = onSnapshot(qMensagens, (snapshot) => {
      setMensagens(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, mensagensPath);
    });

    return () => {
      unsubscribeClient();
      unsubscribeMetas();
      unsubscribeAgendamentos();
      unsubscribeAnexos();
      unsubscribeNotas();
      unsubscribeMensagens();
      unsubscribes.forEach(unsub => unsub());
    };
  }, [id, user]);

  const handleUpdateClient = async () => {
    if (!id) return;
    try {
      await updateDoc(doc(db, 'clientes', id), editClientData);
      toast.success('Perfil do cliente atualizado!');
      setIsEditClientOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao atualizar perfil.');
    }
  };

  const handleAddTag = () => {
    if (!newTag.trim()) return;
    if (editClientData.tags?.includes(newTag.trim())) {
      setNewTag('');
      return;
    }
    setEditClientData({
      ...editClientData,
      tags: [...(editClientData.tags || []), newTag.trim()]
    });
    setNewTag('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setEditClientData({
      ...editClientData,
      tags: editClientData.tags.filter((t: string) => t !== tagToRemove)
    });
  };

  const handleSaveNote = async () => {
    if (!id || !user || !noteContent.trim()) return;
    setIsSavingNote(true);
    try {
      const notasRef = collection(db, `clientes/${id}/professional_notes`);
      if (editingNote) {
        await updateDoc(doc(db, `clientes/${id}/professional_notes`, editingNote.id), {
          content: noteContent,
          updated_at: Timestamp.now()
        });
        toast.success('Anotação atualizada!');
      } else {
        await addDoc(notasRef, {
          cliente_id: id,
          mentor_id: user.uid,
          content: noteContent,
          created_at: Timestamp.now(),
          updated_at: Timestamp.now()
        });
        toast.success('Anotação salva!');
      }
      setIsNoteOpen(false);
      setNoteContent('');
      setEditingNote(null);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar anotação.');
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!id) return;
    if (!confirm('Tem certeza que deseja excluir esta anotação?')) return;
    try {
      await deleteDoc(doc(db, `clientes/${id}/professional_notes`, noteId));
      toast.success('Anotação excluída!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao excluir anotação.');
    }
  };

  const handleAtivarPortal = async () => {
    if (!id) return;
    try {
      await updateDoc(doc(db, 'clientes', id), {
        portal_enabled: true
      });
      toast.success('Portal ativado com sucesso!');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `clientes/${id}`);
    }
  };

  const handleFileUpload = async (metadata: { url: string; fileName: string; size: number; type: string }) => {
    if (!id) return;
    try {
      const anexosRef = collection(db, `clientes/${id}/anexos`);
      await addDoc(anexosRef, {
        name: metadata.fileName,
        url: metadata.url,
        size: metadata.size,
        type: metadata.type,
        uploadedAt: Timestamp.now(),
        uploadedBy: user?.uid
      });
      toast.success('Documento adicionado com sucesso!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar metadados do documento.');
    }
  };

  const handleDeleteAnexo = async (anexoId: string) => {
    if (!id) return;
    if (!confirm('Tem certeza que deseja excluir este anexo?')) return;
    try {
      await deleteDoc(doc(db, `clientes/${id}/anexos`, anexoId));
      toast.success('Anexo excluído com sucesso!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao excluir anexo.');
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500">Carregando perfil...</div>;
  }

  if (!cliente) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">Cliente não encontrado</h2>
        <Button onClick={() => navigate('/Clientes')} variant="outline">Voltar para lista</Button>
      </div>
    );
  }

  const clientMetas = metas;
  const clientAgendamentos = agendamentos;

  return (
    <>
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <Button variant="ghost" className="mb-2 text-slate-500 hover:text-slate-800 p-0 hover:bg-transparent" onClick={() => navigate('/Clientes')}>
        <ArrowLeft className="w-4 h-4 mr-2" /> Voltar para Clientes
      </Button>

      {/* Header Profile */}
      <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200 flex flex-col md:flex-row items-start md:items-center gap-6">
        <div className="w-24 h-24 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-4xl font-bold shrink-0">
          {cliente.nome.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-slate-800">{cliente.nome}</h1>
            <Badge variant={cliente.status === 'ativo' ? 'success' : 'secondary'} className={cliente.status === 'ativo' ? 'bg-green-100 text-green-700' : ''}>
              {cliente.status === 'ativo' ? 'Ativo' : 'Inativo'}
            </Badge>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-slate-600">
            <div className="flex items-center"><Mail className="w-4 h-4 mr-1.5 text-slate-400" /> {cliente.email}</div>
            <div className="flex items-center"><Phone className="w-4 h-4 mr-1.5 text-slate-400" /> {cliente.telefone || 'Não informado'}</div>
            <div className="flex items-center"><Calendar className="w-4 h-4 mr-1.5 text-slate-400" /> Cliente desde {formatDateOrTimestamp(cliente.data_inicio)}</div>
          </div>
          {cliente.tags && cliente.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {cliente.tags.map((tag: string) => (
                <Badge key={tag} variant="outline" className="bg-slate-50 text-slate-500 border-slate-200 font-normal">
                  <TagIcon className="w-3 h-3 mr-1" /> {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <ExportPdfButton 
            targetId="consolidated-report-content" 
            filename={`relatorio-${cliente.nome.toLowerCase().replace(/\s+/g, '-')}`}
            title="Relatório Consolidado de Mentoria"
            userName={cliente.nome}
            className="flex-1 md:flex-none"
          />
          <Button variant="outline" className="flex-1 md:flex-none" onClick={() => setIsEditClientOpen(true)}>Editar Perfil</Button>
          <Button className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-700" onClick={() => navigate(`/Agendamentos?clienteId=${id}`)}>Agendar Sessão</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-8">
          {/* Tabs */}
          <Tabs defaultValue="visao-geral" className="w-full">
        <TabsList className="bg-white border border-slate-200 p-1 mb-6 w-full justify-start overflow-x-auto">
          <TabsTrigger value="visao-geral">Visão Geral</TabsTrigger>
          <TabsTrigger value="avaliacoes">Avaliações</TabsTrigger>
          <TabsTrigger value="metas">Metas SMART</TabsTrigger>
          <TabsTrigger value="agendamentos">Agendamentos</TabsTrigger>
          <TabsTrigger value="anexos">Documentos</TabsTrigger>
          <TabsTrigger value="mensagens">Mensagens</TabsTrigger>
        </TabsList>

        <TabsContent value="visao-geral" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-500 flex items-center">
                  <Target className="w-4 h-4 mr-2 text-blue-500" /> Metas Ativas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-800">{clientMetas.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-500 flex items-center">
                  <Activity className="w-4 h-4 mr-2 text-green-500" /> Sessões Realizadas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-800">{clientAgendamentos.filter((a:any) => a.status === 'concluido').length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-500 flex items-center">
                  <Clock className="w-4 h-4 mr-2 text-orange-500" /> Próxima Sessão
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold text-slate-800">
                  {clientAgendamentos.find((a:any) => a.status === 'pendente') 
                    ? formatDateOrTimestamp(clientAgendamentos.find((a:any) => a.status === 'pendente').data_inicio) 
                    : 'Nenhuma agendada'}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Anotações do Profissional</CardTitle>
              <Button variant="outline" size="sm" onClick={() => { setEditingNote(null); setNoteContent(''); setIsNoteOpen(true); }}>
                <Plus className="w-4 h-4 mr-2" /> Nova Anotação
              </Button>
            </CardHeader>
            <CardContent>
              {notas.length > 0 ? (
                <div className="space-y-4">
                  {notas.map((nota: any) => (
                    <div key={nota.id} className="p-4 rounded-lg border border-slate-100 bg-slate-50 group relative">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          {safeFormat(nota.created_at, "dd/MM/yyyy 'às' HH:mm", 'Recentemente')}
                        </span>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-blue-600" onClick={() => { setEditingNote(nota); setNoteContent(nota.content); setIsNoteOpen(true); }}>
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-red-600" onClick={() => handleDeleteNote(nota.id)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{nota.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-slate-50 p-12 rounded-lg border border-dashed border-slate-200 text-center text-slate-500">
                  <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p>Nenhuma anotação privada registrada ainda.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="avaliacoes">
          <Card>
            <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle>Histórico de Avaliações</CardTitle>
                <CardDescription>Todas as ferramentas aplicadas a este cliente</CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative">
                  <Input 
                    placeholder="Buscar avaliação..." 
                    className="pl-9 w-full sm:w-64"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <FileText className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                </div>
                <select 
                  className="h-10 px-3 rounded-md border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                  value={evaluationFilter}
                  onChange={(e) => setEvaluationFilter(e.target.value)}
                >
                  <option value="all">Todos os tipos</option>
                  <option value="Roda da Vida">Roda da Vida</option>
                  <option value="Análise SWOT">Análise SWOT</option>
                  <option value="Perfil DISC">Perfil DISC</option>
                  <option value="Valores Pessoais">Valores Pessoais</option>
                  <option value="PDI">PDI</option>
                </select>
              </div>
            </CardHeader>
            <CardContent>
              {avaliacoes.length > 0 ? (
                <div className="space-y-4">
                  {avaliacoes
                    .filter(a => evaluationFilter === 'all' || a.evaluationType === evaluationFilter)
                    .filter(a => searchTerm === '' || (a.titulo || a.evaluationType).toLowerCase().includes(searchTerm.toLowerCase()))
                    .map((avaliacao) => (
                      <div key={avaliacao.id} className="flex items-center justify-between p-4 border border-slate-100 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors group">
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-lg ${
                            avaliacao.collectionName === 'rodas_da_vida' ? 'bg-blue-100 text-blue-600' :
                            avaliacao.collectionName === 'analises_swot' ? 'bg-purple-100 text-purple-600' :
                            avaliacao.collectionName === 'perfis_disc' ? 'bg-orange-100 text-orange-600' :
                            avaliacao.collectionName === 'valores_pessoais' ? 'bg-red-100 text-red-600' :
                            'bg-indigo-100 text-indigo-600'
                          }`}>
                            {avaliacao.collectionName === 'rodas_da_vida' ? <Activity className="w-5 h-5" /> :
                             avaliacao.collectionName === 'analises_swot' ? <ShieldCheck className="w-5 h-5" /> :
                             avaliacao.collectionName === 'perfis_disc' ? <UserCircle className="w-5 h-5" /> :
                             avaliacao.collectionName === 'valores_pessoais' ? <Heart className="w-5 h-5" /> :
                             <Target className="w-5 h-5" />}
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-800">{avaliacao.titulo || avaliacao.evaluationType}</h4>
                            <p className="text-xs text-slate-500">
                              {safeFormat(avaliacao.date, "dd 'de' MMMM 'de' yyyy", 'Data não informada')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] uppercase tracking-wider hidden sm:inline-flex">
                            {avaliacao.evaluationType}
                          </Badge>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            onClick={() => {
                              const basePaths: Record<string, string> = {
                                'rodas_da_vida': '/RodaDaVida',
                                'analises_swot': '/AnaliseSwot',
                                'perfis_disc': '/PerfilDisc',
                                'valores_pessoais': '/ValoresPessoais',
                                'pdis': '/ferramentas/pdi'
                              };
                              navigate(`${basePaths[avaliacao.collectionName]}/${avaliacao.id}`);
                            }}
                          >
                            Ver Detalhes
                          </Button>
                        </div>
                      </div>
                    ))}
                  
                  {avaliacoes.filter(a => evaluationFilter === 'all' || a.evaluationType === evaluationFilter).length === 0 && (
                    <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                      <p>Nenhuma avaliação encontrada para os filtros selecionados.</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                  <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p>Nenhuma avaliação respondida por este cliente ainda.</p>
                  <Button variant="outline" className="mt-4" onClick={() => navigate('/RodaDaVida')}>Aplicar Roda da Vida</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metas">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Metas do Cliente</CardTitle>
              <Button size="sm" onClick={() => navigate(`/MetaSmart?clienteId=${id}`)}>Nova Meta</Button>
            </CardHeader>
            <CardContent>
              {clientMetas.length > 0 ? (
                <div className="space-y-4">
                  {clientMetas.map((meta: any) => (
                    <div key={meta.id} className="flex items-center justify-between p-4 border border-slate-100 rounded-lg bg-slate-50">
                      <div>
                        <h4 className="font-bold text-slate-800">{meta.titulo}</h4>
                        <p className="text-sm text-slate-500">Prazo: {meta.prazo}</p>
                      </div>
                      <Badge variant={meta.status === 'concluido' ? 'success' : 'default'} className={meta.status === 'em_andamento' ? 'bg-blue-500' : ''}>
                        {meta.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">Nenhuma meta cadastrada.</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agendamentos">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Histórico de Agendamentos</CardTitle>
              <Button size="sm" onClick={() => navigate(`/Agendamentos?clienteId=${id}`)}>Novo Agendamento</Button>
            </CardHeader>
            <CardContent>
              {clientAgendamentos.length > 0 ? (
                <div className="space-y-4">
                  {clientAgendamentos.map((agendamento: any) => (
                    <div key={agendamento.id} className="flex items-start gap-4 p-4 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors">
                      <div className="bg-blue-100 text-blue-700 p-3 rounded-lg text-center min-w-[80px]">
                        <div className="text-xs font-bold uppercase">{safeFormat(agendamento.data_inicio, "MMM")}</div>
                        <div className="text-2xl font-black">{safeFormat(agendamento.data_inicio, "dd")}</div>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-slate-800">{agendamento.titulo}</h4>
                        <div className="text-sm text-slate-500 flex items-center mt-1">
                          <Clock className="w-3 h-3 mr-1" /> 
                          {safeFormat(agendamento.data_inicio, "HH:mm")}
                        </div>
                      </div>
                      <Badge variant={agendamento.status === 'concluido' ? 'success' : 'secondary'}>
                        {agendamento.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">Nenhum agendamento encontrado.</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="anexos">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Paperclip className="w-5 h-5 text-blue-600" />
                    Arquivo e Documentação
                  </CardTitle>
                  <CardDescription>
                    Gestão centralizada de contratos, materiais e registros do cliente.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {anexos.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead>
                          <tr className="text-slate-500 border-b border-slate-100">
                            <th className="pb-3 font-semibold">Nome do Arquivo</th>
                            <th className="pb-3 font-semibold hidden md:table-cell">Tamanho</th>
                            <th className="pb-3 font-semibold hidden md:table-cell">Data de Upload</th>
                            <th className="pb-3 font-semibold text-right">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {anexos.map((anexo) => (
                            <tr key={anexo.id} className="group hover:bg-slate-50 transition-colors">
                              <td className="py-4">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                    <FileText className="w-4 h-4" />
                                  </div>
                                  <span className="font-medium text-slate-700 truncate max-w-[200px] md:max-w-md" title={anexo.name}>
                                    {anexo.name}
                                  </span>
                                </div>
                              </td>
                              <td className="py-4 text-slate-500 hidden md:table-cell">
                                {anexo.size ? formatFileSize(anexo.size) : '--'}
                              </td>
                              <td className="py-4 text-slate-500 hidden md:table-cell">
                                {safeFormat(anexo.uploadedAt, "dd/MM/yyyy 'às' HH:mm", 'Recentemente')}
                              </td>
                              <td className="py-4 text-right">
                                <div className="flex justify-end gap-1">
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 text-blue-600 hover:bg-blue-50"
                                    onClick={() => window.open(anexo.url, '_blank')}
                                  >
                                    <Download className="w-4 h-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 text-red-500 hover:bg-red-50"
                                    onClick={() => handleDeleteAnexo(anexo.id)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                      <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p>Nenhum documento anexado ainda.</p>
                      <p className="text-xs mt-1">Carregue arquivos importantes para este cliente.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Novo Upload
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <FileUpload 
                    folder={`users/${user?.uid}/clients/${id}/documents`}
                    onUploadComplete={handleFileUpload}
                    label="Clique ou arraste"
                    className="border-slate-200"
                  />
                  <div className="mt-4 space-y-2">
                    <p className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Máximo 5MB por arquivo
                    </p>
                    <p className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Target className="w-3 h-3" /> Formatos: PDF, JPG, PNG
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-50 border-slate-200">
                <CardContent className="p-4">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Dica de Gestão</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Mantenha contratos e planos de ação assinados aqui para fácil consulta durante as sessões.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="mensagens">
          <Card className="flex flex-col h-[600px]">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-600" />
                Mensagens com o Cliente
              </CardTitle>
              <CardDescription>Troque mensagens diretamente com seu mentorado através do portal.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
              {mensagens.length > 0 ? (
                mensagens.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`flex ${msg.sender_id === user?.uid ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] rounded-2xl px-4 py-2 shadow-sm ${
                      msg.sender_id === user?.uid 
                        ? 'bg-blue-600 text-white rounded-tr-none' 
                        : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
                    }`}>
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                      <p className={`text-[10px] mt-1 ${msg.sender_id === user?.uid ? 'text-blue-100' : 'text-slate-400'}`}>
                        {safeFormat(msg.created_at, "HH:mm", 'Agora')}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2">
                  <Mail className="w-12 h-12 text-slate-300" />
                  <p>Nenhuma mensagem trocada ainda.</p>
                </div>
              )}
            </CardContent>
            <div className="p-4 border-t bg-white">
              <div className="flex gap-2">
                <Input 
                  placeholder="Digite sua mensagem..." 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                  className="flex-1"
                />
                <Button 
                  onClick={handleSendMessage} 
                  disabled={isSendingMessage || !newMessage.trim()}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Enviar
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>

    <div className="space-y-6">
      <ClientActionShortcuts clienteId={id!} />

      {/* Portal do Cliente Card */}
      <Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="pb-3 border-b bg-slate-50/50">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            Portal do Mentorado
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          {cliente?.portal_enabled ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-green-600 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4" />
                PORTAL ATIVO
              </div>
              <p className="text-xs text-slate-500">
                O cliente já pode acessar o portal com o e-mail <strong>{cliente.email}</strong>.
              </p>
              <Button 
                variant="outline" 
                className="w-full text-xs gap-2"
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/portal/login`);
                  toast.success('Link do portal copiado!');
                }}
              >
                <Copy className="w-3 h-3" />
                Copiar Link de Acesso
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-slate-500">
                Ative o portal para que o cliente possa acompanhar metas e agendamentos.
              </p>
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700 text-xs gap-2"
                onClick={handleAtivarPortal}
              >
                <ShieldCheck className="w-3 h-3" />
                Ativar Portal
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card className="bg-blue-600 text-white border-none shadow-lg">
        <CardContent className="p-6 space-y-4">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg">Próximos Passos</h3>
            <p className="text-blue-100 text-sm leading-relaxed mt-1">
              Aplique ferramentas de diagnóstico para entender melhor o perfil deste cliente.
            </p>
          </div>
          <Button variant="secondary" className="w-full bg-white text-blue-600 hover:bg-blue-50 border-none" onClick={() => navigate('/RodaDaVida')}>
            Ver Diagnósticos
          </Button>
        </CardContent>
      </Card>
    </div>
    </div>
  </div>

  {/* Dialog Editar Perfil */}
  <Dialog open={isEditClientOpen} onOpenChange={setIsEditClientOpen}>
    <DialogContent className="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle>Editar Perfil do Cliente</DialogTitle>
        <DialogDescription>Atualize as informações de contato e status do cliente.</DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="edit-nome">Nome Completo</Label>
            <Input id="edit-nome" value={editClientData.nome} onChange={e => setEditClientData({...editClientData, nome: e.target.value})} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-email">E-mail</Label>
            <Input id="edit-email" type="email" value={editClientData.email} onChange={e => setEditClientData({...editClientData, email: e.target.value})} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="edit-telefone">Telefone</Label>
            <Input id="edit-telefone" value={editClientData.telefone} onChange={e => setEditClientData({...editClientData, telefone: e.target.value})} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-status">Status</Label>
            <select 
              id="edit-status"
              className="w-full h-10 px-3 rounded-md border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={editClientData.status}
              onChange={e => setEditClientData({...editClientData, status: e.target.value})}
            >
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
            </select>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Tags / Categorias</Label>
          <div className="flex gap-2">
            <Input 
              placeholder="Nova tag..." 
              value={newTag} 
              onChange={e => setNewTag(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
            />
            <Button variant="outline" onClick={handleAddTag} type="button">Adicionar</Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {editClientData.tags?.map((tag: string) => (
              <Badge key={tag} variant="secondary" className="gap-1 px-2 py-1">
                {tag}
                <button onClick={() => handleRemoveTag(tag)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={() => setIsEditClientOpen(false)}>Cancelar</Button>
        <Button onClick={handleUpdateClient} className="bg-blue-600 hover:bg-blue-700">Salvar Alterações</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  {/* Dialog Anotação Profissional */}
  <Dialog open={isNoteOpen} onOpenChange={setIsNoteOpen}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{editingNote ? 'Editar Anotação' : 'Nova Anotação Privada'}</DialogTitle>
        <DialogDescription>Estas notas são visíveis apenas para você.</DialogDescription>
      </DialogHeader>
      <div className="py-4">
        <Textarea 
          placeholder="Escreva suas observações sobre o cliente ou a sessão..."
          className="min-h-[200px] resize-none"
          value={noteContent}
          onChange={e => setNoteContent(e.target.value)}
        />
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={() => setIsNoteOpen(false)}>Cancelar</Button>
        <Button onClick={handleSaveNote} disabled={isSavingNote} className="bg-blue-600 hover:bg-blue-700">
          {isSavingNote ? 'Salvando...' : 'Salvar Anotação'}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  {/* Hidden Report Template for Export */}
  <div className="hidden">
    <div id="consolidated-report-content">
      <ConsolidatedReportTemplate 
        cliente={cliente}
        metas={metas}
        agendamentos={agendamentos}
        notas={notas}
        mentorName={userData?.name}
      />
    </div>
  </div>
    </>
  );
}
