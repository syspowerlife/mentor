import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  Timestamp 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Smile, Meh, Frown, BookOpen, Calendar as CalendarIcon, Lock, Globe } from 'lucide-react';
import { toast } from 'sonner';
import { formatDateOrTimestamp, safeFormat } from '@/lib/utils';

const sentimentos = [
  { id: 'feliz', icon: <Smile className="w-6 h-6" />, label: 'Feliz', color: 'text-green-500 bg-green-50 hover:bg-green-100 border-green-200' },
  { id: 'neutro', icon: <Meh className="w-6 h-6" />, label: 'Neutro', color: 'text-yellow-500 bg-yellow-50 hover:bg-yellow-100 border-yellow-200' },
  { id: 'triste', icon: <Frown className="w-6 h-6" />, label: 'Triste', color: 'text-red-500 bg-red-50 hover:bg-red-100 border-red-200' },
];

export function DiarioReflexao() {
  const { user } = useAuth();
  const [conteudo, setConteudo] = useState('');
  const [sentimento, setSentimento] = useState('feliz');
  const [isPrivate, setIsPrivate] = useState(true);
  const [reflexoes, setReflexoes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load entries in real-time
  useEffect(() => {
    if (!user) return;

    const path = 'diarios_reflexao';
    const q = query(
      collection(db, path),
      where('created_by', '==', user.uid),
      orderBy('data', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setReflexoes(data);
      setIsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const mutation = useMutation({
    mutationFn: async (novaReflexao: any) => {
      const path = 'diarios_reflexao';
      try {
        await addDoc(collection(db, path), {
          ...novaReflexao,
          created_by: user?.uid,
          created_at: Timestamp.now()
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, path);
      }
    },
    onSuccess: () => {
      setConteudo('');
      setSentimento('feliz');
      setIsPrivate(true);
      toast.success('Reflexão salva com sucesso!');
    },
    onError: (error: any) => toast.error(error.message || 'Erro ao salvar reflexão.')
  });

  const handleSave = () => {
    if (!conteudo.trim()) return toast.error('Escreva algo antes de salvar.');
    mutation.mutate({
      conteudo,
      sentimento,
      is_private: isPrivate,
      data: new Date().toISOString()
    });
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-blue-600" />
          Diário de Reflexão
        </h1>
        <p className="text-slate-500 mt-1">Registre seus pensamentos, aprendizados e sentimentos diários.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nova Reflexão</CardTitle>
          <CardDescription>Como você está se sentindo hoje?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex gap-4">
            {sentimentos.map((s) => (
              <button
                key={s.id}
                onClick={() => setSentimento(s.id)}
                className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all ${
                  sentimento === s.id ? s.color + ' border-current scale-105 shadow-sm' : 'border-slate-100 text-slate-400 hover:bg-slate-50'
                }`}
              >
                {s.icon}
                <span className="mt-2 text-sm font-medium">{s.label}</span>
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <Label>O que está em sua mente?</Label>
            <Textarea 
              className="min-h-[150px] resize-y" 
              placeholder="Escreva sobre suas conquistas, desafios ou pensamentos do dia..."
              value={conteudo}
              onChange={(e) => setConteudo(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
            <div className="space-y-0.5">
              <Label className="text-sm font-semibold flex items-center gap-2">
                {isPrivate ? <Lock className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                Privacidade
              </Label>
              <p className="text-xs text-slate-500">
                {isPrivate ? 'Apenas você pode ver este registro.' : 'Seu mentor poderá visualizar esta reflexão.'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-600">{isPrivate ? 'Privado' : 'Compartilhado'}</span>
              <Switch checked={!isPrivate} onCheckedChange={(val) => setIsPrivate(!val)} />
            </div>
          </div>

          <Button 
            onClick={handleSave} 
            className="w-full md:w-auto bg-blue-600 hover:bg-blue-700"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? 'Salvando...' : 'Salvar Reflexão'}
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Histórico</h2>
        
        {isLoading ? (
          <div className="text-center py-8 text-slate-500">Carregando histórico...</div>
        ) : reflexoes.length > 0 ? (
          <div className="space-y-4">
            {/* Ordenando do mais recente para o mais antigo */}
            {[...reflexoes].reverse().map((ref: any) => {
              const sent = sentimentos.find(s => s.id === ref.sentimento) || sentimentos[0];
              return (
                <Card key={ref.id} className="overflow-hidden">
                  <div className="flex flex-col md:flex-row">
                    <div className={`p-4 md:w-24 flex md:flex-col items-center justify-center gap-2 border-b md:border-b-0 md:border-r border-slate-100 ${sent.color.split(' ')[1]}`}>
                      {sent.icon}
                      <span className="text-xs font-medium uppercase tracking-wider">{sent.label}</span>
                    </div>
                    <div className="p-4 flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center text-xs text-slate-400">
                          <CalendarIcon className="w-3 h-3 mr-1" />
                          {safeFormat(ref.data, 'dd/MM/yyyy HH:mm')}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                          {ref.is_private ? (
                            <><Lock className="w-3 h-3" /> Privado</>
                          ) : (
                            <><Globe className="w-3 h-3 text-blue-400" /> Compartilhado</>
                          )}
                        </div>
                      </div>
                      <p className="text-slate-700 whitespace-pre-wrap">{ref.conteudo}</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
            <p className="text-slate-500">Nenhuma reflexão registrada ainda. Comece escrevendo acima!</p>
          </div>
        )}
      </div>
    </div>
  );
}
