'use client';


import { useState, useEffect, useRef, Suspense } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSocket } from '@/hooks/useSocket';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import type { Conversation, Message } from '@/types';

/**
 * Combined contact: either from an existing conversation or an accepted match.
 * This lets users message accepted matches even before any messages are sent.
 */
interface Contact {
  partnerId: string;
  partnerName: string;
  lastMessage?: string;
  lastMessageAt?: string;
}

// Wrapper to provide Suspense boundary for useSearchParams
export default function MessagesPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin shadow-lg shadow-brand-500/20" />
      </div>
    }>
      <MessagesContent />
    </Suspense>
  );
}

function MessagesContent() {
  const { user, token } = useAuth();
  const { socket } = useSocket(token);
  const searchParams = useSearchParams();

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<string | null>(null);
  const [selectedPartnerName, setSelectedPartnerName] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load contacts: merge existing conversations + accepted matches
  useEffect(() => {
    async function loadContacts() {
      try {
        const [conversations, matches] = await Promise.all([
          api.getConversations().catch(() => []),
          api.getMatches('accepted').catch(() => []),
        ]);

        const contactMap = new Map<string, Contact>();

        // Add contacts from existing conversations
        (conversations || []).forEach((conv: Conversation) => {
          contactMap.set(conv.partnerId, {
            partnerId: conv.partnerId,
            partnerName: conv.partner.name || 'Unknown',
            lastMessage: conv.lastMessage?.content,
            lastMessageAt: conv.lastMessage?.createdAt,
          });
        });

        // Add contacts from accepted matches (even if no messages yet)
        (matches || []).forEach((match: any) => {
          const isProposer = match.proposerId === user?.id;
          const partnerId = isProposer ? match.receiverId : match.proposerId;
          const partnerName = isProposer
            ? match.receiver?.name
            : match.proposer?.name;

          if (!contactMap.has(partnerId)) {
            contactMap.set(partnerId, {
              partnerId,
              partnerName: partnerName || 'Unknown',
              lastMessage: undefined,
              lastMessageAt: match.createdAt,
            });
          }
        });

        // Sort: contacts with recent messages first, then matches
        const sorted = Array.from(contactMap.values()).sort((a, b) => {
          if (a.lastMessage && !b.lastMessage) return -1;
          if (!a.lastMessage && b.lastMessage) return 1;
          const dateA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
          const dateB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
          return dateB - dateA;
        });

        setContacts(sorted);
      } catch (err) {
        console.error('Failed to load contacts:', err);
      } finally {
        setLoading(false);
      }
    }

    if (user) loadContacts();
  }, [user]);

  // Auto-select partner from URL params (?user=ID&name=Name)
  useEffect(() => {
    const userId = searchParams.get('user');
    const userName = searchParams.get('name');

    if (userId) {
      setSelectedPartner(userId);
      setSelectedPartnerName(userName || 'User');

      // Add to contacts list if not already there
      setContacts((prev) => {
        if (prev.some((c) => c.partnerId === userId)) return prev;
        return [
          { partnerId: userId, partnerName: userName || 'User' },
          ...prev,
        ];
      });
    }
  }, [searchParams]);

  // Load messages when selecting a partner
  useEffect(() => {
    if (selectedPartner) {
      api.getConversation(selectedPartner)
        .then((data) => setMessages(data.messages || []))
        .catch(() => setMessages([])); // Empty is fine for new conversations
    }
  }, [selectedPartner]);

  // Listen for real-time messages
  useEffect(() => {
    if (!socket) return;

    const handleReceive = (message: Message) => {
      if (message.senderId === selectedPartner) {
        setMessages((prev) => [...prev, message]);
      }
      // Update last message in contacts list
      setContacts((prev) =>
        prev.map((c) =>
          c.partnerId === message.senderId
            ? { ...c, lastMessage: message.content, lastMessageAt: message.createdAt }
            : c
        )
      );
    };

    const handleSent = (message: Message) => {
      // Confirmation from server — we already added optimistically
    };

    socket.on('message:receive', handleReceive);
    socket.on('message:sent', handleSent);

    return () => {
      socket.off('message:receive', handleReceive);
      socket.off('message:sent', handleSent);
    };
  }, [socket, selectedPartner]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Select a contact
  const selectContact = (contact: Contact) => {
    setSelectedPartner(contact.partnerId);
    setSelectedPartnerName(contact.partnerName);
  };

  // Send a message
  const handleSend = async () => {
    if (!newMessage.trim() || !selectedPartner || sending) return;
    setSending(true);

    const messageContent = newMessage;
    setNewMessage('');

    // Optimistic UI update
    const optimisticMsg: Message = {
      id: `temp-${Date.now()}`,
      senderId: user!.id,
      receiverId: selectedPartner,
      content: messageContent,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    // Update contacts list with new last message
    setContacts((prev) =>
      prev.map((c) =>
        c.partnerId === selectedPartner
          ? { ...c, lastMessage: messageContent, lastMessageAt: optimisticMsg.createdAt }
          : c
      )
    );

    try {
      if (socket?.connected) {
        socket.emit('message:send', {
          receiverId: selectedPartner,
          content: messageContent,
        });
      } else {
        await api.sendMessage(selectedPartner, messageContent);
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      // Remove optimistic message on failure
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)]">
      <h1 className="reveal font-display text-3xl mb-6">Messages</h1>

      <div className="flex bg-stone-900 rounded-2xl border border-stone-800 overflow-hidden h-[calc(100%-4rem)]">
        {/* Contact List (left sidebar) */}
        <div className="w-80 border-r border-stone-800 overflow-y-auto flex flex-col">
          <div className="p-3 border-b border-stone-800">
            <p className="text-xs font-medium text-stone-400 uppercase tracking-wide">Conversations</p>
          </div>

          {loading ? (
            <div className="p-4 text-center text-sm text-stone-400">Loading...</div>
          ) : contacts.length === 0 ? (
            <div className="p-6 text-center text-sm text-stone-400">
              No conversations yet. Accept a match to start chatting!
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              {contacts.map((contact) => (
                <button
                  key={contact.partnerId}
                  onClick={() => selectContact(contact)}
                  className={`w-full text-left p-4 border-b border-stone-800/50 hover:bg-stone-800/50 transition-colors ${
                    selectedPartner === contact.partnerId ? 'bg-brand-500/10' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-brand-500/20 rounded-full flex items-center justify-center text-brand-400 font-medium shrink-0">
                      {contact.partnerName.charAt(0) || '?'}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{contact.partnerName}</p>
                      <p className="text-xs text-stone-400 truncate">
                        {contact.lastMessage || 'No messages yet — say hello!'}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Chat Area (right side) */}
        <div className="flex-1 flex flex-col">
          {selectedPartner ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-stone-800 flex items-center gap-3">
                <div className="w-8 h-8 bg-brand-500/20 rounded-full flex items-center justify-center text-brand-400 font-medium text-sm">
                  {selectedPartnerName.charAt(0) || '?'}
                </div>
                <p className="font-semibold">{selectedPartnerName}</p>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-stone-400 text-sm">No messages yet. Send the first one!</p>
                  </div>
                )}
                {messages.map((msg) => {
                  const isMine = msg.senderId === user?.id;
                  return (
                    <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-xs px-4 py-2.5 rounded-2xl text-sm ${
                          isMine
                            ? 'bg-brand-500 text-white rounded-br-md'
                            : 'bg-stone-800 text-stone-100 rounded-bl-md'
                        }`}
                      >
                        {msg.content}
                        <div className={`text-[10px] mt-1 ${isMine ? 'text-white/70' : 'text-stone-400'}`}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-stone-800">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2.5 border border-stone-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  />
                  <button
                    onClick={handleSend}
                    disabled={sending || !newMessage.trim()}
                    className="bg-brand-500 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-brand-400 transition-colors disabled:opacity-50"
                  >
                    Send
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <p className="text-stone-400 text-lg mb-1">Select a conversation</p>
                <p className="text-stone-400 text-sm">Choose someone from the left to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
