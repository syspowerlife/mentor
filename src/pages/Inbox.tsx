import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { collection, query, where, orderBy, onSnapshot, addDoc, Timestamp, updateDoc, doc, limit } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Send, 
  User, 
  Mail, 
  Clock, 
  MessageSquare, 
  MoreVertical, 
  CheckCircle2,
  Filter,
  UserCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface Message {
  id: string;
  cliente_id: string;
  cliente_uid?: string;
  mentor_id: string;
  sender_id: string;
  content: string;
  created_at: any;
  read: boolean;
}

export function Inbox() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [chatSearchTerm, setChatSearchTerm] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. Fetch all clients to build conversation list
  useEffect(() => {
    if (!user) return;

    const qClients = query(
      collection(db, 'clientes'),
      where('profissional_id', '==', user.uid)
    );

    const unsubscribeClients = onSnapshot(qClients, (snapshot) => {
      const clients = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // For each client, we want to know the last message and if there are unread ones
      // This could be expensive if done with individual listeners, but for a MVP we'll do it.
      // A better way would be a "Conversations" collection, but we'll stick to the current schema.
      setConversations(clients.map(c => ({ 
        ...c, 
        lastMsg: '...', 
        unreadCount: 0,
        lastTimestamp: null
      })));
      setIsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'clientes');
      setIsLoading(false);
    });

    return () => unsubscribeClients();
  }, [user]);

  // 2. Listen to messages for all conversations (to update last message/unread count in sidebar)
  useEffect(() => {
    if (!user || conversations.length === 0) return;

    // We can't easily listen to "all messages for multiple client_ids" in one simple query without "IN" clause 
    // and Firebase has limits on "IN". For now, since it's a mentor dashboard, 
    // we'll listen to ALL messages where mentor_id == user.uid.
    const qAllMessages = query(
      collection(db, 'mensagens'),
      where('mentor_id', '==', user.uid),
      orderBy('created_at', 'desc')
    );

    const unsubscribeAll = onSnapshot(qAllMessages, (snapshot) => {
      const allMsgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Message[];
      
      setConversations(prev => prev.map(conv => {
        const convMsgs = allMsgs.filter(m => m.cliente_id === conv.id);
        const last = convMsgs[0];
        const unread = convMsgs.filter(m => m.sender_id !== user.uid && !m.read).length;
        
        return {
          ...conv,
          lastMsg: last?.content || 'Inicie uma conversa',
          unreadCount: unread,
          lastTimestamp: last?.created_at
        };
      }).sort((a, b) => {
        const timeA = a.lastTimestamp?.toDate ? a.lastTimestamp.toDate().getTime() : 0;
        const timeB = b.lastTimestamp?.toDate ? b.lastTimestamp.toDate().getTime() : 0;
        return timeB - timeA;
      }));
    });

    return () => unsubscribeAll();
  }, [user, conversations.length]);

  // 3. Listen to messages for the active chat
  useEffect(() => {
    if (!activeChat) {
      setMessages([]);
      return;
    }

    const qChat = query(
      collection(db, 'mensagens'),
      where('cliente_id', '==', activeChat.id),
      orderBy('created_at', 'asc')
    );

    const unsubscribeChat = onSnapshot(qChat, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Message[];
      setMessages(msgs);

      // Mark as read
      msgs.forEach(m => {
        if (m.sender_id !== user?.uid && !m.read) {
          updateDoc(doc(db, 'mensagens', m.id), { read: true }).catch(() => {});
        }
      });
    });

    return () => unsubscribeChat();
  }, [activeChat, user?.uid]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, activeChat]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newMessage.trim() || !activeChat || !user || isSending) return;

    setIsSending(true);
    try {
      await addDoc(collection(db, 'mensagens'), {
        cliente_id: activeChat.id,
        cliente_uid: activeChat.user_id,
        mentor_id: user.uid,
        sender_id: user.uid,
        content: newMessage.trim(),
        created_at: Timestamp.now(),
        read: false
      });
      setNewMessage('');
    } catch (error: any) {
      toast.error('Erro ao enviar: ' + error.message);
    } finally {
      setIsSending(false);
    }
  };

  const filteredConversations = conversations.filter(c => 
    c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.lastMsg.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredMessages = messages.filter(m => 
     m.content.toLowerCase().includes(chatSearchTerm.toLowerCase())
  );

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500">Carregando mensagens...</div>;
  }

  return (
    <div className="h-[calc(100vh-100px)] flex bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200">
      {/* Sidebar - Conversation List */}
      <div className="w-full md:w-80 border-r border-slate-100 flex flex-col bg-slate-50/50">
        <div className="p-4 border-b bg-white">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            Mensagens
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Buscar pessoas..." 
              className="pl-9 h-9 bg-slate-50 border-none text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-slate-400 space-y-2">
               <UserCircle className="w-8 h-8 mx-auto opacity-20" />
               <p className="text-xs">Nenhum cliente encontrado.</p>
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <div 
                key={conv.id}
                onClick={() => setActiveChat(conv)}
                className={`p-4 flex items-center gap-3 cursor-pointer transition-colors border-b border-slate-50 group hover:bg-white ${
                  activeChat?.id === conv.id ? 'bg-white border-l-4 border-l-blue-600' : ''
                }`}
              >
                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg">
                    {conv.nome.charAt(0).toUpperCase()}
                  </div>
                  {conv.unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-slate-50 font-bold">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-0.5">
                    <h3 className="text-sm font-bold text-slate-800 truncate">{conv.nome}</h3>
                    {conv.lastTimestamp && (
                       <span className="text-[10px] text-slate-400">
                          {format(conv.lastTimestamp.toDate(), "HH:mm")}
                       </span>
                    )}
                  </div>
                  <p className={`text-xs truncate ${conv.unreadCount > 0 ? 'text-slate-900 font-semibold' : 'text-slate-500'}`}>
                    {conv.lastMsg}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Content - Chat Window */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        {activeChat ? (
          <>
            {/* Chat Header */}
            <div className="h-16 px-6 border-b flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  {activeChat.nome.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{activeChat.nome}</h3>
                  <div className="flex items-center gap-2">
                     <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                     <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Cliente Ativo</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative hidden lg:block">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                  <Input 
                    placeholder="Buscar no chat..." 
                    className="pl-8 h-8 w-48 text-xs bg-slate-50 border-none"
                    value={chatSearchTerm}
                    onChange={(e) => setChatSearchTerm(e.target.value)}
                  />
                </div>
                <Button variant="ghost" size="icon" className="text-slate-400">
                  <MoreVertical className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Chat Body */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/30"
            >
              {filteredMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm italic">
                  {chatSearchTerm ? 'Nenhuma mensagem encontrada.' : 'Inicie a conversa com seu mentorado.'}
                </div>
              ) : (
                filteredMessages.map((msg) => {
                  const isMe = msg.sender_id === user?.uid;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] space-y-1`}>
                        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                          isMe ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                        }`}>
                          {msg.content}
                        </div>
                        <div className={`flex items-center gap-2 px-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <span className="text-[9px] text-slate-400">
                            {msg.created_at?.toDate ? format(msg.created_at.toDate(), "HH:mm") : 'Agora'}
                          </span>
                          {isMe && (
                             <CheckCircle2 className={`w-3 h-3 ${msg.read ? 'text-blue-500' : 'text-slate-200'}`} />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t">
              <form onSubmit={handleSendMessage} className="flex gap-3">
                <Input 
                  placeholder="Escreva uma mensagem..." 
                  className="flex-1 h-11 bg-slate-50 border-none"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  disabled={isSending}
                />
                <Button 
                   type="submit" 
                   className="h-11 bg-blue-600 hover:bg-blue-700 px-6 gap-2"
                   disabled={isSending || !newMessage.trim()}
                >
                   <Send className="w-4 h-4" />
                   {isSending ? '...' : 'Enviar'}
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center space-y-4">
             <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center">
                <Mail className="w-10 h-10 opacity-20" />
             </div>
             <div>
                <h3 className="text-lg font-bold text-slate-700">Selecione uma conversa</h3>
                <p className="text-sm max-w-xs mx-auto mt-1">Escolha um cliente na lista ao lado para ver o histórico e enviar novas mensagens.</p>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
