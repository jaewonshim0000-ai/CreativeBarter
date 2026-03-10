'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSocket } from '@/hooks/useSocket';
import { api } from '@/lib/api';
import type { Conversation, Message } from '@/types';

export default function MessagesPage() {
  const { user, token } = useAuth();
  const { socket } = useSocket(token);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversations list
  useEffect(() => {
    api.getConversations()
      .then(setConversations)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Load messages when selecting a conversation
  useEffect(() => {
    if (selectedPartner) {
      api.getConversation(selectedPartner)
        .then((data) => setMessages(data.messages || []))
        .catch(console.error);
    }
  }, [selectedPartner]);

  // Listen for real-time messages
  useEffect(() => {
    if (!socket) return;

    socket.on('message:receive', (message: Message) => {
      if (message.senderId === selectedPartner) {
        setMessages((prev) => [...prev, message]);
      }
    });

    return () => {
      socket.off('message:receive');
    };
  }, [socket, selectedPartner]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedPartner) return;

    try {
      // Use socket for real-time delivery
      if (socket) {
        socket.emit('message:send', {
          receiverId: selectedPartner,
          content: newMessage,
        });
      } else {
        await api.sendMessage(selectedPartner, newMessage);
      }

      // Optimistic UI update
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          senderId: user!.id,
          receiverId: selectedPartner,
          content: newMessage,
          isRead: false,
          createdAt: new Date().toISOString(),
        },
      ]);
      setNewMessage('');
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const selectedConversation = conversations.find((c) => c.partnerId === selectedPartner);

  return (
    <div className="h-[calc(100vh-8rem)]">
      <h1 className="font-display text-3xl mb-6">Messages</h1>

      <div className="flex bg-white rounded-2xl border border-surface-200 overflow-hidden h-[calc(100%-4rem)]">
        {/* Conversation List */}
        <div className="w-80 border-r border-surface-200 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-sm text-surface-800">Loading...</div>
          ) : conversations.length === 0 ? (
            <div className="p-6 text-center text-sm text-surface-800">
              No conversations yet. Propose a collaboration to start chatting!
            </div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.partnerId}
                onClick={() => setSelectedPartner(conv.partnerId)}
                className={`w-full text-left p-4 border-b border-surface-100 hover:bg-surface-50 transition-colors ${
                  selectedPartner === conv.partnerId ? 'bg-brand-50' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center text-brand-600 font-medium shrink-0">
                    {conv.partner.name?.charAt(0) || '?'}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{conv.partner.name}</p>
                    <p className="text-xs text-surface-800 truncate">
                      {conv.lastMessage.content}
                    </p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedPartner ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-surface-200">
                <p className="font-semibold">
                  {selectedConversation?.partner.name || 'Chat'}
                </p>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg) => {
                  const isMine = msg.senderId === user?.id;
                  return (
                    <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-xs px-4 py-2.5 rounded-2xl text-sm ${
                          isMine
                            ? 'bg-brand-500 text-white rounded-br-md'
                            : 'bg-surface-100 text-surface-900 rounded-bl-md'
                        }`}
                      >
                        {msg.content}
                        <div className={`text-[10px] mt-1 ${isMine ? 'text-white/70' : 'text-surface-800'}`}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-surface-200">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2.5 border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <button
                    onClick={handleSend}
                    className="bg-brand-500 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-brand-600 transition-colors"
                  >
                    Send
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-surface-800 text-sm">
              Select a conversation to start messaging
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
