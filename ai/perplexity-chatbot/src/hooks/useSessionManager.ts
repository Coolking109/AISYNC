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
    
    // For guests, create a temporary session in state only
    if (!user) {
      const tempSessionId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      const tempSession: ChatSession = {
        id: tempSessionId,
        name: generateSessionName(firstMessage),
        messageCount: 0,
        messages: [],
        createdAt: new Date(),
      };
      setSessions(prev => [tempSession, ...prev]);
      setCurrentSessionId(tempSessionId);
      console.log('Created temporary session for guest:', tempSessionId);
      return tempSessionId;
    }

    // For authenticated users, always try to create a persistent session in database
    const token = localStorage.getItem('auth-token');
    if (!token) {
      console.error('No auth token found for authenticated user');
      throw new Error('Authentication required to create sessions. Please log in again.');
    }

    const sessionId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const sessionData = {
      id: sessionId,
      name: generateSessionName(firstMessage),
      messageCount: 0,
      messages: [],
      userId: user._id || user.email,
    };

    console.log('Creating persistent session in database...');

    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(sessionData),
      });

      console.log('Session creation response:', response.status, response.ok);

      if (response.ok) {
        const persistedSession = await response.json();
        console.log('Session persisted successfully:', persistedSession);
        
        const session: ChatSession = {
          ...persistedSession,
          id: persistedSession._id || persistedSession.id,
          createdAt: new Date(persistedSession.createdAt),
        };
        
        setSessions(prev => [session, ...prev]);
        setCurrentSessionId(session.id);
        return session.id;
      } else if (response.status === 401) {
        console.error('Authentication failed during session creation');
        // Clear invalid token
        localStorage.removeItem('auth-token');
        throw new Error('Authentication expired. Please log in again.');
      } else {
        const errorText = await response.text();
        console.error('Session creation failed:', response.status, errorText);
        throw new Error(`Failed to create session: ${errorText}`);
      }
    } catch (error) {
      console.error('Error creating session:', error);
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Unable to connect to server. Please check your internet connection.');
      }
      
      throw error;
    }
  };

  const selectSession = (sessionId: string) => {
    setCurrentSessionId(sessionId);
  };

  const deleteSession = async (sessionId: string) => {
    console.log('Deleting session:', sessionId, 'User:', user ? 'authenticated' : 'guest');
    
    const sessionToDelete = sessions.find(s => s.id === sessionId);
    if (!sessionToDelete) {
      console.warn('Session not found in local state:', sessionId);
      return;
    }

    // For guests or sessions without database IDs, just remove from local state
    if (!user || !sessionToDelete._id) {
      console.log('Deleting local session (guest or temporary)');
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
      return;
    }

    // For authenticated users with persisted sessions, delete from database first
    const token = localStorage.getItem('auth-token');
    if (!token) {
      console.error('No auth token available for session deletion');
      throw new Error('Authentication required to delete session. Please log in again.');
    }

    try {
      console.log('Deleting session from database, ID:', sessionToDelete._id);
      
      const response = await fetch(`/api/sessions?id=${sessionToDelete._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('Delete response:', response.status, response.ok);

      if (response.ok) {
        console.log('Session deleted successfully from database');
      } else if (response.status === 401) {
        console.error('Authentication failed during session deletion');
        localStorage.removeItem('auth-token');
        throw new Error('Authentication expired. Please log in again.');
      } else if (response.status === 404) {
        console.warn('Session not found in database, removing from local state anyway');
      } else {
        const errorText = await response.text();
        console.error('Session deletion failed:', response.status, errorText);
        throw new Error(`Failed to delete session: ${errorText}`);
      }

      // Remove from local state after successful database operation
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
      
    } catch (error) {
      console.error('Error deleting session:', error);
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Unable to connect to server. Please check your internet connection.');
      }
      
      throw error;
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

    // Only attempt to save to database for authenticated users
    if (!user) return;

    const token = localStorage.getItem('auth-token');
    if (!token) {
      console.error('No auth token available for session update');
      throw new Error('Authentication required to save session. Please log in again.');
    }

    // Ensure we have a database ID before trying to update
    if (!session._id) {
      console.error('Session has no database ID, cannot update in database');
      throw new Error('Session not found in database. Please create a new session.');
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
        const errorText = await response.text();
        console.error('Failed to update session in database:', response.status, errorText);
        
        if (response.status === 401) {
          localStorage.removeItem('auth-token');
          throw new Error('Authentication expired. Please log in again.');
        }
        
        throw new Error(`Failed to save session: ${errorText}`);
      } else {
        console.log('Session updated successfully in database');
      }
    } catch (error) {
      console.error('Error updating session in database:', error);
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Unable to connect to server. Please check your internet connection.');
      }
      
      throw error;
    }
  };

  const getCurrentSession = (): ChatSession | null => {
    return sessions.find(session => session.id === currentSessionId) || null;
  };

  const clearAllSessions = async () => {
    console.log('Clearing all sessions, user:', user ? 'authenticated' : 'guest');
    
    // Always clear local state first for immediate UX
    setSessions([]);
    setCurrentSessionId(null);
    const sessionKey = getCurrentSessionKey();
    localStorage.removeItem(sessionKey);

    if (!user) {
      console.log('All guest sessions cleared from local state');
      return;
    }

    const token = localStorage.getItem('auth-token');
    if (!token) {
      console.warn('No auth token available, sessions cleared locally only');
      return;
    }

    try {
      // Only delete persisted sessions from MongoDB (those with _id)
      const persistedSessions = sessions.filter(session => session._id);
      
      if (persistedSessions.length === 0) {
        console.log('No persisted sessions to delete from database');
        return;
      }

      console.log(`Deleting ${persistedSessions.length} persisted sessions from database`);
      
      for (const session of persistedSessions) {
        try {
          await fetch(`/api/sessions?id=${session._id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
        } catch (error) {
          console.warn(`Failed to delete session ${session._id} from database:`, error);
          // Continue with other sessions
        }
      }
      
      console.log('All sessions cleared successfully');
    } catch (error) {
      console.warn('Error clearing sessions from database, but cleared locally:', error);
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
