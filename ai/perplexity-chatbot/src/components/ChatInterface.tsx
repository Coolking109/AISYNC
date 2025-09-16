'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Send, Loader2, Brain, Menu, Paperclip, X, Image, FileText, File, Settings, ChevronDown, LogOut, User } from 'lucide-react';
import { createPortal } from 'react-dom';
import { ChatMessage } from './ChatMessage';
import { Sidebar } from './Sidebar';
import { ModelSelector, ModelSelection } from './ModelSelector';
import { AuthModal } from './AuthModal';
import { AccountSettings } from './AccountSettings';
import { ChatMessage as ChatMessageType, MultiModelResponse, FileAttachment } from '@/lib/types';
import { useSessionManager } from '@/hooks/useSessionManager';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/hooks/useTranslation';

export const ChatInterface: React.FC = () => {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { t, language } = useTranslation();
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [responses, setResponses] = useState<MultiModelResponse | null>(null);
  const [selectedResponse, setSelectedResponse] = useState<any>(null);
  const [selectedResponseIds, setSelectedResponseIds] = useState<Set<string>>(new Set());
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [modelSelection, setModelSelection] = useState<ModelSelection>({ mode: 'all' });
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAccountSettings, setShowAccountSettings] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [userButtonRect, setUserButtonRect] = useState<DOMRect | null>(null);
  const [userButtonRef, setUserButtonRef] = useState<HTMLButtonElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    sessions,
    currentSessionId,
    createNewSession,
    selectSession,
    deleteSession,
    renameSession,
    updateSessionMessages,
    getCurrentSession,
    autoRenameSession,
  } = useSessionManager();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleFeedback = async (messageId: string, feedback: 'positive' | 'negative' | 'neutral') => {
    try {
      // Find the message to get the response content and question context
      const message = messages.find(m => m.id === messageId);
      const userMessages = messages.filter(m => m.role === 'user');
      const lastUserMessage = userMessages[userMessages.length - 1];
      
      // Get recent conversation context (last 3 messages for context)
      const recentContext = messages.slice(-3).map(m => 
        `${m.role}: ${m.content}`
      ).join('\n');
      
      const response = await fetch('/api/ai-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messageId,
          feedback,
          question: lastUserMessage?.content || '',
          response: message?.content || '', // AI response content for Mistral training
          context: recentContext // Conversation context for better training
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Feedback sent successfully:', data.aiStats);
      } else {
        console.error('❌ Failed to send feedback:', data.message);
      }
    } catch (error) {
      console.error('Feedback error:', error);
    }
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Update user dropdown position
  useEffect(() => {
    if (showUserDropdown && userButtonRef) {
      const rect = userButtonRef.getBoundingClientRect();
      setUserButtonRect(rect);
    }
  }, [showUserDropdown, userButtonRef]);

  useEffect(() => {
    const updateUserDropdownPosition = () => {
      if (userButtonRef) {
        setUserButtonRect(userButtonRef.getBoundingClientRect());
      }
    };

    const handleResize = () => {
      if (showUserDropdown) {
        updateUserDropdownPosition();
      }
    };

    const handleScroll = () => {
      if (showUserDropdown) {
        updateUserDropdownPosition();
      }
    };

    if (showUserDropdown) {
      window.addEventListener('resize', handleResize);
      window.addEventListener('scroll', handleScroll);
      
      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('scroll', handleScroll);
      };
    }
  }, [showUserDropdown, userButtonRef]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showUserDropdown && !target.closest('.user-dropdown') && !target.closest('[data-user-dropdown]')) {
        setShowUserDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserDropdown]);



  // Handle creating a new chat session
  const handleNewChat = async (): Promise<void> => {
    try {
      // Clear current chat state
      setMessages([]);
      setResponses(null);
      setSelectedResponse(null);
      setSelectedResponseIds(new Set());
      setInput('');
      setAttachments([]);
      
      // Create new session
      const newSessionId = await createNewSession();
      console.log('New chat session created:', newSessionId);
      // Don't return the session ID since Sidebar expects Promise<void>
    } catch (error) {
      console.error('Failed to create new chat:', error);
      // Show specific error message to user
      let errorMessage = 'Failed to create new chat session. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('Authentication')) {
          errorMessage = 'Authentication required. Please log in and try again.';
        } else if (error.message.includes('connection')) {
          errorMessage = 'Unable to connect to server. Please check your internet connection.';
        } else if (error.message.includes('database')) {
          errorMessage = 'Database connection error. Please try again in a moment.';
        }
      }
      
      setMessages([{
        id: Date.now().toString(),
        role: 'assistant',
        content: errorMessage,
        timestamp: new Date(),
        model: 'System'
      }]);
    }
  };

  // Load messages when current session changes (but not when session content updates)
  useEffect(() => {
    const currentSession = getCurrentSession();
    if (currentSession) {
      setMessages(currentSession.messages);
    } else {
      setMessages([]);
    }
    setSelectedResponseIds(new Set());
    // Only reset responses when actually changing sessions, not when updating current session
    // setResponses(null); // Commented out to prevent clearing responses during session updates
  }, [currentSessionId]); // Removed getCurrentSession from dependencies

  const handleFilesSelected = (newFiles: FileAttachment[]) => {
    setAttachments(prev => [...prev, ...newFiles]);
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments(prev => prev.filter(att => att.id !== id));
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const newAttachments: FileAttachment[] = [];

    Array.from(files).forEach((file) => {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert(`File ${file.name} is too large. Maximum size is 10MB.`);
        return;
      }

      // Check file type
      const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'text/plain',
        'text/csv',
        'application/pdf',
        'application/json',
        'text/markdown',
      ];

      if (!allowedTypes.includes(file.type)) {
        alert(`File type ${file.type} is not supported.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        
        const attachment: FileAttachment = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          name: file.name,
          type: file.type,
          size: file.size,
          base64,
        };

        newAttachments.push(attachment);
        
        // Call callback when all files are processed
        if (newAttachments.length === files.length) {
          setAttachments(prev => [...prev, ...newAttachments]);
        }
      };
      
      reader.readAsDataURL(file);
    });
  };

  const getSelectedModelName = () => {
    const modelNames: { [key: string]: string } = {
      'openai': 'OpenAI GPT-4o',
      'google': 'Google Gemini',
      'anthropic': 'Anthropic Claude',
      'cohere': 'Cohere Command',
      'mistral': 'Mistral Large',
      'learning-ai': 'AISync Learning AI'
    };
    return modelNames[modelSelection.selectedModel || ''] || 'AI Model';
  };

  const handleResponseClick = (response: any, index: number) => {
    const responseId = `${response.provider}-${index}`;
    
    // Check if this response was already selected
    if (selectedResponseIds.has(responseId)) {
      return; // Don't add duplicate responses
    }

    // Create a new message with the selected AI response
    const selectedMessage: ChatMessageType = {
      id: (Date.now() + Math.random()).toString(),
      role: 'assistant',
      content: response.content,
      timestamp: new Date(),
      model: `${response.model} (${response.provider})`,
      sources: response.sources || [],
    };

    const newMessages = [...messages, selectedMessage];
    setMessages(newMessages);
    setSelectedResponse(response);
    setSelectedResponseIds(prev => new Set([...prev, responseId]));
    
    // Update session with new messages
    if (currentSessionId) {
      updateSessionMessages(currentSessionId, newMessages);
    }
    
    scrollToBottom();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('handleSubmit called', { input, isLoading });
    if (!input.trim() || isLoading) {
      console.log('Returning early', { inputTrimmed: input.trim(), isLoading });
      return;
    }

    // Create or select a session
    let sessionId = currentSessionId;
    if (!sessionId) {
      try {
        sessionId = await createNewSession(); // Auto-renaming will be handled by updateSessionMessages
      } catch (error) {
        console.error('Session creation failed:', error);
        
        // Show error message to user and stop processing
        const errorMessage: ChatMessageType = {
          id: Date.now().toString(),
          role: 'assistant',
          content: error instanceof Error ? error.message : 'Failed to create session. Please try again.',
          timestamp: new Date(),
          model: 'System'
        };
        
        setMessages(prev => [...prev, userMessage, errorMessage]);
        setInput('');
        return; // Don't proceed with chat if session creation failed
      }
    }

    const userMessage: ChatMessageType = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
      attachments: attachments.length > 0 ? [...attachments] : undefined,
    };

    console.log('User message with attachments:', userMessage.attachments?.length || 0, 'files');
    if (userMessage.attachments) {
      userMessage.attachments.forEach(att => {
        console.log('Attachment:', att.name, att.type, 'Base64 length:', att.base64?.length || 0);
      });
    }

    const newMessages = [...messages, userMessage];
    console.log('Setting new messages:', newMessages);
    setMessages(newMessages);
    setInput('');
    setAttachments([]); // Clear attachments after sending
    setIsLoading(true);
    setSelectedResponseIds(new Set()); // Clear selected responses for new query

    try {
      console.log('Sending request to /api/chat...');
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: newMessages,
          modelSelection,
          userLanguage: language,
        }),
      });

      console.log('Got response:', response.status, response.ok);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error response:', errorText);
        throw new Error(`Failed to get response: ${response.status}`);
      }

      const data: MultiModelResponse = await response.json();
      console.log('Got data:', data);
      setResponses(data);

      const assistantMessage: ChatMessageType = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.aggregatedResponse,
        timestamp: new Date(),
        model: `${data.responses.length} AI Models`,
        sources: data.sources,
      };

      const finalMessages = [...newMessages, assistantMessage];
      setMessages(finalMessages);
      
      // Update session with new messages
      if (sessionId) {
        updateSessionMessages(sessionId, finalMessages);
      }
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      
      // Create a more detailed error message
      const errorContent = error instanceof Error 
        ? `Sorry, I encountered an error: ${error.message}. Please check the browser console for more details.`
        : 'Sorry, I encountered an unknown error. Please try again.';
      
      const errorMessage: ChatMessageType = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: errorContent,
        timestamp: new Date(),
        model: 'Error',
      };
      const finalMessages = [...newMessages, errorMessage];
      setMessages(finalMessages);
      
      // Also set an error response to show debugging info
      setResponses({
        responses: [{
          content: errorContent,
          model: 'Error Handler',
          provider: 'System',
          timestamp: new Date(),
          confidence: 0,
        }],
        aggregatedResponse: errorContent,
        consensus: 0,
        sources: [],
      });
      
      // Update session even with error message
      if (sessionId) {
        updateSessionMessages(sessionId, finalMessages);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen relative">
      {/* Animated Background Particles */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {isMounted && [...Array(15)].map((_, i) => (
          <div
            key={i}
            className="particle absolute"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 6}s`,
            }}
          />
        ))}
      </div>

      {/* Sidebar */}
      {sidebarOpen && (
        <div className="glass-dark backdrop-blur-xl border-r border-glass z-10">
          <Sidebar
            sessions={sessions}
            currentSessionId={currentSessionId}
            onSessionSelect={selectSession}
            onNewSession={handleNewChat}
            onDeleteSession={deleteSession}
            onRenameSession={renameSession}
          />
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-col flex-1 relative z-10">
        {/* Header */}
        <div className="glass-dark backdrop-blur-xl border-b border-glass p-4 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-accent/10 via-accent-secondary/10 to-accent-tertiary/10 opacity-30"></div>
          <div className="relative flex items-center">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-text hover:text-accent mr-3 p-2 rounded-lg hover:bg-glass transition-all duration-200"
              type="button"
            >
              <Menu className="w-6 h-6" />
            </button>
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity duration-200 cursor-pointer"
              title="Go to Home"
            >
              <Brain className="w-8 h-8 text-accent animate-glow" />
              <h1 className="text-2xl font-bold gradient-text animate-slide-up">
                AISync
              </h1>
            </button>
            <div className="ml-4">
              <ModelSelector
                selection={modelSelection}
                onSelectionChange={setModelSelection}
              />
            </div>
            <div className="ml-auto flex items-center gap-3">
              {user ? (
                <div className="user-dropdown">
                  <button
                    ref={setUserButtonRef}
                    onClick={() => setShowUserDropdown(!showUserDropdown)}
                    className="flex items-center gap-2 bg-glass hover:bg-glass-hover px-4 py-2 rounded-full backdrop-blur-sm transition-all duration-200 text-text-secondary hover:text-text"
                    data-user-dropdown
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-accent to-accent-secondary flex items-center justify-center text-white text-sm font-medium">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium">
                      {user.username}
                    </span>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showUserDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Menu with Portal */}
                  {showUserDropdown && userButtonRect && typeof document !== 'undefined' && createPortal(
                    <>
                      {/* Backdrop */}
                      <div
                        className="fixed inset-0 z-[9998]"
                        onClick={() => setShowUserDropdown(false)}
                      />
                      
                      {/* Dropdown Menu */}
                      <div 
                        className="fixed glass border border-glass rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl bg-surface/98 border-accent/20"
                        style={{
                          top: (() => {
                            const dropdownHeight = 120;
                            const spaceBelow = window.innerHeight - userButtonRect.bottom;
                            const spaceAbove = userButtonRect.top;
                            
                            if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
                              return `${userButtonRect.top - dropdownHeight}px`;
                            }
                            
                            return `${userButtonRect.bottom}px`;
                          })(),
                          left: (() => {
                            const dropdownWidth = 192; // w-48 = 12rem = 192px
                            const spaceRight = window.innerWidth - userButtonRect.right;
                            
                            if (spaceRight < dropdownWidth) {
                              return `${userButtonRect.right - dropdownWidth}px`;
                            }
                            
                            return `${userButtonRect.left}px`;
                          })(),
                          width: '192px', // w-48
                          zIndex: 9999,
                          position: 'fixed',
                          transform: 'none',
                        }}
                        data-user-dropdown
                      >
                        <div className="py-1">
                          <button
                            onClick={() => {
                              setShowAccountSettings(true);
                              setShowUserDropdown(false);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-left text-text-secondary hover:text-text hover:bg-glass transition-all duration-200"
                          >
                            <Settings className="w-4 h-4" />
                            <span className="text-sm">{t('accountSettings')}</span>
                          </button>
                          
                          <div className="border-t border-glass">
                            <button
                              onClick={() => {
                                logout();
                                setShowUserDropdown(false);
                              }}
                              className="w-full flex items-center gap-3 px-4 py-3 text-left text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200"
                            >
                              <LogOut className="w-4 h-4" />
                              <span className="text-sm">Sign Out</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </>,
                    document.body
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="text-sm bg-accent hover:bg-accent-hover text-white px-4 py-2 rounded-full transition-all duration-200"
                >
                  Login / Register
                </button>
              )}
            </div>
          </div>
        </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 relative">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-12 animate-fade-in">
              <div className="glass rounded-2xl p-8 mx-auto max-w-md">
                <Brain className="w-16 h-16 text-accent mx-auto mb-4 animate-float" />
                <h2 className="text-xl font-semibold gradient-text mb-2">
                  Welcome to AISync
                </h2>
                <p className="text-text-secondary">
                  Ask me anything and I'll consult multiple AI models to give you the best answer.
                </p>
              </div>
            </div>
          )}
          
          {messages.map((message) => (
            <ChatMessage 
              key={message.id} 
              message={message} 
              onFeedback={handleFeedback}
            />
          ))}
          
          {isLoading && (
            <div className="flex justify-start mb-4 animate-slide-up">
              <div className="glass text-text px-4 py-3 rounded-2xl mr-12 shadow-neon">
                <div className="flex items-center">
                  <Loader2 className="w-4 h-4 animate-spin mr-2 text-accent" />
                  <span>
                    {modelSelection.mode === 'all' 
                      ? 'Consulting multiple AI models...' 
                      : `Querying ${getSelectedModelName()}...`
                    }
                  </span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>



      {/* Model Responses Panel - Show if we have responses and using all models */}
      {responses?.responses && responses.responses.length > 0 && modelSelection.mode === 'all' && (
        <div className="glass-dark backdrop-blur-xl border-t border-glass p-4 max-h-64 overflow-y-auto animate-slide-up">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold gradient-text">
                {modelSelection.mode === 'all' 
                  ? `Individual Model Responses (${responses?.responses?.length || 0} models, Consensus: ${Math.round((responses?.consensus || 0) * 100)}%) - Click to view full response`
                  : `${getSelectedModelName()} Response - Click to view full response`
                }
              </h3>
              {selectedResponseIds.size > 0 && (
                <button
                  onClick={() => setSelectedResponseIds(new Set())}
                  className="text-xs glass text-white px-3 py-1 rounded-full transition-all duration-200 hover:shadow-neon hover:bg-accent/20"
                >
                  Clear Selections ({selectedResponseIds.size})
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {responses?.responses?.map((response, index) => {
                const responseId = `${response.provider}-${index}`;
                const isSelected = selectedResponseIds.has(responseId);
                
                return (
                <div 
                  key={index} 
                  onClick={() => handleResponseClick(response, index)}
                  className={`glass p-3 rounded-xl transition-all duration-300 transform hover:scale-[1.02] hover:-translate-y-1 ${
                    isSelected 
                      ? 'border-green-500 bg-green-500/10 shadow-neon' 
                      : 'border-glass cursor-pointer hover:border-accent hover:shadow-neon hover:bg-accent/5'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-accent">
                      {response.model}
                    </span>
                    <span className="text-xs text-text-secondary">
                      {response.provider}
                    </span>
                  </div>
                  <p className="text-sm text-text line-clamp-3">
                    {response.content.substring(0, 150)}
                    {response.content.length > 150 && '...'}
                  </p>
                  <div className={`mt-2 text-xs opacity-75 ${
                    isSelected ? 'text-green-400' : 'text-accent'
                  }`}>
                    {isSelected ? '✓ Response selected' : 'Click to expand full response →'}
                  </div>
                  {response.confidence && (
                    <div className="mt-1 text-xs text-text-secondary">
                      Confidence: {Math.round(response.confidence * 100)}%
                    </div>
                  )}
                </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Input Form */}
      <div className="glass-dark backdrop-blur-xl border-t border-glass p-4 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-accent/5 via-accent-secondary/5 to-accent-tertiary/5"></div>
        <div className="max-w-4xl mx-auto relative space-y-4">
          {/* Attachments Display (only when files are attached) */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 p-2 glass rounded-lg">
              {attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-lg px-3 py-2 text-sm"
                >
                  {attachment.type.startsWith('image/') ? (
                    <Image className="w-4 h-4" />
                  ) : attachment.type.includes('text') || attachment.type.includes('json') ? (
                    <FileText className="w-4 h-4" />
                  ) : (
                    <File className="w-4 h-4" />
                  )}
                  <span className="text-text truncate max-w-32">{attachment.name}</span>
                  <span className="text-text-secondary text-xs">
                    ({Math.round(attachment.size / 1024)}KB)
                  </span>
                  <button
                    onClick={() => handleRemoveAttachment(attachment.id)}
                    className="text-red-400 hover:text-red-300 ml-1"
                    type="button"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="flex space-x-4">
            <div className="flex-1 relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="w-full glass text-text border border-glass rounded-2xl px-6 py-4 pr-14 focus:outline-none focus:border-accent focus:shadow-neon transition-all duration-200 placeholder-text-secondary/70"
                disabled={isLoading}
                autoFocus
              />
              
              {/* File Upload Bubble */}
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".jpg,.jpeg,.png,.gif,.webp,.txt,.csv,.pdf,.json,.md"
                  onChange={(e) => handleFileSelect(e.target.files)}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 rounded-full hover:bg-accent/10 transition-colors text-text-secondary hover:text-accent"
                  title="Attach files"
                >
                  <Paperclip className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <button
              type="submit"
              onClick={() => console.log('Button clicked directly!')}
              className="px-8 py-4 rounded-2xl font-medium flex items-center transition-all duration-200 bg-gradient-to-r from-accent to-accent-secondary text-white hover:shadow-neon hover:scale-105 active:scale-95"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </form>
        </div>
      </div>
      </div>

      {/* Authentication Modal */}
      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}

      {/* Account Settings Modal */}
      {showAccountSettings && (
        <AccountSettings onClose={() => setShowAccountSettings(false)} />
      )}
    </div>
  );
};
