import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Mail, MessageCircle, FileText, ExternalLink, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function Suporte() {
  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, message: string) => {
    e.preventDefault();
    toast.info(message);
  };

  const { data: faqs, isLoading } = useQuery({
    queryKey: ['faqs-public'],
    queryFn: async () => {
      const faqsRef = collection(db, 'faqs');
      const q = query(faqsRef, where('active', '==', true), orderBy('order', 'asc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    }
  });

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-4 mb-12">
        <h1 className="text-3xl font-bold text-slate-800">Como podemos ajudar?</h1>
        <p className="text-slate-500 max-w-2xl mx-auto">
          Encontre respostas rápidas para suas dúvidas ou entre em contato com nossa equipe de suporte.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white/60 backdrop-blur-sm shadow-sm text-center hover:shadow-md transition-shadow">
          <CardContent className="p-6 space-y-4">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto">
              <Mail className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg">Email</h3>
            <p className="text-sm text-slate-500">Respondemos em até 24h úteis.</p>
            <a href="mailto:suporte@powerlife.com" className="text-blue-600 font-medium hover:underline block">suporte@powerlife.com</a>
          </CardContent>
        </Card>

        <Card className="bg-white/60 backdrop-blur-sm shadow-sm text-center hover:shadow-md transition-shadow">
          <CardContent className="p-6 space-y-4">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
              <MessageCircle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg">WhatsApp</h3>
            <p className="text-sm text-slate-500">Atendimento em horário comercial.</p>
            <a 
              href="https://wa.me/5511999999999" 
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-600 font-medium hover:underline block"
            >
              (11) 99999-9999
            </a>
          </CardContent>
        </Card>

        <Card className="bg-white/60 backdrop-blur-sm shadow-sm text-center hover:shadow-md transition-shadow">
          <CardContent className="p-6 space-y-4">
            <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg">Manuais</h3>
            <p className="text-sm text-slate-500">Guias detalhados das ferramentas.</p>
            <Link 
              to="/ajuda/manuais"
              className="text-purple-600 font-medium hover:underline flex items-center justify-center gap-1"
            >
              Acessar Guias <ExternalLink className="w-3 h-3" />
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white/60 backdrop-blur-sm shadow-sm mt-12">
        <CardHeader>
          <CardTitle>Perguntas Frequentes (FAQ)</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {faqs?.length === 0 ? (
                <p className="text-center text-slate-500 py-4">Nenhuma pergunta frequente disponível no momento.</p>
              ) : (
                faqs?.map((faq: any) => (
                  <AccordionItem key={faq.id} value={faq.id}>
                    <AccordionTrigger>{faq.question}</AccordionTrigger>
                    <AccordionContent className="text-slate-600 whitespace-pre-wrap">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))
              )}
            </Accordion>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
