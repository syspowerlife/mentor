import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, query, where, getDocs, orderBy, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Mail, MessageCircle, FileText, ExternalLink, Loader2, Edit2, Save, Trash2, Plus, Activity, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { toast } from 'sonner';

export function Suporte() {
  const queryClient = useQueryClient();
  const { isAdmin } = useAuth();
  const [isEditingHeader, setIsEditingHeader] = useState(false);
  const [isEditingCards, setIsEditingCards] = useState(false);
  
  const { data: supportConfig, isLoading: isLoadingConfig } = useQuery({
    queryKey: ['support-config'],
    queryFn: async () => {
      const docRef = doc(db, 'settings', 'support');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data();
      }
      return null;
    }
  });

  const mutationUpdateConfig = useMutation({
    mutationFn: async (newData: any) => {
      const docRef = doc(db, 'settings', 'support');
      const cleanData = JSON.parse(JSON.stringify(newData));
      await setDoc(docRef, cleanData, { merge: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-config'] });
      toast.success('Conteúdo atualizado com sucesso!');
      setIsEditingHeader(false);
      setIsEditingCards(false);
    },
    onError: (error: any) => {
      console.error("Save error:", error);
      toast.error(`Erro ao atualizar: ${error.message || 'Erro desconhecido'}`);
    }
  });

  // Sync drafts when config loads
  React.useEffect(() => {
    if (supportConfig) {
      if (supportConfig.header) setHeaderDraft(supportConfig.header);
      if (supportConfig.contactCards) setCardsDraft(supportConfig.contactCards);
    }
  }, [supportConfig]);

  const { data: faqs, isLoading: isLoadingFaqs } = useQuery({
    queryKey: ['faqs-public'],
    queryFn: async () => {
      const faqsRef = collection(db, 'faqs');
      const q = query(faqsRef, where('active', '==', true), orderBy('order', 'asc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    }
  });

  const header = supportConfig?.header || {
    title: "Como podemos ajudar?",
    description: "Encontre respostas rápidas para suas dúvidas ou entre em contato com nossa equipe de suporte."
  };

  const contactCards = supportConfig?.contactCards || [
    {
      id: "email",
      icon: "Mail",
      title: "Email",
      description: "Respondemos em até 24h úteis.",
      link: "mailto:suporte@powerlife.com",
      linkText: "suporte@powerlife.com",
      color: "blue"
    },
    {
      id: "whatsapp",
      icon: "MessageCircle",
      title: "WhatsApp",
      description: "Atendimento em horário comercial.",
      link: "https://wa.me/5511999999999",
      linkText: "(11) 99999-9999",
      color: "green"
    },
    {
      id: "manuais",
      icon: "FileText",
      title: "Manuais",
      description: "Guias detalhados das ferramentas.",
      link: "/ajuda/manuais",
      linkText: "Acessar Guias",
      color: "purple"
    }
  ];

  const [headerDraft, setHeaderDraft] = useState(header);
  const [cardsDraft, setCardsDraft] = useState(contactCards);

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'Mail': return <Mail className="w-6 h-6" />;
      case 'MessageCircle': return <MessageCircle className="w-6 h-6" />;
      case 'FileText': return <FileText className="w-6 h-6" />;
      case 'Activity': return <Activity className="w-6 h-6" />;
      case 'ExternalLink': return <ExternalLink className="w-6 h-6" />;
      case 'ShieldAlert': return <ShieldAlert className="w-6 h-6" />;
      default: return <Mail className="w-6 h-6" />;
    }
  };

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue': return 'bg-blue-100 text-blue-600 border-blue-200';
      case 'green': return 'bg-green-100 text-green-600 border-green-200';
      case 'purple': return 'bg-purple-100 text-purple-600 border-purple-200';
      case 'orange': return 'bg-orange-100 text-orange-600 border-orange-200';
      case 'red': return 'bg-red-100 text-red-600 border-red-200';
      default: return 'bg-blue-100 text-blue-600 border-blue-200';
    }
  };

  if (isLoadingConfig) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8 relative">
      <div className="text-center space-y-4 mb-12 relative group">
        <h1 className="text-3xl font-bold text-slate-800">{header.title}</h1>
        <p className="text-slate-500 max-w-2xl mx-auto">
          {header.description}
        </p>
        {isAdmin && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => {
              setHeaderDraft(header);
              setIsEditingHeader(true);
            }}
          >
            <Edit2 className="w-4 h-4" />
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative group">
        {contactCards.map((card: any, index: number) => (
          <Card key={card.id || index} className="bg-white/60 backdrop-blur-sm shadow-sm text-center hover:shadow-md transition-shadow">
            <CardContent className="p-6 space-y-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto ${getColorClasses(card.color)}`}>
                {renderIcon(card.icon)}
              </div>
              <h3 className="font-bold text-lg">{card.title}</h3>
              <p className="text-sm text-slate-500">{card.description}</p>
              {card.link.startsWith('http') || card.link.startsWith('mailto') ? (
                <a 
                  href={card.link} 
                  target={card.link.startsWith('http') ? "_blank" : undefined}
                  rel={card.link.startsWith('http') ? "noopener noreferrer" : undefined}
                  className="text-blue-600 font-medium hover:underline block truncate"
                >
                  {card.linkText}
                </a>
              ) : (
                <Link 
                  to={card.link}
                  className="text-blue-600 font-medium hover:underline flex items-center justify-center gap-1"
                >
                  {card.linkText} <ExternalLink className="w-3 h-3" />
                </Link>
              )}
            </CardContent>
          </Card>
        ))}
        {isAdmin && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => {
              setCardsDraft(contactCards);
              setIsEditingCards(true);
            }}
          >
            <Edit2 className="w-4 h-4" />
          </Button>
        )}
      </div>

      <Card className="bg-white/60 backdrop-blur-sm shadow-sm mt-12">
        <CardHeader>
          <CardTitle>Perguntas Frequentes (FAQ)</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingFaqs ? (
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

      {/* Modais de Edição para Admin */}
      <Dialog open={isEditingHeader} onOpenChange={setIsEditingHeader}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Cabeçalho</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Título</Label>
              <Input value={headerDraft.title} onChange={e => setHeaderDraft({...headerDraft, title: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <textarea 
                className="w-full min-h-[100px] p-3 rounded-md border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={headerDraft.description} 
                onChange={e => setHeaderDraft({...headerDraft, description: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditingHeader(false)}>Cancelar</Button>
            <Button 
              onClick={() => mutationUpdateConfig.mutate({ header: headerDraft })} 
              disabled={mutationUpdateConfig.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {mutationUpdateConfig.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditingCards} onOpenChange={setIsEditingCards}>
        <DialogContent className="max-w-3xl overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Editar Canais de Contato</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4 pr-2">
            {cardsDraft.map((card: any, index: number) => (
              <div key={card.id || index} className="p-4 border rounded-xl space-y-4 bg-slate-50 relative group">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute top-2 right-2 text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => {
                    const newCards = [...cardsDraft];
                    newCards.splice(index, 1);
                    setCardsDraft(newCards);
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Título</Label>
                    <Input value={card.title} onChange={e => {
                      const newCards = [...cardsDraft];
                      newCards[index].title = e.target.value;
                      setCardsDraft(newCards);
                    }} />
                  </div>
                  <div className="space-y-2">
                    <Label>Ícone</Label>
                    <select 
                      className="w-full p-2 rounded-md border border-slate-200 text-sm"
                      value={card.icon}
                      onChange={e => {
                        const newCards = [...cardsDraft];
                        newCards[index].icon = e.target.value;
                        setCardsDraft(newCards);
                      }}
                    >
                      <option value="Mail">Email (Mail)</option>
                      <option value="MessageCircle">WhatsApp (MessageCircle)</option>
                      <option value="FileText">Manuais (FileText)</option>
                      <option value="Activity">Atividade (Activity)</option>
                      <option value="ExternalLink">Link Externo</option>
                      <option value="ShieldAlert">Escudo/Segurança</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Texto do Link</Label>
                    <Input value={card.linkText} onChange={e => {
                      const newCards = [...cardsDraft];
                      newCards[index].linkText = e.target.value;
                      setCardsDraft(newCards);
                    }} />
                  </div>
                  <div className="space-y-2">
                    <Label>Cor</Label>
                    <select 
                      className="w-full p-2 rounded-md border border-slate-200 text-sm"
                      value={card.color}
                      onChange={e => {
                        const newCards = [...cardsDraft];
                        newCards[index].color = e.target.value;
                        setCardsDraft(newCards);
                      }}
                    >
                      <option value="blue">Azul</option>
                      <option value="green">Verde</option>
                      <option value="purple">Roxo</option>
                      <option value="orange">Laranja</option>
                      <option value="red">Vermelho</option>
                    </select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Descrição</Label>
                    <Input value={card.description} onChange={e => {
                      const newCards = [...cardsDraft];
                      newCards[index].description = e.target.value;
                      setCardsDraft(newCards);
                    }} />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Link (URL/mailto:/rota)</Label>
                    <Input value={card.link} onChange={e => {
                      const newCards = [...cardsDraft];
                      newCards[index].link = e.target.value;
                      setCardsDraft(newCards);
                    }} />
                  </div>
                </div>
              </div>
            ))}
            <Button 
              variant="outline" 
              className="w-full border-dashed"
              onClick={() => {
                setCardsDraft([...cardsDraft, { id: `card-${Date.now()}`, title: "Novo Canal", description: "Descrição aqui", link: "#", linkText: "Clique aqui", color: "blue", icon: "Mail" }]);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Novo Card
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditingCards(false)}>Cancelar</Button>
            <Button 
              onClick={() => mutationUpdateConfig.mutate({ contactCards: cardsDraft })} 
              disabled={mutationUpdateConfig.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {mutationUpdateConfig.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Salvar Canais
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

