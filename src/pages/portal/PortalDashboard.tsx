import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Target, 
  Calendar, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  FileText,
  User,
  LogOut,
  ChevronRight,
  Mail,
  Send
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { auth } from '@/lib/firebase';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { addDoc, Timestamp } from 'firebase/firestore';

export function PortalDashboard() {
  const { user, userData } = useAuth();
  const navigate = useNavigate();
  const [cliente, setCliente] = useState<any>(null);
  const [metas, setMetas] = useState<any[]>([]);
  const [agendamentos, setAgendamentos] = useState<any[]>([]);
  const [mensagens, setMensagens] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Messaging State
  const [isMessageOpen, setIsMessageOpen] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  useEffect(() => {
    if (!user) return;

    const unsubscribes: (() => void)[] = [];

    const fetchClientData = async () => {
      try {
        // 1. Find the linked client document
        const q = query(collection(db, 'clientes'), where('user_id', '==', user.uid));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          setIsLoading(false);
          return;
        }

        const clienteDoc = querySnapshot.docs[0];
        const clienteData = { id: clienteDoc.id, ...clienteDoc.data() };
        setCliente(clienteData);

        // 2. Set up real-time listeners
        const metasQuery = query(
          collection(db, 'metas_smart'),
          where('cliente_id', '==', clienteDoc.id),
          orderBy('created_date', 'desc')
        );
        
        unsubscribes.push(onSnapshot(metasQuery, (snapshot) => {
          setMetas(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }));

        const agendamentosQuery = query(
          collection(db, 'agendamentos'),
          where('cliente_id', '==', clienteDoc.id),
          orderBy('data_inicio', 'asc'),
          limit(5)
        );

        unsubscribes.push(onSnapshot(agendamentosQuery, (snapshot) => {
          setAgendamentos(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }));

        const mensagensQuery = query(
          collection(db, 'mensagens'),
          where('cliente_id', '==', clienteDoc.id),
          orderBy('created_at', 'asc')
        );

        unsubscribes.push(onSnapshot(mensagensQuery, (snapshot) => {
          setMensagens(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }));

        setIsLoading(false);
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'portal_dashboard');
        setIsLoading(false);
      }
    };

    fetchClientData();

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [user]);

  const handleSendMessage = async () => {
    if (!cliente || !user || !newMessage.trim()) return;
    setIsSendingMessage(true);
    try {
      await addDoc(collection(db, 'mensagens'), {
        cliente_id: cliente.id,
        mentor_id: cliente.profissional_id,
        sender_id: user.uid,
        content: newMessage.trim(),
        created_at: Timestamp.now(),
        read: false
      });
      setNewMessage('');
      toast.success('Mensagem enviada ao seu mentor!');
      setIsMessageOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao enviar mensagem.');
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/portal/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!cliente) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="max-w-md text-center">
          <CardHeader>
            <CardTitle>Acesso não vinculado</CardTitle>
            <CardDescription>
              Não encontramos um perfil de mentorado vinculado a este e-mail.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleLogout} variant="outline" className="w-full">
              Sair e tentar outro e-mail
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const metasConcluidas = metas.filter(m => m.status === 'concluida').length;
  const progressoMetas = metas.length > 0 ? (metasConcluidas / metas.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-slate-800">PowerLife <span className="text-blue-600">Portal</span></span>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:block text-right">
              <p className="text-sm font-medium text-slate-900">{userData?.name || user?.displayName}</p>
              <p className="text-xs text-slate-500">Mentorado</p>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout} title="Sair">
              <LogOut className="w-5 h-5 text-slate-500" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white shadow-lg">
          <h1 className="text-3xl font-bold mb-2">Olá, {cliente.nome}! 👋</h1>
          <p className="text-blue-100 max-w-2xl">
            Bem-vindo ao seu portal de mentoria. Aqui você pode acompanhar seu progresso, visualizar suas metas e gerenciar seus agendamentos.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Metas SMART */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-blue-600" />
                    Suas Metas SMART
                  </CardTitle>
                  <CardDescription>Acompanhe o que você definiu com seu mentor</CardDescription>
                </div>
                <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                  {metasConcluidas}/{metas.length} Concluídas
                </Badge>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-medium">
                    <span>Progresso Geral</span>
                    <span>{Math.round(progressoMetas)}%</span>
                  </div>
                  <Progress value={progressoMetas} className="h-2" />
                </div>

                <div className="space-y-4">
                  {metas.length === 0 ? (
                    <p className="text-center py-8 text-slate-500 italic">Nenhuma meta cadastrada ainda.</p>
                  ) : (
                    metas.map((meta) => (
                      <div key={meta.id} className="flex items-start gap-4 p-4 rounded-xl border bg-white hover:border-blue-200 transition-colors">
                        <div className={`mt-1 p-2 rounded-full ${
                          meta.status === 'concluida' ? 'bg-green-100 text-green-600' : 
                          meta.status === 'em_andamento' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {meta.status === 'concluida' ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-slate-900">{meta.titulo}</h4>
                          <p className="text-sm text-slate-500 line-clamp-1">{meta.especifica}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
                              {meta.status.replace('_', ' ')}
                            </Badge>
                            {meta.prazo && (
                              <span className="text-xs text-slate-400 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {meta.prazo}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Outras Ferramentas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card 
                className="hover:border-blue-300 transition-all cursor-pointer group"
                onClick={() => navigate('/portal/avaliacoes')}
              >
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="p-3 bg-purple-100 rounded-xl text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">Avaliações</h4>
                    <p className="text-sm text-slate-500">Responda seus formulários</p>
                  </div>
                  <ChevronRight className="w-5 h-5 ml-auto text-slate-300 group-hover:text-blue-600" />
                </CardContent>
              </Card>
              <Card 
                className="hover:border-blue-300 transition-all cursor-pointer group"
                onClick={() => navigate('/portal/evolucao')}
              >
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="p-3 bg-orange-100 rounded-xl text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">Evolução</h4>
                    <p className="text-sm text-slate-500">Veja seus gráficos DISC e SWOT</p>
                  </div>
                  <ChevronRight className="w-5 h-5 ml-auto text-slate-300 group-hover:text-blue-600" />
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Próximas Sessões */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  Próximas Sessões
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {agendamentos.length === 0 ? (
                  <p className="text-center py-4 text-slate-500 text-sm">Nenhuma sessão agendada.</p>
                ) : (
                  agendamentos.map((agendamento) => (
                    <div key={agendamento.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-blue-600 uppercase">
                          {format(new Date(agendamento.data_inicio), "dd 'de' MMMM", { locale: ptBR })}
                        </span>
                        <Badge variant="outline" className="text-[10px]">
                          {format(new Date(agendamento.data_inicio), "HH:mm")}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium text-slate-800">{agendamento.titulo}</p>
                      <div className="h-px bg-slate-100 w-full mt-4" />
                    </div>
                  ))
                )}
                <Button variant="outline" className="w-full text-xs" onClick={() => navigate('/portal/agendamentos')}>
                  Ver todos os agendamentos
                </Button>
              </CardContent>
            </Card>

            {/* Mentor Info */}
            <Card className="bg-slate-900 text-white border-none">
              <CardContent className="p-6 text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-2">
                  <User className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-lg">Seu Mentor</h4>
                  <p className="text-slate-400 text-sm">Acompanhando sua jornada</p>
                </div>
                <Button 
                  className="w-full bg-white text-slate-900 hover:bg-slate-100 gap-2"
                  onClick={() => setIsMessageOpen(true)}
                >
                  <Mail className="w-4 h-4" />
                  Enviar Mensagem
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Messaging Dialog */}
      <Dialog open={isMessageOpen} onOpenChange={setIsMessageOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-600" />
              Falar com o Mentor
            </DialogTitle>
            <DialogDescription>
              Envie uma mensagem ou dúvida para seu mentor. Ele será notificado.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Chat History Preview */}
            <div className="max-h-[200px] overflow-y-auto space-y-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
              {mensagens.length > 0 ? (
                mensagens.slice(-5).map((msg) => (
                  <div key={msg.id} className={`flex flex-col ${msg.sender_id === user?.uid ? 'items-end' : 'items-start'}`}>
                    <div className={`px-3 py-1.5 rounded-lg text-xs max-w-[90%] ${
                      msg.sender_id === user?.uid ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-700'
                    }`}>
                      {msg.content}
                    </div>
                    <span className="text-[9px] text-slate-400 mt-0.5">
                      {msg.created_at?.toDate ? format(msg.created_at.toDate(), "HH:mm") : 'Agora'}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-center text-xs text-slate-400 py-4 italic">Nenhuma mensagem anterior.</p>
              )}
            </div>

            <div className="space-y-2">
              <Textarea 
                placeholder="Escreva sua mensagem aqui..." 
                className="min-h-[120px] resize-none"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMessageOpen(false)}>Cancelar</Button>
            <Button 
              onClick={handleSendMessage} 
              disabled={isSendingMessage || !newMessage.trim()}
              className="bg-blue-600 hover:bg-blue-700 gap-2"
            >
              <Send className="w-4 h-4" />
              {isSendingMessage ? 'Enviando...' : 'Enviar Mensagem'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
