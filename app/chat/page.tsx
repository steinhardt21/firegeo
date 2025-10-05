'use client';

import { useState, useEffect } from 'react';
import { useSession } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Send, Menu, X, MessageSquare, Plus, Trash2 } from 'lucide-react';
import { useConversations, useConversation, useDeleteConversation } from '@/hooks/useConversations';
import { useSendMessage } from '@/hooks/useMessages';
import { format } from 'date-fns';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';

// Chat component
function ChatContent({ session }: { session: any }) {
  const router = useRouter();
  const [input, setInput] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);
  
  // Queries and mutations
  const { data: conversations, isLoading: conversationsLoading } = useConversations();
  const { data: currentConversation } = useConversation(selectedConversationId);
  const sendMessage = useSendMessage();
  const deleteConversation = useDeleteConversation();

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    try {
      const result = await sendMessage.mutateAsync({
        message: input,
        conversationId: selectedConversationId || undefined,
      });

      setInput('');
      
      // If this was a new conversation, set the selected conversation ID
      if (!selectedConversationId && result.conversationId) {
        setSelectedConversationId(result.conversationId);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };
  
  const handleDeleteConversation = async (conversationId: string) => {
    setConversationToDelete(conversationId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (conversationToDelete) {
      await deleteConversation.mutateAsync(conversationToDelete);
      if (selectedConversationId === conversationToDelete) {
        setSelectedConversationId(null);
      }
      setConversationToDelete(null);
    }
  };
  
  const handleNewConversation = () => {
    setSelectedConversationId(null);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-80' : 'w-0'} bg-white border-r overflow-hidden flex flex-col transition-all duration-200`}>
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="font-semibold text-lg">Conversations</h2>
          <Button
            size="sm"
            onClick={handleNewConversation}
            className="btn-firecrawl-orange"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="overflow-y-auto flex-1">
          {conversationsLoading ? (
            <div className="p-4 text-center text-gray-500">Loading...</div>
          ) : conversations?.length === 0 ? (
            <div className="p-4 text-center text-gray-500">No conversations yet</div>
          ) : (
            <div className="space-y-1 p-2">
              {conversations?.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`p-3 rounded-lg cursor-pointer hover:bg-gray-100 ${
                    selectedConversationId === conversation.id ? 'bg-gray-100' : ''
                  }`}
                  onClick={() => setSelectedConversationId(conversation.id)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{conversation.title}</p>
                      <p className="text-xs text-gray-400">
                        {format(new Date(conversation.lastMessageAt), 'MMM d, h:mm a')}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteConversation(conversation.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative">
        {/* Toggle Sidebar Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute top-4 left-4 z-10 p-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
          aria-label="Toggle sidebar"
        >
          {sidebarOpen ? (
            <X className="h-5 w-5 text-gray-600" />
          ) : (
            <Menu className="h-5 w-5 text-gray-600" />
          )}
        </button>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4">
          {sendMessage.isPending && !currentConversation?.messages ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Sending message...</p>
              </div>
            </div>
          ) : currentConversation?.messages && currentConversation.messages.length > 0 ? (
            <div className="space-y-4 mb-20">
              {currentConversation.messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg px-4 py-2 ${
                      message.role === 'user'
                        ? 'bg-orange-500 text-white'
                        : 'bg-white border border-gray-200'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      message.role === 'user' ? 'text-orange-100' : 'text-gray-400'
                    }`}>
                      {format(new Date(message.createdAt), 'h:mm a')}
                    </p>
                  </div>
                </div>
              ))}
              {sendMessage.isPending && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-200 rounded-lg px-4 py-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">Start a Conversation</h2>
                <p className="text-gray-600">
                  Send a message to begin chatting with AI
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t bg-white p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              disabled={sendMessage.isPending}
              className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-100 disabled:text-gray-500"
            />
            <Button
              type="submit"
              disabled={!input.trim() || sendMessage.isPending}
              className="btn-firecrawl-orange"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>
      
      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Conversation"
        description="Are you sure you want to delete this conversation? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
      />
    </div>
  );
}

export default function ChatPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && !session) {
      router.push('/login');
    }
  }, [session, isPending, router]);

  if (isPending || !session) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return <ChatContent session={session} />;
}
