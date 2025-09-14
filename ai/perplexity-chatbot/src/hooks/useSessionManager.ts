'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { ChatMessage as ChatMessageType } from '../lib/types';

export interface ChatSession {
  _id?: string;
  id: string;
  name: string;
  createdAt: Date;
  lastMessage?: string;
  messageCount: number;
  messages: ChatMessageType[];
}

const CURRENT_SESSION_KEY = 'perplexity-current-session';

export const useSessionManager = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Get user-specific storage key
  const getCurrentSessionKey = () => {
    return user ? `${CURRENT_SESSION_KEY}-${user._id || user.email}` : `${CURRENT_SESSION_KEY}-guest`;
  };

  // Load sessions from MongoDB on mount or user change
  useEffect(() => {
    if (user) {
      // Only load sessions for authenticated users
      loadSessions();
      const sessionKey = getCurrentSessionKey();
      const savedCurrentSession = localStorage.getItem(sessionKey);
      if (savedCurrentSession) {
        setCurrentSessionId(savedCurrentSession);
      } else {
        setCurrentSessionId(null);
      }
    } else {
      // For guests, clear sessions and use temporary state only
      setSessions([]);
      setCurrentSessionId(null);
      const guestSessionKey = `${CURRENT_SESSION_KEY}-guest`;
      localStorage.removeItem(guestSessionKey);
    }
  }, [user]);

  // Save current session ID to localStorage whenever it changes
  useEffect(() => {
    if (currentSessionId) {
      const sessionKey = getCurrentSessionKey();
      localStorage.setItem(sessionKey, currentSessionId);
    }
  }, [currentSessionId, user]);

  const loadSessions = async () => {
    // Only load sessions for authenticated users
    if (!user) {
      setSessions([]);
      return;
    }

    try {
      setIsLoading(true);
      const token = localStorage.getItem('auth-token');
      if (!token) {
        setSessions([]);
        return;
      }

      const userId = user._id || user.email;
      const response = await fetch(`/api/sessions?userId=${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        const parsedSessions = data.map((session: any) => ({
          ...session,
          id: session._id || session.id,
          createdAt: new Date(session.createdAt),
          messages: session.messages?.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          })) || []
        }));
        setSessions(parsedSessions);
      } else if (response.status === 401) {
        // Authentication failed, clear sessions
        setSessions([]);
        localStorage.removeItem('auth-token');
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
      setSessions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateSessionName = (firstMessage?: string) => {
    if (firstMessage && firstMessage.length > 0) {
      // Clean the message and create a more readable session name
      const cleaned = firstMessage.trim()
        .replace(/\n+/g, ' ') // Replace newlines with spaces
        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        .substring(0, 40); // Slightly longer for better context
      
      return cleaned + (firstMessage.length > 40 ? '...' : '');
    }
    return `New Chat`;
  };

  const autoRenameSession = (sessionId: string, userMessage: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session && (session.name === 'New Chat' || session.name.startsWith('New Chat'))) {
      // Only auto-rename if it's still the default name
      const newName = generateSessionName(userMessage);
      renameSession(sessionId, newName);
    }
  };

  const createNewSession = async (firstMessage?: string): Promise<string> => {
    console.log('Creating new session, user:', user ? 'authenticated' : 'guest');
    
    // Always create a temporary session first for immediate use
    const tempSessionId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const tempSession: ChatSession = {
      id: tempSessionId,
      name: generateSessionName(firstMessage),
      messageCount: 0,
      messages: [],
      createdAt: new Date(),
    };
    
    // Add to local state immediately for better UX
    setSessions(prev => [tempSession, ...prev]);
    setCurrentSessionId(tempSessionId);
    console.log('Created temporary session:', tempSessionId);

    // For guests, stop here - just use the temporary session
    if (!user) {
      console.log('Guest session created successfully');
      return tempSessionId;
    }

    // For authenticated users, try to persist to database but don't fail if it doesn't work
    const token = localStorage.getItem('auth-token');
    if (!token) {
      console.warn('No auth token found, using temporary session');
      return tempSessionId;
    }

    const sessionData = {
      id: tempSessionId,
      name: generateSessionName(firstMessage),
      messageCount: 0,
      messages: [],
      userId: user._id || user.email,
    };

    console.log('Attempting to persist session to database...');

    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(sessionData),
      });

      console.log('Session persistence response:', response.status, response.ok);

      if (response.ok) {
        const persistedSession = await response.json();
        console.log('Session persisted successfully:', persistedSession);
        
        // Update the session with the MongoDB _id
        setSessions(prev => 
          prev.map(session => 
            session.id === tempSessionId 
              ? { ...session, _id: persistedSession._id }
              : session
          )
        );
        
        return tempSessionId; // Still return the same ID for consistency
      } else {
        const errorText = await response.text();
        console.warn('Session persistence failed, continuing with temporary session:', response.status, errorText);
        // Don't throw error - just continue with temporary session
      }
    } catch (error) {
      console.warn('Error persisting session, continuing with temporary session:', error);
      // Don't throw error - just continue with temporary session
    }

    // Return the temporary session ID regardless of persistence success/failure
    return tempSessionId;
  };

  const selectSession = (sessionId: string) => {
    setCurrentSessionId(sessionId);
  };

  const deleteSession = async (sessionId: string) => {
    if (!user) {
      // For guests, just remove from state
      setSessions(prev => prev.filter(session => session.id !== sessionId));
      if (currentSessionId === sessionId) {
        const remainingSessions = sessions.filter(session => session.id !== sessionId);
        if (remainingSessions.length > 0) {
          setCurrentSessionId(remainingSessions[0].id);
        } else {
          setCurrentSessionId(null);
        }
      }
      return;
    }

    const token = localStorage.getItem('auth-token');
    if (!token) return;

    try {
      const session = sessions.find(s => s.id === sessionId);
      const mongoId = session?._id || sessionId;
      
      const response = await fetch(`/api/sessions?id=${mongoId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setSessions(prev => prev.filter(session => session.id !== sessionId));
        
        if (currentSessionId === sessionId) {
          const remainingSessions = sessions.filter(session => session.id !== sessionId);
          if (remainingSessions.length > 0) {
            setCurrentSessionId(remainingSessions[0].id);
          } else {
            setCurrentSessionId(null);
            const sessionKey = getCurrentSessionKey();
            localStorage.removeItem(sessionKey);
          }
        }
      }
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  };

  const renameSession = async (sessionId: string, newName: string) => {
    if (!user) {
      // For guests, just update in state
      setSessions(prev => 
        prev.map(session => 
          session.id === sessionId 
            ? { ...session, name: newName }
            : session
        )
      );
      return;
    }

    const token = localStorage.getItem('auth-token');
    if (!token) return;

    try {
      const session = sessions.find(s => s.id === sessionId);
      const mongoId = session?._id || sessionId;
      
      const response = await fetch('/api/sessions', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: mongoId,
          name: newName,
        }),
      });

      if (response.ok) {
        setSessions(prev => 
          prev.map(session => 
            session.id === sessionId 
              ? { ...session, name: newName }
              : session
          )
        );
      }
    } catch (error) {
      console.error('Error renaming session:', error);
    }
  };

  const updateSessionMessages = async (sessionId: string, messages: ChatMessageType[]) => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;

    const lastUserMessage = messages.filter(m => m.role === 'user').pop();
    const firstUserMessage = messages.find(m => m.role === 'user');
    
    // Auto-rename session if it's the first user message and session has default name
    let newName = session.name;
    if (firstUserMessage && (session.name === 'New Chat' || session.name.startsWith('New Chat'))) {
      newName = generateSessionName(firstUserMessage.content);
    }

    const updateData = {
      id: session._id || sessionId,
      name: newName,
      messages,
      messageCount: messages.length,
      lastMessage: lastUserMessage?.content.substring(0, 50) + 
        (lastUserMessage?.content.length && lastUserMessage.content.length > 50 ? '...' : ''),
    };

    // Update local state immediately for better UX
    setSessions(prev => 
      prev.map(s => 
        s.id === sessionId 
          ? {
              ...s,
              name: newName,
              messages,
              messageCount: messages.length,
              lastMessage: updateData.lastMessage,
            }
          : s
      )
    );

    // Only attempt to save to database for authenticated users with valid tokens
    if (!user) return;

    const token = localStorage.getItem('auth-token');
    if (!token) {
      console.warn('No auth token available, session changes saved locally only');
      return;
    }

    // Only try to persist if session has a database ID
    if (!session._id) {
      console.warn('Session has no database ID, skipping database update');
      return;
    }

    try {
      const response = await fetch('/api/sessions', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        console.warn('Failed to update session in database, but local state updated:', response.status);
        // Don't throw error - local state is already updated for better UX
      } else {
        console.log('Session updated successfully in database');
      }
    } catch (error) {
      console.warn('Error updating session in database, but local state updated:', error);
      // Local state is already updated, so no rollback needed for better UX
    }
  };

  const getCurrentSession = (): ChatSession | null => {
    return sessions.find(session => session.id === currentSessionId) || null;
  };

  const clearAllSessions = async () => {
    if (!user) {
      // For guests, just clear state
      setSessions([]);
      setCurrentSessionId(null);
      return;
    }

    const token = localStorage.getItem('auth-token');
    if (!token) return;

    try {
      // Delete all sessions from MongoDB
      for (const session of sessions) {
        const mongoId = session._id || session.id;
        await fetch(`/api/sessions?id=${mongoId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      }
      
      setSessions([]);
      setCurrentSessionId(null);
      const sessionKey = getCurrentSessionKey();
      localStorage.removeItem(sessionKey);
    } catch (error) {
      console.error('Error clearing all sessions:', error);
    }
  };

  return {
    sessions,
    currentSessionId,
    isLoading,
    createNewSession,
    selectSession,
    deleteSession,
    renameSession,
    updateSessionMessages,
    getCurrentSession,
    clearAllSessions,
    autoRenameSession,
    loadSessions,
  };
};
