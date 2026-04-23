import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Star, MessageSquareHeart, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { sendNotification } from '@/lib/notifications';

export function AvaliacaoCliente() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const mentorId = searchParams.get('mentorId');
  const sessaoId = searchParams.get('sessaoId');

  const [nota, setNota] = useState(0);
  const [hoverNota, setHoverNota] = useState(0);
  const [pontosPositivos, setPontosPositivos] = useState('');
  const [pontosMelhoria, setPontosMelhoria] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const mutation = useMutation({
    mutationFn: async (avaliacao: any) => {
      if (!user) throw new Error('Você precisa estar logado para avaliar.');
      if (!mentorId) throw new Error('ID do mentor não identificado.');

      const path = 'avaliacoes_sessoes';
      try {
        await addDoc(collection(db, path), {
          ...avaliacao,
          mentor_id: mentorId,
          cliente_id: user.uid,
          sessao_id: sessaoId || null,
          data: Timestamp.now()
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
      }
    },
    onSuccess: () => {
      setIsSubmitted(true);
      toast.success('Feedback enviado com sucesso!');

      if (mentorId && user) {
        sendNotification({
          userId: mentorId,
          title: 'Novo Feedback Recebido',
          message: `${user.displayName || user.email} enviou uma avaliação sobre a sessão.`,
          type: 'success',
          link: `/Admin/Resultados?userId=${user.uid}`
        });
      }
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao enviar avaliação.');
    }
  });

  const handleSave = () => {
    if (nota === 0) {
      toast.error('Por favor, selecione uma nota para a sessão.');
      return;
    }
    if (!mentorId) {
      toast.error('Link de avaliação inválido (mentorId ausente).');
      return;
    }
    mutation.mutate({
      nota,
      pontosPositivos,
      pontosMelhoria
    });
  };

  if (!mentorId) {
    return (
      <div className="p-6 md:p-8 max-w-2xl mx-auto text-center space-y-6 mt-12">
        <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle className="w-10 h-10" />
        </div>
        <h2 className="text-3xl font-bold text-slate-800">Link Inválido</h2>
        <p className="text-slate-600 text-lg">Este link de avaliação não contém as informações necessárias. Por favor, solicite um novo link ao seu mentor.</p>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="p-6 md:p-8 max-w-2xl mx-auto text-center space-y-6 mt-12">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
          <MessageSquareHeart className="w-10 h-10" />
        </div>
        <h2 className="text-3xl font-bold text-slate-800">Avaliação Enviada!</h2>
        <p className="text-slate-600 text-lg">Muito obrigado pelo seu feedback. Ele é essencial para continuarmos melhorando nosso processo.</p>
        <Button onClick={() => {
          setIsSubmitted(false);
          setNota(0);
          setPontosPositivos('');
          setPontosMelhoria('');
        }} variant="outline" className="mt-4">
          Enviar Nova Avaliação
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
          <MessageSquareHeart className="w-8 h-8 text-blue-600" />
          Avaliação da Sessão
        </h1>
        <p className="text-slate-500 mt-1">Deixe seu feedback sobre a última sessão de mentoring.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Formulário de Feedback</CardTitle>
          <CardDescription>Sua opinião nos ajuda a direcionar melhor os próximos encontros.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          
          <div className="space-y-4 text-center py-4">
            <Label className="text-lg font-medium">Como você avalia a sessão de hoje?</Label>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setNota(star)}
                  onMouseEnter={() => setHoverNota(star)}
                  onMouseLeave={() => setHoverNota(0)}
                  className="p-2 transition-transform hover:scale-110 focus:outline-none"
                >
                  <Star 
                    className={`w-10 h-10 ${
                      star <= (hoverNota || nota) 
                        ? 'fill-yellow-400 text-yellow-400' 
                        : 'text-slate-300'
                    } transition-colors`} 
                  />
                </button>
              ))}
            </div>
            <div className="text-sm font-medium text-slate-500 h-5">
              {nota === 1 && 'Ruim'}
              {nota === 2 && 'Regular'}
              {nota === 3 && 'Bom'}
              {nota === 4 && 'Muito Bom'}
              {nota === 5 && 'Excelente'}
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-base">O que foi mais valioso na sessão de hoje?</Label>
            <Textarea 
              className="min-h-[100px]" 
              placeholder="Descreva os pontos altos, insights ou aprendizados..."
              value={pontosPositivos}
              onChange={(e) => setPontosPositivos(e.target.value)}
            />
          </div>

          <div className="space-y-3">
            <Label className="text-base">O que poderia ser melhorado para as próximas sessões?</Label>
            <Textarea 
              className="min-h-[100px]" 
              placeholder="Sugestões, dúvidas não respondidas ou tópicos que gostaria de aprofundar..."
              value={pontosMelhoria}
              onChange={(e) => setPontosMelhoria(e.target.value)}
            />
          </div>

          <Button 
            onClick={handleSave} 
            className="w-full bg-blue-600 hover:bg-blue-700 text-lg h-12"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? 'Enviando...' : 'Enviar Avaliação'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
