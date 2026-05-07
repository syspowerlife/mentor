import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { collection, query, where, onSnapshot, addDoc, Timestamp, updateDoc, doc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Send, User, Mail, Clock, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR, enUS, es } from 'date-fns/locale';
import { toast } from 'sonner';
import { useMensagens } from '@/hooks/useMensagens';
import { useTranslation } from 'react-i18next';

export function PortalInbox() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [cliente, setCliente] = useState<any>(null);
  const [isClientLoading, setIsClientLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. Find client document
  useEffect(() => {
    if (!user) return;

    const qCliente = query(collection(db, 'clientes'), where('user_id', '==', user.uid));
    const unsubscribeCliente = onSnapshot(qCliente, (snapshot) => {
      if (!snapshot.empty) {
        const data = snapshot.docs[0].data();
        setCliente({ id: snapshot.docs[0].id, ...data });
      } else {
        setCliente(null);
      }
      setIsClientLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'clientes');
      setIsClientLoading(false);
    });

    return () => unsubscribeCliente();
  }, [user]);

  // 2. Use messages hook
  const { mensagens, isLoading: isLoadingMensagens } = useMensagens(cliente?.id);
  
  const isLoading = isClientLoading || isLoadingMensagens;

  // Mark as read and process messages
  useEffect(() => {
    if (!mensagens.length || !user) return;

    const lastMsg = mensagens[mensagens.length - 1];
    if (lastMsg && lastMsg.sender_id !== user.uid && !lastMsg.read) {
      mensagens.forEach(m => {
        if (m.sender_id !== user.uid && !m.read) {
           updateDoc(doc(db, 'mensagens', m.id), { read: true }).catch(() => {});
        }
      });
    }
  }, [mensagens, user]);

  const filteredMessages = mensagens.filter(m => 
    !searchTerm.trim() || m.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [filteredMessages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newMessage.trim() || !cliente || isSending) return;

    setIsSending(true);
    try {
      await addDoc(collection(db, 'mensagens'), {
        cliente_id: cliente.id,
        cliente_uid: user?.uid, // Mentee is the same as cliente_uid
        mentor_id: cliente.profissional_id, // Direct link to mentor
        sender_id: user?.uid,
        content: newMessage.trim(),
        created_at: Timestamp.now(),
        read: false
      });
      setNewMessage('');
    } catch (error: any) {
      toast.error(t('portal.messages.error_sending') + error.message);
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b px-4 h-16 flex items-center shrink-0 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/portal/dashboard')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white">
                <User className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-slate-900">{t('portal.messages.chat_title')}</h1>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold flex items-center gap-1">
                   <Clock className="w-3 h-3" /> {t('portal.messages.async')}
                </p>
              </div>
            </div>
          </div>
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder={t('portal.messages.search_placeholder')}
              className="pl-9 h-9 w-64 bg-slate-50 border-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <main className="flex-1 flex flex-col max-w-7xl mx-auto w-full overflow-hidden">
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6"
        >
          {filteredMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4 opacity-60">
              <Mail className="w-16 h-16 stroke-1" />
              <p className="text-sm italic">
                {searchTerm ? t('portal.messages.no_results') : t('portal.messages.start_chat')}
              </p>
            </div>
          ) : (
            filteredMessages.map((msg, index) => {
              const isMe = msg.sender_id === user?.uid;
              const date = msg.created_at?.toDate ? msg.created_at.toDate() : new Date();
              
              return (
                <div 
                  key={msg.id} 
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] md:max-w-[70%] space-y-1`}>
                     <div className={`px-4 py-3 rounded-2xl shadow-sm text-sm leading-relaxed ${
                       isMe ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                     }`}>
                       {msg.content}
                     </div>
                     <div className={`flex items-center gap-2 px-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <span className="text-[10px] text-slate-400">
                          {format(date, "HH:mm")}
                        </span>
                        {isMe && (
                           <span className={`text-[10px] ${msg.read ? 'text-blue-500 font-bold' : 'text-slate-300'}`}>
                              {msg.read ? t('portal.messages.read') : t('portal.messages.sent')}
                           </span>
                        )}
                     </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Input area */}
        <div className="p-4 bg-white border-t border-slate-200 sticky bottom-0">
          <form 
            onSubmit={handleSendMessage}
            className="max-w-4xl mx-auto flex gap-3"
          >
            <Input 
              placeholder={t('portal.messages.input_placeholder')}
              className="flex-1 h-12 bg-slate-50 border-none focus-visible:ring-blue-500"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              disabled={isSending}
            />
            <Button 
              type="submit"
              size="icon"
              className="w-12 h-12 bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-100"
              disabled={isSending || !newMessage.trim()}
            >
              <Send className="w-5 h-5" />
            </Button>
          </form>
          <p className="text-[10px] text-center text-slate-400 mt-3">
             {t('portal.messages.notification_info')}
          </p>
        </div>
      </main>
    </div>
  );
}
