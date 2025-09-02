'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/lib/hooks/use-auth';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc,
  doc,
  serverTimestamp,
  getDocs,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Chat, Message, Patient } from '@/lib/types';
import { 
  MessageCircle, 
  Send, 
  Search, 
  Phone, 
  Video, 
  MoreHorizontal,
  Clock,
  Check,
  CheckCheck
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function ChatPage() {
  const { firebaseUser } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (firebaseUser) {
      fetchPatients();
      subscribeToChats();
    }
  }, [firebaseUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (selectedChatId) {
      subscribeToMessages(selectedChatId);
    }
  }, [selectedChatId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchPatients = async () => {
    if (!firebaseUser) return;

    try {
      const patientsQuery = query(
        collection(db, `users/${firebaseUser.uid}/patients`)
      );
      const patientsSnapshot = await getDocs(patientsQuery);
      const patientsList = patientsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Patient));
      setPatients(patientsList);
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  };

  const subscribeToChats = () => {
    if (!firebaseUser) return;

    const chatsQuery = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', firebaseUser.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(chatsQuery, (snapshot) => {
      const chatsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Chat));
      
      setChats(chatsList);
      setLoading(false);
    });

    return unsubscribe;
  };

  const subscribeToMessages = (chatId: string) => {
    const messagesQuery = query(
      collection(db, `chats/${chatId}/messages`),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messagesList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Message));
      
      setMessages(messagesList);
    });

    return unsubscribe;
  };

  const createOrSelectChat = async (patientId: string) => {
    if (!firebaseUser) return;

    // Check if chat already exists
    const existingChat = chats.find(chat => 
      chat.participants.includes(patientId)
    );

    if (existingChat) {
      setSelectedChatId(existingChat.id);
      return;
    }

    // Create new chat
    try {
      const chatData = {
        participants: [firebaseUser.uid, patientId],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const chatRef = await addDoc(collection(db, 'chats'), chatData);
      setSelectedChatId(chatRef.id);
    } catch (error) {
      console.error('Error creating chat:', error);
      toast.error('Erro ao criar conversa');
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChatId || !firebaseUser) return;

    try {
      const messageData = {
        senderId: firebaseUser.uid,
        text: newMessage.trim(),
        timestamp: serverTimestamp(),
        read: false
      };

      await addDoc(collection(db, `chats/${selectedChatId}/messages`), messageData);
      
      // Update chat's last message
      await updateDoc(doc(db, 'chats', selectedChatId), {
        lastMessage: {
          text: newMessage.trim(),
          timestamp: serverTimestamp(),
          senderId: firebaseUser.uid
        },
        updatedAt: serverTimestamp()
      });

      setNewMessage('');
      inputRef.current?.focus();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Erro ao enviar mensagem');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getPatientFromChat = (chat: Chat): Patient | null => {
    const patientId = chat.participants.find(id => id !== firebaseUser?.uid);
    return patients.find(p => p.id === patientId) || null;
  };

  const selectedChat = chats.find(chat => chat.id === selectedChatId);
  const selectedPatient = selectedChat ? getPatientFromChat(selectedChat) : null;

  const filteredPatients = patients.filter(patient => 
    patient.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredChats = chats.filter(chat => {
    const patient = getPatientFromChat(chat);
    return patient?.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-120px)] flex">
      {/* Sidebar */}
      <div className="w-80 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-semibold mb-4">Conversas</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar paciente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2">
            {searchTerm && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-500 mb-2 px-2">Pacientes</h3>
                {filteredPatients.map((patient) => (
                  <button
                    key={patient.id}
                    onClick={() => patient.id && createOrSelectChat(patient.id)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <Avatar>
                      <AvatarFallback>
                        {patient.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-sm">{patient.name}</p>
                      <p className="text-xs text-gray-500">Iniciar conversa</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2 px-2">Conversas Recentes</h3>
              {filteredChats.map((chat) => {
                const patient = getPatientFromChat(chat);
                if (!patient) return null;

                const isSelected = selectedChatId === chat.id;
                const lastMessageTime = chat.lastMessage?.timestamp;

                return (
                  <button
                    key={chat.id}
                    onClick={() => setSelectedChatId(chat.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                      isSelected ? 'bg-primary/10 border border-primary/20' : 'hover:bg-gray-50'
                    }`}
                  >
                    <Avatar>
                      <AvatarFallback>
                        {patient.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left">
                      <div className="flex justify-between items-center mb-1">
                        <p className="font-medium text-sm">{patient.name}</p>
                        {lastMessageTime && (
                          <span className="text-xs text-gray-500">
                            {lastMessageTime instanceof Timestamp
                              ? format(lastMessageTime.toDate(), 'HH:mm')
                              : format(lastMessageTime, 'HH:mm')
                            }
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate">
                        {chat.lastMessage?.text || 'Conversa iniciada'}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedChat && selectedPatient ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback>
                    {selectedPatient.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="font-semibold">{selectedPatient.name}</h2>
                  <p className="text-sm text-gray-500">{selectedPatient.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon">
                  <Phone className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Video className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => {
                  const isOwn = message.senderId === firebaseUser?.uid;
                  const messageTime = message.timestamp instanceof Timestamp 
                    ? message.timestamp.toDate() 
                    : message.timestamp;

                  return (
                    <div
                      key={message.id}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] px-4 py-2 rounded-lg ${
                          isOwn
                            ? 'bg-primary text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm">{message.text}</p>
                        <div className={`flex items-center justify-end gap-1 mt-1 ${
                          isOwn ? 'text-white/80' : 'text-gray-500'
                        }`}>
                          <span className="text-xs">
                            {format(messageTime, 'HH:mm', { locale: ptBR })}
                          </span>
                          {isOwn && (
                            <div className="flex">
                              {message.read ? (
                                <CheckCheck className="h-3 w-3" />
                              ) : (
                                <Check className="h-3 w-3" />
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="flex items-center gap-2">
                <Input
                  ref={inputRef}
                  placeholder="Digite sua mensagem..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1"
                />
                <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <MessageCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Selecione uma conversa
              </h3>
              <p className="text-gray-500">
                Escolha um paciente para iniciar uma conversa ou continue uma conversa existente.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}