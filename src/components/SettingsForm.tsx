import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { sendPasswordResetEmail, deleteUser } from 'firebase/auth';
import { db, auth, handleFirestoreError, OperationType } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { FileUpload } from '@/components/FileUpload';
import { toast } from 'sonner';
import { User, Bell, Shield, Palette, Camera, AlertTriangle, CreditCard, ExternalLink, Calendar } from 'lucide-react';
import { motion } from 'motion/react';
import { PricingSection } from './PricingSection';
import { AuditLogService } from '@/services/AuditLogService';
import { formatDateTime } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const settingsSchema = z.object({
  name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('Email inválido'),
  telefone: z.string(),
  profissao: z.string(),
  especialidade: z.string(),
  notification_preferences: z.object({
    sessions: z.boolean(),
    goals: z.boolean(),
    ai_tips: z.boolean(),
  }),
  tema_escuro: z.boolean(),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

interface SettingsFormProps {
  user: any;
}

export function SettingsForm({ user }: SettingsFormProps) {
  const queryClient = useQueryClient();
  const { user: authUser } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [calendarConnected, setCalendarConnected] = useState<boolean | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  React.useEffect(() => {
    if (authUser) {
      checkCalendarStatus();
      
      const handleOAuthMessage = (event: MessageEvent) => {
        if (event.data.type === 'OAUTH_AUTH_SUCCESS' && event.data.provider === 'google') {
          setCalendarConnected(true);
          toast.success('Google Calendar conectado com sucesso!');
          AuditLogService.logAction({
            action: 'CALENDAR_CONNECTED',
            details: 'Agenda do Google conectada com sucesso.'
          });
          queryClient.invalidateQueries({ queryKey: ['me'] });
        }
      };
      
      window.addEventListener('message', handleOAuthMessage);
      return () => window.removeEventListener('message', handleOAuthMessage);
    }
  }, [authUser]);

  const checkCalendarStatus = async () => {
    if (!authUser) return;
    try {
      const response = await fetch(`/api/calendar/status?userId=${authUser.uid}`);
      const data = await response.json();
      setCalendarConnected(data.connected);
      setLastSync(data.lastSync);
    } catch (error) {
      console.error('Error checking calendar status:', error);
    }
  };

  const handleConnectCalendar = async () => {
    try {
      const response = await fetch('/api/auth/google/url');
      const data = await response.json();
      if (data.url) {
        window.open(data.url, 'GoogleAuth', 'width=600,height=700');
      }
    } catch (error) {
      toast.error('Erro ao iniciar conexão com Google.');
    }
  };

  const handleDisconnectCalendar = async () => {
    if (!authUser) return;
    setIsDisconnecting(true);
    try {
      const response = await fetch('/api/calendar/disconnect', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: authUser.uid })
      });
      if (response.ok) {
        setCalendarConnected(false);
        toast.success('Google Calendar desconectado.');
        AuditLogService.logAction({
          action: 'CALENDAR_DISCONNECTED',
          details: 'Agenda do Google desconectada manualmente.'
        });
      } else {
        throw new Error('Falha ao desconectar');
      }
    } catch (error) {
      toast.error('Erro ao desconectar agenda.');
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleSyncCalendar = async () => {
    if (!authUser) return;
    setIsSyncing(true);
    try {
      const response = await fetch('/api/calendar/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: authUser.uid })
      });
      const data = await response.json();
      if (response.ok) {
        setLastSync(data.lastSync);
        toast.success(`Sincronização concluída: ${data.synced} eventos sincronizados.`);
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast.error(`Erro na sincronização: ${error.message}`);
    } finally {
      setIsSyncing(false);
    }
  };
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      telefone: user?.telefone || '',
      profissao: user?.profissao || '',
      especialidade: user?.especialidade || '',
      notification_preferences: {
        sessions: user?.notification_preferences?.sessions ?? true,
        goals: user?.notification_preferences?.goals ?? true,
        ai_tips: user?.notification_preferences?.ai_tips ?? true,
      },
      tema_escuro: user?.tema_escuro ?? false,
    }
  });

  const mutation = useMutation({
    mutationFn: async (data: SettingsFormData) => {
      if (!authUser) throw new Error('Usuário não autenticado');
      const userRef = doc(db, 'users', authUser.uid);
      await updateDoc(userRef, {
        ...data,
        updated_at: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      toast.success('Configurações salvas com sucesso!');
    },
    onError: (error: any) => {
      console.error('Error updating settings:', error);
      toast.error(error.message || 'Erro ao salvar configurações.');
    }
  });

  const handlePhotoUpload = async (metadata: { url: string }) => {
    if (!authUser) return;
    try {
      const userRef = doc(db, 'users', authUser.uid);
      await updateDoc(userRef, { photo_url: metadata.url });
      queryClient.invalidateQueries({ queryKey: ['me'] });
      toast.success('Foto de perfil atualizada!');
    } catch (error) {
      toast.error('Erro ao atualizar foto de perfil.');
    }
  };

  const onSubmit = (data: SettingsFormData) => {
    mutation.mutate(data);
  };

  const handlePasswordReset = async () => {
    if (!authUser?.email) {
      toast.error('Email não encontrado.');
      return;
    }
    
    setIsResettingPassword(true);
    try {
      await sendPasswordResetEmail(auth, authUser.email);
      toast.success(`Email de redefinição enviado para ${authUser.email}`);
    } catch (error: any) {
      console.error('Error resetting password:', error);
      toast.error(error.message || 'Erro ao enviar email de redefinição.');
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!authUser) return;
    
    setIsDeleting(true);
    try {
      // 1. Delete user document from Firestore
      const userRef = doc(db, 'users', authUser.uid);
      await deleteDoc(userRef);
      
      // 2. Delete user from Firebase Auth
      await deleteUser(authUser);
      
      toast.success('Conta excluída com sucesso.');
      // Redirect will happen automatically via AuthContext onAuthStateChanged
    } catch (error: any) {
      console.error('Error deleting account:', error);
      // If error is requires-recent-login, we should prompt them to re-authenticate
      if (error.code === 'auth/requires-recent-login') {
        toast.error('Para excluir sua conta, você precisa fazer login novamente por motivos de segurança. Por favor, saia e entre novamente.');
      } else {
        toast.error(error.message || 'Erro ao excluir conta.');
      }
      setIsDeleting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* Perfil */}
          <Card className="bg-white/60 backdrop-blur-sm shadow-sm border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                Informações do Perfil
              </CardTitle>
              <CardDescription>Atualize seus dados pessoais e profissionais.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col md:flex-row items-center gap-6 pb-6 border-b border-slate-100">
                <div className="relative group">
                  <Avatar className="w-24 h-24 border-4 border-white shadow-md">
                    <AvatarImage src={user?.photo_url} />
                    <AvatarFallback className="bg-blue-100 text-blue-600 text-2xl font-bold">
                      {user?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                </div>
                
                <div className="flex-1 space-y-3 w-full">
                  <Label className="text-sm font-bold text-slate-700">Foto de Perfil</Label>
                  <FileUpload 
                    folder="profiles" 
                    onUploadComplete={handlePhotoUpload}
                    allowedTypes={['image/jpeg', 'image/png']}
                    label="Alterar foto de perfil"
                    className="max-w-md"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input id="name" {...register('name')} />
                  {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" {...register('email')} disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input id="telefone" {...register('telefone')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profissao">Profissão</Label>
                  <Input id="profissao" {...register('profissao')} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="especialidade">Especialidade / Foco</Label>
                  <Input id="especialidade" {...register('especialidade')} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notificações */}
          <Card className="bg-white/60 backdrop-blur-sm shadow-sm border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-orange-500" />
                Preferências de Comunicação
              </CardTitle>
              <CardDescription>Gerencie quais tipos de notificação e e-mails você deseja receber.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                <div className="space-y-0.5">
                  <Label className="text-base text-slate-800">Lembretes de Sessão</Label>
                  <p className="text-sm text-slate-500">Alertas sobre sessões agendadas por e-mail e notificações internas.</p>
                </div>
                <Switch 
                  checked={watch('notification_preferences.sessions')} 
                  onCheckedChange={(checked) => setValue('notification_preferences.sessions', checked)} 
                />
              </div>
              
              <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                <div className="space-y-0.5">
                  <Label className="text-base text-slate-800">Status de Metas</Label>
                  <p className="text-sm text-slate-500">Receba e-mails sobre metas concluídas ou prazos que estão expirando.</p>
                </div>
                <Switch 
                  checked={watch('notification_preferences.goals')} 
                  onCheckedChange={(checked) => setValue('notification_preferences.goals', checked)} 
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                <div className="space-y-0.5">
                  <Label className="text-base text-slate-800">Informativos e Sugestões da IA</Label>
                  <p className="text-sm text-slate-500">Dicas personalizadas e insights gerados pela inteligência artificial.</p>
                </div>
                <Switch 
                  checked={watch('notification_preferences.ai_tips')} 
                  onCheckedChange={(checked) => setValue('notification_preferences.ai_tips', checked)} 
                />
              </div>
            </CardContent>
          </Card>

          {/* Integrações (Google Calendar) */}
          <Card className="bg-white/60 backdrop-blur-sm shadow-sm border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-500" />
                Integrações
              </CardTitle>
              <CardDescription>Conecte ferramentas externas para turbinar sua mentoria.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg" alt="Google Calendar" className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-700">Google Calendar</h4>
                    <p className="text-xs text-slate-500">Sincronize suas sessões automaticamente</p>
                    {lastSync && (
                      <p className="text-[10px] text-slate-400 mt-1 italic">
                        Última sincronização: {formatDateTime(new Date(lastSync))}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {calendarConnected === true ? (
                    <>
                      <Button size="sm" variant="outline" onClick={handleSyncCalendar} disabled={isSyncing} type="button">
                        {isSyncing ? 'Sincronizando...' : 'Sincronizar'}
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger render={<Button size="sm" variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50" type="button">Desconectar</Button>} />
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Desconectar Google Calendar?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Isso interromperá a sincronização automática de suas sessões de mentoria. Seus eventos já sincronizados permanecerão na agenda.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDisconnectCalendar} className="bg-red-600 hover:bg-red-700">
                              {isDisconnecting ? 'Desconectando...' : 'Sim, desconectar'}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>

                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none shadow-none">Conectado ✅</Badge>
                    </>
                  ) : calendarConnected === false ? (
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={handleConnectCalendar} type="button">
                      Conectar
                    </Button>
                  ) : (
                    <Badge variant="outline">Consultando...</Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Plano e Assinatura */}
          <Card className="bg-white/60 backdrop-blur-sm shadow-sm border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-600" />
                Plano e Assinatura
              </CardTitle>
              <CardDescription>Gerencie seu plano e pagamentos.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-slate-500">Plano Atual</span>
                  <Badge className="bg-blue-100 text-blue-700 capitalize">{user?.plan || 'free'}</Badge>
                </div>
                <p className="text-xs text-slate-500">
                  {user?.plan === 'master' ? 'Você tem acesso ilimitado a todos os recursos.' : 
                   user?.plan === 'pro' ? 'Você tem acesso a 50 clientes e todas as ferramentas.' : 
                   'Você está no plano gratuito com recursos limitados.'}
                </p>
              </div>

              <AlertDialog>
                <AlertDialogTrigger render={<Button variant="outline" className="w-full justify-between" type="button">Alterar Plano <ExternalLink className="w-4 h-4" /></Button>} />
                <AlertDialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Escolha seu novo plano</AlertDialogTitle>
                    <AlertDialogDescription>Selecione o plano que melhor atende suas necessidades atuais.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="py-6">
                    <PricingSection />
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Fechar</AlertDialogCancel>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>

          {/* Aparência */}
          <Card className="bg-white/60 backdrop-blur-sm shadow-sm border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-purple-500" />
                Aparência
              </CardTitle>
              <CardDescription>Personalize o visual da plataforma.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base">Modo Escuro</Label>
                <Switch 
                  checked={watch('tema_escuro')} 
                  onCheckedChange={(checked) => setValue('tema_escuro', checked)} 
                />
              </div>
              <p className="text-xs text-slate-500 italic">
                * O modo escuro é uma preferência visual que será aplicada em todo o sistema.
              </p>
            </CardContent>
          </Card>

          {/* Segurança */}
          <Card className="bg-white/60 backdrop-blur-sm shadow-sm border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-600" />
                Segurança
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                variant="outline" 
                className="w-full justify-start" 
                type="button"
                onClick={handlePasswordReset}
                disabled={isResettingPassword}
              >
                {isResettingPassword ? 'Enviando...' : 'Alterar Senha'}
              </Button>
              
              <AlertDialog>
                <AlertDialogTrigger render={<Button variant="outline" className="w-full justify-start text-red-600 hover:bg-red-50" type="button">Excluir Minha Conta</Button>} />
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                      <AlertTriangle className="w-5 h-5" />
                      Você tem certeza absoluta?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação não pode ser desfeita. Isso excluirá permanentemente sua conta
                      e removerá todos os seus dados de nossos servidores.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleDeleteAccount}
                      className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                      disabled={isDeleting}
                    >
                      {isDeleting ? 'Excluindo...' : 'Sim, excluir minha conta'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>

          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-lg" disabled={mutation.isPending}>
            {mutation.isPending ? 'Salvando...' : 'Salvar Todas as Alterações'}
          </Button>
        </div>
      </div>
    </form>
  );
}
