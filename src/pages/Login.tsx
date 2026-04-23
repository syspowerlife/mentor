import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginWithEmail, loginWithGoogle, resetPassword } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { LogIn, Mail, Lock, ArrowLeft } from 'lucide-react';
import { sendNotification } from '@/lib/notifications';

const logoUrl = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68f695b8ca770d93e4eed7a4/6336fe853_POWERLIFE-app-small.png';

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return toast.error('Preencha todos os campos');
    
    setLoading(true);
    try {
      await loginWithEmail(email, password);
      toast.success('Bem-vindo de volta!');
      navigate('/Dashboard');
    } catch (error: any) {
      console.error(error);
      let message = 'Erro ao entrar. Verifique suas credenciais.';
      if (error.code === 'auth/user-not-found') message = 'Usuário não encontrado.';
      if (error.code === 'auth/wrong-password') message = 'Senha incorreta.';
      if (error.code === 'auth/invalid-email') message = 'E-mail inválido.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) return toast.error('Digite seu e-mail para recuperar a senha.');
    
    try {
      await resetPassword(email);
      toast.success('E-mail de recuperação enviado!');
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Erro ao enviar e-mail de recuperação.');
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const { user, isNewUser } = await loginWithGoogle();
      
      if (isNewUser && user) {
        await sendNotification({
          userId: user.uid,
          title: 'Bem-vindo ao PowerLife!',
          message: `Olá ${user.displayName || 'usuário'}, estamos felizes em ter você conosco. Comece cadastrando seu primeiro cliente!`,
          type: 'success'
        });
      }

      toast.success('Login realizado com sucesso!');
      navigate('/Dashboard');
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Erro ao entrar com Google.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans">
      <Link to="/" className="absolute top-8 left-8 flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors font-medium">
        <ArrowLeft className="w-4 h-4" /> Voltar para o início
      </Link>

      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <img src={logoUrl} alt="PowerLife" className="h-12 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-slate-900">Entrar na sua conta</h1>
          <p className="text-slate-600 mt-2">Acesse suas ferramentas e acompanhe seus clientes.</p>
        </div>

        <Card className="border-slate-200 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl font-bold">Login</CardTitle>
            <CardDescription>Escolha seu método de acesso preferido</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="seu@email.com" 
                    className="pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Senha</Label>
                  <button 
                    type="button" 
                    onClick={handleForgotPassword}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Esqueceu a senha?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="••••••••" 
                    className="pl-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
                {loading ? 'Entrando...' : 'Entrar com E-mail'}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-500">Ou continue com</span>
              </div>
            </div>

            <Button variant="outline" className="w-full border-slate-200 hover:bg-slate-50" onClick={handleGoogleLogin} disabled={loading}>
              <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
              </svg>
              Google
            </Button>
          </CardContent>
          <CardFooter className="flex flex-wrap items-center justify-center gap-1 text-sm text-slate-600">
            Não tem uma conta? 
            <Link to="/register" className="text-blue-600 font-bold hover:underline">Cadastre-se agora</Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
