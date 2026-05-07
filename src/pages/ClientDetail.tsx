import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { collection, doc, onSnapshot, query, where, or, and, orderBy, Timestamp, addDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AiInsights } from '@/components/AiInsights';
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
  Filter,
  ArrowRight,
  BarChart2,
  Sparkles,
  Star
} from 'lucide-react';
import { FileUpload } from '@/components/FileUpload';
import { ClientActionShortcuts } from '@/components/ClientActionShortcuts';
import { ActivityTimeline } from '@/components/ActivityTimeline';
import { useClientActivity } from '@/hooks/useClientActivity';
import { DossierContent } from '@/components/DossierContent';
import { StickyNotes, NoteColor } from '@/components/StickyNotes';
import { useClientDossier } from '@/hooks/useClientDossier';
import { ExportPdfButton } from '@/components/ExportPdfButton';
import { ClientResults } from '@/components/ClientResults';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatDateOrTimestamp, parseSafeDate, safeFormat, formatFileSize } from '@/lib/utils';
import { ClienteStatus, MetaStatus, AgendamentoStatus, UserRole } from '@/types/enums';
import { clienteSchema, ClienteFormData } from '@/types/schemas';

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
  const [isLoadingAvaliacoes, setIsLoadingAvaliacoes] = useState(true);

  // Edit Client State
  const [isEditClientOpen, setIsEditClientOpen] = useState(false);
  const [currentTags, setCurrentTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors }
  } = useForm<ClienteFormData>({
    resolver: zodResolver(clienteSchema)
  });

  // Professional Notes State (Note: CRUD moved to StickyNotes component)
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
        cliente_uid: cliente?.user_id || null,
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
        reset({
          nome: data.nome,
          email: data.email,
          telefone: data.telefone || '',
          status: data.status || ClienteStatus.ATIVO
        });
        setCurrentTags(data.tags || []);
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
      where('profissional_id', '==', user.uid),
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
      and(
        where('cliente_id', '==', id),
        or(
          where('created_by', '==', user.uid),
          where('profissional_id', '==', user.uid)
        )
      ),
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
      where('profissional_id', '==', user.uid),
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
      where('profissional_id', '==', user.uid),
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
      { name: 'pdis', type: 'PDI' },
      { name: 'avaliacoes_sessoes', type: 'Feedback de Sessão' },
      { name: 'diarios_reflexao', type: 'Diário de Reflexão' }
    ];

    const unsubscribes: (() => void)[] = [];
    const evaluationData: Record<string, any[]> = {};
    const processedCollections = new Set<string>();

    evaluationCollections.forEach(coll => {
      // Query without ordering to avoid index issues with mixed fields, we sort in memory
      const qSimple = query(
        collection(db, coll.name), 
        and(
          where('cliente_id', '==', id),
          or(
            where('profissional_id', '==', user.uid),
            where('created_by', '==', user.uid),
            where('gestor_id', '==', user.uid),
            where('mentor_id', '==', user.uid),
            where('uid', '==', user.uid),
            where('user_id', '==', user.uid),
            where('cliente_uid', '==', user.uid)
          )
        )
      );

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
        
        processedCollections.add(coll.name);
        if (processedCollections.size === evaluationCollections.length) {
          setIsLoadingAvaliacoes(false);
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, coll.name);
        processedCollections.add(coll.name);
        if (processedCollections.size === evaluationCollections.length) {
          setIsLoadingAvaliacoes(false);
        }
      });
      unsubscribes.push(unsub);
    });

    const mensagensPath = 'mensagens';
    const qMensagens = query(
      collection(db, mensagensPath),
      where('cliente_id', '==', id),
      where('mentor_id', '==', user.uid),
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

  const handleUpdateClient = async (data: ClienteFormData) => {
    if (!id) return;
    setIsUpdating(true);
    try {
      await updateDoc(doc(db, 'clientes', id), {
        ...data,
        tags: currentTags
      });
      toast.success('Perfil do cliente atualizado!');
      setIsEditClientOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao atualizar perfil.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddTag = () => {
    if (!newTag.trim()) return;
    if (currentTags.includes(newTag.trim())) {
      setNewTag('');
      return;
    }
    setCurrentTags([...currentTags, newTag.trim()]);
    setNewTag('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setCurrentTags(currentTags.filter((t: string) => t !== tagToRemove));
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

  const handleAddStickyNote = async (content: string, color: NoteColor) => {
    if (!id || !user) return;
    try {
      const notasRef = collection(db, `clientes/${id}/professional_notes`);
      await addDoc(notasRef, {
        cliente_id: id,
        cliente_uid: cliente?.user_id || null,
        mentor_id: user.uid,
        content,
        color,
        created_at: Timestamp.now(),
        updated_at: Timestamp.now(),
        profissional_id: user.uid
      });
      toast.success('Nota rápida salva!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar nota.');
      throw error;
    }
  };

  const handleUpdateStickyNote = async (noteId: string, content: string, color: NoteColor) => {
    if (!id) return;
    try {
      await updateDoc(doc(db, `clientes/${id}/professional_notes`, noteId), {
        content,
        color,
        updated_at: Timestamp.now()
      });
    } catch (error: any) {
      toast.error(error.message || 'Erro ao atualizar nota.');
      throw error;
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
        uploadedBy: user?.uid,
        cliente_uid: cliente?.user_id || null,
        profissional_id: user?.uid
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
            <Badge variant={cliente.status === ClienteStatus.ATIVO ? 'success' : 'secondary'} className={cliente.status === ClienteStatus.ATIVO ? 'bg-green-100 text-green-700' : ''}>
              {cliente.status === ClienteStatus.ATIVO ? 'Ativo' : 'Inativo'}
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
            targetId="dossier-content" 
            filename={`relatorio-${cliente.nome.toLowerCase().replace(/\s+/g, '-')}`}
            title="Dossiê Consolidado de Mentoring"
            userName={cliente.nome}
            className="flex-1 md:flex-none"
          />
          <Button 
            variant="outline" 
            className="flex-1 md:flex-none border-blue-200 text-blue-600 hover:bg-blue-50" 
            onClick={() => navigate(`/ferramentas/relatorio-final/${id}`)}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Dossiê Estratégico
          </Button>
          <Button variant="outline" className="flex-1 md:flex-none" onClick={() => setIsEditClientOpen(true)}>Editar Perfil</Button>
          <Button className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-700" onClick={() => navigate(`/Agendamentos?clienteId=${id}&clienteUid=${cliente.user_id}`)}>Agendar Sessão</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-8">
          {cliente && (
            <AiInsights 
              context={{ 
                cliente: { nome: cliente.nome, email: cliente.email, status: cliente.status },
                metas: metas.map(m => ({ titulo: m.titulo, status: m.status, progresso: m.progresso })),
                agendamentos: agendamentos.slice(0, 5).map(a => ({ titulo: a.titulo, data: a.data_inicio })),
                historico: notas.slice(0, 5).map(n => ({ conteudo: n.content }))
              }} 
            />
          )}
          {/* Tabs */}
          <Tabs defaultValue="visao-geral" className="w-full">
        <TabsList className="bg-white border border-slate-200 p-1 mb-6 w-full justify-start overflow-x-auto h-auto min-h-[48px] flex-nowrap">
          <TabsTrigger value="visao-geral" className="gap-2 py-2">
            <Activity className="w-4 h-4" />
            <span className="hidden sm:inline">Visão Geral</span>
            <span className="sm:hidden text-[10px]">Geral</span>
          </TabsTrigger>
          <TabsTrigger value="timeline" className="gap-2 py-2">
            <Clock className="w-4 h-4" />
            <span className="hidden sm:inline">Linha do Tempo</span>
            <span className="sm:hidden text-[10px]">Timeline</span>
          </TabsTrigger>
          <TabsTrigger value="avaliacoes" className="gap-2 py-2">
            <BarChart2 className="w-4 h-4" />
            <span className="hidden sm:inline">Avaliações</span>
            <span className="sm:hidden text-[10px]">Testes</span>
          </TabsTrigger>
          <TabsTrigger value="metas" className="gap-2 py-2">
            <Target className="w-4 h-4" />
            <span className="hidden sm:inline">Metas SMART</span>
            <span className="sm:hidden text-[10px]">Metas</span>
          </TabsTrigger>
          <TabsTrigger value="agendamentos" className="gap-2 py-2">
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline">Agendamentos</span>
            <span className="sm:hidden text-[10px]">Sessões</span>
          </TabsTrigger>
          <TabsTrigger value="anexos" className="gap-2 py-2">
            <Paperclip className="w-4 h-4" />
            <span className="hidden sm:inline">Documentos</span>
            <span className="sm:hidden text-[10px]">Docs</span>
          </TabsTrigger>
          <TabsTrigger value="mensagens" className="gap-2 py-2">
            <Mail className="w-4 h-4" />
            <span className="hidden sm:inline">Mensagens</span>
            <span className="sm:hidden text-[10px]">Chat</span>
          </TabsTrigger>
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
                <div className="text-3xl font-bold text-slate-800">{clientAgendamentos.filter((a:any) => a.status === AgendamentoStatus.CONCLUIDO).length}</div>
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
                  {clientAgendamentos.find((a:any) => a.status === AgendamentoStatus.PENDENTE) 
                    ? formatDateOrTimestamp(clientAgendamentos.find((a:any) => a.status === AgendamentoStatus.PENDENTE).data_inicio) 
                    : 'Nenhuma agendada'}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="md:col-span-2">
              <StickyNotes 
                notes={notas}
                onAdd={handleAddStickyNote}
                onDelete={handleDeleteNote}
                onUpdate={handleUpdateStickyNote}
              />
            </div>
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Atividades Recentes
              </h3>
              <div className="max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                <ActivityTimeline clientId={id!} />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-600" />
                Linha do Tempo de Atividades
              </CardTitle>
              <CardDescription>Acompanhe todas as interações e mudanças em tempo real para este cliente.</CardDescription>
            </CardHeader>
            <CardContent>
              <ActivityTimeline clientId={id!} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="avaliacoes">
          <Card className="mb-8">
            <CardHeader className="bg-slate-50/50 border-b">
              <div className="flex items-center gap-2 mb-1">
                <BarChart2 className="w-5 h-5 text-blue-600" />
                <CardTitle>Dossiê de Evolução Consolidada</CardTitle>
              </div>
              <CardDescription>Visualização gráfica do progresso e resultados das ferramentas aplicadas.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <ClientResults userId={id!} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle>Histórico de Ferramentas</CardTitle>
                <CardDescription>Registro cronológico de todas as aplicações</CardDescription>
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
              {isLoadingAvaliacoes ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between p-4 border border-slate-100 rounded-lg bg-slate-50/50 animate-pulse">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-200 rounded-lg"></div>
                        <div className="space-y-2">
                          <div className="w-32 h-4 bg-slate-200 rounded"></div>
                          <div className="w-24 h-3 bg-slate-200 rounded"></div>
                        </div>
                      </div>
                      <div className="h-8 w-20 bg-slate-200 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : avaliacoes.length > 0 ? (
                <div className="space-y-4">
                  <AnimatePresence mode="popLayout">
                    {avaliacoes
                      .filter(a => evaluationFilter === 'all' || a.evaluationType === evaluationFilter)
                      .filter(a => searchTerm === '' || (a.titulo || a.evaluationType).toLowerCase().includes(searchTerm.toLowerCase()))
                      .map((avaliacao, index) => (
                        <motion.div 
                          key={avaliacao.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex items-center justify-between p-4 border border-slate-100 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors group"
                        >
                          <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-lg ${
                              avaliacao.collectionName === 'rodas_da_vida' ? 'bg-blue-100 text-blue-600' :
                              avaliacao.collectionName === 'analises_swot' ? 'bg-purple-100 text-purple-600' :
                              avaliacao.collectionName === 'perfis_disc' ? 'bg-orange-100 text-orange-600' :
                              avaliacao.collectionName === 'valores_pessoais' ? 'bg-red-100 text-red-600' :
                              avaliacao.collectionName === 'avaliacoes_sessoes' ? 'bg-yellow-100 text-yellow-600' :
                              'bg-indigo-100 text-indigo-600'
                            }`}>
                              {avaliacao.collectionName === 'rodas_da_vida' ? <Activity className="w-5 h-5" /> :
                               avaliacao.collectionName === 'analises_swot' ? <ShieldCheck className="w-5 h-5" /> :
                               avaliacao.collectionName === 'perfis_disc' ? <UserCircle className="w-5 h-5" /> :
                               avaliacao.collectionName === 'valores_pessoais' ? <Heart className="w-5 h-5" /> :
                               avaliacao.collectionName === 'avaliacoes_sessoes' ? <Star className="w-5 h-5" /> :
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
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-medium group-hover:translate-x-1 transition-transform flex items-center gap-1"
                              onClick={() => {
                                const basePaths: Record<string, string> = {
                                  'rodas_da_vida': '/RodaDaVida',
                                  'analises_swot': '/AnaliseSwot',
                                  'perfis_disc': '/PerfilDisc',
                                  'valores_pessoais': '/ValoresPessoais',
                                  'pdis': '/ferramentas/pdi',
                                  'avaliacoes_sessoes': '/ferramentas/feedback',
                                  'diarios_reflexao': '/ferramentas/diario'
                                };
                                navigate(`${basePaths[avaliacao.collectionName] || '/ferramentas'}/${avaliacao.id}`);
                              }}
                            >
                              Ver Detalhes
                              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                  </AnimatePresence>
                  
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
              <div>
                <CardTitle>Metas do Cliente</CardTitle>
                <CardDescription>Acompanhe os objetivos e marcos do processo de mentoring.</CardDescription>
              </div>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => navigate(`/MetaSmart?clienteId=${id}&clienteUid=${cliente.user_id}`)}>
                <Plus className="w-4 h-4 mr-2" />
                Nova Meta
              </Button>
            </CardHeader>
            <CardContent>
              {clientMetas.length > 0 ? (
                <div className="grid gap-4">
                  {clientMetas.map((meta: any) => (
                    <div key={meta.id} className="flex items-center justify-between p-4 border border-slate-100 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-colors group">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${meta.status === MetaStatus.CONCLUIDO ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                          <Target className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{meta.titulo}</h4>
                          <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Prazo: {meta.prazo}</span>
                          </div>
                        </div>
                      </div>
                      <Badge variant={meta.status === MetaStatus.CONCLUIDO ? 'success' : 'default'} className={meta.status === MetaStatus.EM_ANDAMENTO ? 'bg-blue-500 shadow-none' : 'shadow-none'}>
                        {meta.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <Target className="w-12 h-12 text-slate-300 mx-auto mb-3 opacity-50" />
                  <p className="font-medium text-slate-600">Nenhuma meta SMART cadastrada ainda.</p>
                  <p className="text-xs mt-1 max-w-xs mx-auto">Defina objetivos claros e mensuráveis para potencializar os resultados do cliente.</p>
                  <Button variant="outline" size="sm" className="mt-4" onClick={() => navigate(`/MetaSmart?clienteId=${id}&clienteUid=${cliente.user_id}`)}>
                    Criar Primeira Meta
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agendamentos">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Histórico de Sessões</CardTitle>
                <CardDescription>Gerencie seus encontros e a jornada de desenvolvimento.</CardDescription>
              </div>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => navigate(`/Agendamentos?clienteId=${id}&clienteUid=${cliente.user_id}`)}>
                <Calendar className="w-4 h-4 mr-2" />
                Novo Agendamento
              </Button>
            </CardHeader>
            <CardContent>
              {clientAgendamentos.length > 0 ? (
                <div className="grid gap-4">
                  {clientAgendamentos.map((agendamento: any) => (
                    <div key={agendamento.id} className="flex items-start gap-4 p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition-all group">
                      <div className="bg-blue-100 text-blue-700 p-3 rounded-xl text-center min-w-[70px] flex flex-col items-center justify-center border border-blue-200">
                        <div className="text-[10px] font-bold uppercase tracking-tight opacity-70">{safeFormat(agendamento.data_inicio, "MMM")}</div>
                        <div className="text-xl font-black leading-none py-0.5">{safeFormat(agendamento.data_inicio, "dd")}</div>
                        <div className="text-[10px] font-bold opacity-70">{safeFormat(agendamento.data_inicio, "yyyy")}</div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{agendamento.titulo}</h4>
                          <Badge variant="outline" className="text-[10px] uppercase bg-slate-50 font-normal">
                            {agendamento.tipo || 'Sessão Individual'}
                          </Badge>
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-3">
                          <span className="flex items-center gap-1.5 font-medium">
                            <Clock className="w-3.5 h-3.5 text-blue-500" /> 
                            {safeFormat(agendamento.data_inicio, "HH:mm")}
                          </span>
                          {agendamento.link_sessao && (
                            <span className="flex items-center gap-1 text-blue-600 font-medium">
                              <X className="w-3 H-3 rotate-45" /> Link disponível
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge variant={agendamento.status === AgendamentoStatus.CONCLUIDO ? 'success' : 'secondary'} className="shadow-none">
                          {agendamento.status}
                        </Badge>
                        <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold px-2 py-0 border border-slate-100 hidden group-hover:flex" onClick={() => navigate(`/Agendamentos?edit=${agendamento.id}`)}>
                          Detalhes
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3 opacity-50" />
                  <p className="font-medium text-slate-600">Nenhum agendamento ativo.</p>
                  <p className="text-xs mt-1 max-w-xs mx-auto">Organize a jornada de mentoring agendando as próximas sessões estratégicas.</p>
                  <Button variant="outline" size="sm" className="mt-4" onClick={() => navigate(`/Agendamentos?clienteId=${id}&clienteUid=${cliente.user_id}`)}>
                    Agendar Primeira Sessão
                  </Button>
                </div>
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
          <Card className="flex flex-col h-[600px] border-slate-200 shadow-lg overflow-hidden">
            <CardHeader className="border-b bg-white/50 backdrop-blur-sm sticky top-0 z-10 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg">
                      <Mail className="w-5 h-5" />
                    </div>
                    Comunicação Direta
                  </CardTitle>
                  <CardDescription>Histórico de mensagens com <strong>{cliente.nome}</strong></CardDescription>
                </div>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Canal Seguro
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30 custom-scrollbar">
              {mensagens.length > 0 ? (
                mensagens.map((msg, idx) => {
                  const isMentor = msg.sender_id === user?.uid;
                  const showDate = idx === 0 || format(parseSafeDate(msg.created_at) || new Date(), 'dd/MM') !== format(parseSafeDate(mensagens[idx-1].created_at) || new Date(), 'dd/MM');
                  
                  return (
                    <React.Fragment key={msg.id}>
                      {showDate && (
                        <div className="flex justify-center my-4">
                          <span className="text-[10px] font-bold text-slate-400 bg-white px-3 py-1 rounded-full border border-slate-100 uppercase tracking-widest">
                            {format(parseSafeDate(msg.created_at) || new Date(), "dd 'de' MMMM", { locale: ptBR })}
                          </span>
                        </div>
                      )}
                      <div className={`flex ${isMentor ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                        <div className={`flex flex-col ${isMentor ? 'items-end' : 'items-start'} max-w-[85%]`}>
                          <div className={`px-4 py-2.5 rounded-2xl shadow-sm relative ${
                            isMentor 
                              ? 'bg-blue-600 text-white rounded-tr-none' 
                              : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
                          }`}>
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                          </div>
                          <span className={`text-[10px] mt-1.5 font-medium ${isMentor ? 'text-slate-400' : 'text-slate-400'}`}>
                            {safeFormat(msg.created_at, "HH:mm", 'Agora')}
                          </span>
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4 opacity-60">
                  <div className="p-4 bg-white rounded-full border border-slate-100 shadow-sm mt-[-40px]">
                    <Mail className="w-12 h-12 text-blue-200" />
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-slate-600">Inicie uma conversa</p>
                    <p className="text-xs mt-1 max-w-[200px]">As mensagens enviadas aqui serão visualizadas pelo cliente em seu portal.</p>
                  </div>
                </div>
              )}
            </CardContent>
            <div className="p-4 border-t bg-white/80 backdrop-blur-md">
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <Textarea 
                    placeholder="Escreva sua mensagem..." 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    className="min-h-[44px] max-h-[120px] resize-none border-slate-200 focus:ring-blue-500 rounded-xl py-3"
                  />
                </div>
                <Button 
                  onClick={handleSendMessage} 
                  disabled={isSendingMessage || !newMessage.trim()}
                  className="bg-blue-600 hover:bg-blue-700 h-[44px] px-6 rounded-xl shadow-md transition-all active:scale-95 flex gap-2"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span className="hidden sm:inline">Enviar</span>
                </Button>
              </div>
              <p className="text-[10px] text-slate-400 mt-2 text-center">
                Shift + Enter para pular linha
              </p>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>

    <div className="space-y-6">
      <ClientActionShortcuts clienteId={id!} clienteUid={cliente?.user_id} />

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
      <form onSubmit={handleSubmit(handleUpdateClient)} className="space-y-4 py-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="edit-nome">Nome Completo</Label>
            <Input id="edit-nome" {...register('nome')} placeholder="Ex: João da Silva" />
            {errors.nome && <p className="text-xs text-red-500 font-medium">{errors.nome.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-email">E-mail</Label>
            <Input id="edit-email" type="email" {...register('email')} placeholder="exemplo@email.com" />
            {errors.email && <p className="text-xs text-red-500 font-medium">{errors.email.message}</p>}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="edit-telefone">Telefone</Label>
            <Input id="edit-telefone" {...register('telefone')} placeholder="(00) 00000-0000" />
            {errors.telefone && <p className="text-xs text-red-500 font-medium">{errors.telefone.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-status">Status</Label>
            <select 
              id="edit-status"
              className="w-full h-10 px-3 rounded-md border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
              {...register('status')}
            >
              <option value={ClienteStatus.ATIVO}>Ativo</option>
              <option value={ClienteStatus.INATIVO}>Inativo</option>
            </select>
            {errors.status && <p className="text-xs text-red-500 font-medium">{errors.status.message}</p>}
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
            {currentTags?.map((tag: string) => (
              <Badge key={tag} variant="secondary" className="gap-1 px-2 py-1">
                {tag}
                <button onClick={() => handleRemoveTag(tag)} type="button" className="text-slate-400 hover:text-slate-600">
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
        <DialogFooter className="pt-4">
          <Button variant="outline" type="button" onClick={() => setIsEditClientOpen(false)}>Cancelar</Button>
          <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isUpdating}>
            {isUpdating ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>

  {/* Hidden Dossier for Export */}
  <DossierExportWrapper userId={id || ''} mentorName={userData?.name} />
    </>
  );
}

function DossierExportWrapper({ userId, mentorName }: { userId: string, mentorName?: string }) {
  const { data } = useClientDossier(userId);
  if (!data) return null;
  
  return (
    <div className="hidden">
      <DossierContent 
        data={data}
        mentorName={mentorName}
        isPrintVersion={true}
      />
    </div>
  );
}
