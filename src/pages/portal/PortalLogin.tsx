import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { LogIn, UserPlus, ShieldCheck } from 'lucide-react';

export function PortalLogin() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Check if user is a client
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists() && userDoc.data().role === 'client') {
          toast.success('Bem-vindo ao seu Portal!');
          navigate('/portal/dashboard');
        } else if (userDoc.exists() && (userDoc.data().role === 'user' || userDoc.data().role === 'admin')) {
          toast.error('Esta conta é de um mentor. Use o login de mentor.');
          await auth.signOut();
        } else {
          // If user exists in Auth but not in users collection with role client, 
          // check if they are a linked client
          const q = query(collection(db, 'clientes'), where('email', '==', email), where('portal_enabled', '==', true));
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            const clienteDoc = querySnapshot.docs[0];
            // Create user doc and link
            await setDoc(doc(db, 'users', user.uid), {
              email: user.email,
              name: user.displayName || name,
              role: 'client',
              created_at: new Date().toISOString()
            });
            await updateDoc(doc(db, 'clientes', clienteDoc.id), {
              user_id: user.uid
            });
            toast.success('Portal ativado com sucesso!');
            navigate('/portal/dashboard');
          } else {
            toast.error('Acesso não autorizado. Entre em contato com seu mentor.');
            await auth.signOut();
          }
        }
      } else {
        // Sign Up
        // First check if email is allowed (has portal_enabled: true)
        const q = query(collection(db, 'clientes'), where('email', '==', email), where('portal_enabled', '==', true));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          throw new Error('Seu mentor ainda não ativou seu acesso ao portal.');
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        await updateProfile(user, { displayName: name });

        const clienteDoc = querySnapshot.docs[0];
        
        // Create user doc
        await setDoc(doc(db, 'users', user.uid), {
          email,
          name,
          role: 'client',
          created_at: new Date().toISOString()
        });

        // Link client doc
        await updateDoc(doc(db, 'clientes', clienteDoc.id), {
          user_id: user.uid
        });

        toast.success('Conta criada com sucesso!');
        navigate('/portal/dashboard');
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md shadow-xl border-t-4 border-t-blue-600">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <ShieldCheck className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Portal do Mentorado</CardTitle>
          <CardDescription>
            {isLogin 
              ? 'Acesse seu progresso e acompanhe suas metas' 
              : 'Crie sua conta para acessar o portal'}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleAuth}>
          <CardContent className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input 
                  id="name" 
                  placeholder="Seu nome" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required 
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="seu@email.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input 
                id="password" 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button className="w-full bg-blue-600 hover:bg-blue-700" type="submit" disabled={isLoading}>
              {isLoading ? (
                'Processando...'
              ) : (
                <>
                  {isLogin ? <LogIn className="w-4 h-4 mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
                  {isLogin ? 'Entrar no Portal' : 'Criar Conta'}
                </>
              )}
            </Button>
            <Button 
              variant="ghost" 
              className="w-full text-blue-600" 
              type="button"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Entre aqui'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
