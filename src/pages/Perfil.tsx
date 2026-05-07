import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { doc, updateDoc } from 'firebase/firestore';
import { db, logout } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Mail, Briefcase, Phone, Award, LogOut, Camera, Loader2, CreditCard, ExternalLink, Zap } from 'lucide-react';
import { FileUpload } from '@/components/FileUpload';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { UserRole } from '@/types/enums';
import { Badge } from '@/components/ui/badge';

export function Perfil() {
  const { user, userData, loading: authLoading } = useAuth();
  const [profissao, setProfissao] = useState('');
  const [especialidade, setEspecialidade] = useState('');
  const [telefone, setTelefone] = useState('');
  const [isPhotoDialogOpen, setIsPhotoDialogOpen] = useState(false);

  // Subscription plan info
  const planInfo = {
    name: userData?.plan === 'master' ? 'Master' : (userData?.plan === 'pro' ? 'Profissional' : 'Gratuito'),
    status: userData?.subscriptionStatus === 'active' ? 'Ativa' : (userData?.subscriptionStatus === 'paused' ? 'Pausada' : 'Inativa'),
    color: userData?.plan === 'master' ? 'indigo' : (userData?.plan === 'pro' ? 'blue' : 'slate')
  };

  useEffect(() => {
    if (userData) {
      setProfissao(userData.profissao || '');
      setEspecialidade(userData.especialidade || '');
      setTelefone(userData.telefone || '');
    }
  }, [userData]);

  const mutation = useMutation({
    mutationFn: async (dados: any) => {
      if (!user) return;
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, dados);
    },
    onSuccess: () => {
      toast.success('Perfil atualizado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao atualizar perfil.');
    }
  });

  const handleSave = () => {
    mutation.mutate({ profissao, especialidade, telefone });
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = '/';
  };

  const onPhotoUploadComplete = async (metadata: { url: string }) => {
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { photo_url: metadata.url });
      setIsPhotoDialogOpen(false);
      toast.success('Foto de perfil atualizada!');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao atualizar foto de perfil.');
    }
  };

  if (authLoading) return <div className="p-8 text-center flex items-center justify-center h-[60vh]"><Loader2 className="animate-spin mr-2" /> Carregando...</div>;
  if (!user) return <div className="p-8 text-center">Usuário não autenticado.</div>;

  const userDisplayName = userData?.name || user.displayName || user.email;
  const userInitials = userDisplayName?.charAt(0).toUpperCase() || 'U';

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-slate-800">Meu Perfil</h1>

      <Card className="bg-white/60 backdrop-blur-sm shadow-sm overflow-hidden border-t-4 border-t-blue-600">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 flex flex-col sm:flex-row items-center gap-6 border-b border-slate-100">
          <div className="relative group">
            <Avatar className="w-24 h-24 border-4 border-white shadow-md">
              <AvatarImage src={userData?.photo_url || user.photoURL || ''} />
              <AvatarFallback className="bg-blue-600 text-white text-3xl font-bold">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            
            <Dialog open={isPhotoDialogOpen} onOpenChange={setIsPhotoDialogOpen}>
              <DialogTrigger asChild>
                <button className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-lg border border-slate-100 text-slate-600 hover:text-blue-600 transition-colors">
                  <Camera className="w-4 h-4" />
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Alterar Foto de Perfil</DialogTitle>
                </DialogHeader>
                <FileUpload 
                  folder={`users/${user.uid}/profile`}
                  allowedTypes={['image/jpeg', 'image/png', 'image/webp']}
                  onUploadComplete={onPhotoUploadComplete}
                  label="Selecione sua nova foto de perfil"
                />
              </DialogContent>
            </Dialog>
          </div>

          <div className="text-center sm:text-left flex-1">
            <h2 className="text-2xl font-bold text-slate-800">{userDisplayName}</h2>
            <div className="flex items-center justify-center sm:justify-start gap-2 text-slate-500 mt-1">
              <Mail className="w-4 h-4" />
              <span>{user.email}</span>
            </div>
            <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
              {userData?.role === UserRole.ADMIN ? 'Administrador' : 'Usuário'}
            </div>
          </div>
        </div>
        
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-slate-600"><Briefcase className="w-4 h-4" /> Profissão</Label>
              <Input value={profissao} onChange={e => setProfissao(e.target.value)} placeholder="Ex: Coach, Terapeuta..." />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-slate-600"><Award className="w-4 h-4" /> Especialidade</Label>
              <Input value={especialidade} onChange={e => setEspecialidade(e.target.value)} placeholder="Ex: Carreira, Relacionamentos..." />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label className="flex items-center gap-2 text-slate-600"><Phone className="w-4 h-4" /> Telefone</Label>
              <Input value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="(00) 00000-0000" />
            </div>
          </div>

          <div className="pt-4 flex justify-between items-center border-t border-slate-100">
            <Button variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Sair da Conta
            </Button>
            <Button onClick={handleSave} disabled={mutation.isPending}>
              {mutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-600" />
            Gestão da Assinatura
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50">
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Plano Atual</p>
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                {planInfo.name}
                {userData?.plan !== 'free' && (
                  <Badge variant="outline" className={`bg-${planInfo.color}-50 text-${planInfo.color}-600 border-${planInfo.color}-100`}>
                    {planInfo.status}
                  </Badge>
                )}
              </h3>
            </div>
            {userData?.plan === 'free' ? (
              <Button size="sm" onClick={() => window.location.href = '/Precos'} className="bg-blue-600 hover:bg-blue-700">
                <Zap className="w-4 h-4 mr-2 fill-current" />
                Fazer Upgrade
              </Button>
            ) : (
              <Button size="sm" variant="outline" className="text-blue-600 hover:bg-blue-50 border-blue-200" onClick={() => window.open('https://www.mercadopago.com.br/subscriptions', '_blank')}>
                Gerenciar no Mercado Pago
                <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
          
          {userData?.plan !== 'free' && (
            <p className="text-xs text-slate-500 px-2">
              Sua assinatura é processada de forma segura pelo Mercado Pago. Você pode gerenciar cobranças, alterar cartões ou cancelar a renovação automática a qualquer momento.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
