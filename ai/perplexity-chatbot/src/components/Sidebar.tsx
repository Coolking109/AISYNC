'use client';

import React, { useState } from 'react';
import { Plus, MessageSquare, Trash2, Edit3, Check, X } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

interface ChatSession {
  id: string;
  name: string;
  createdAt: Date;
  lastMessage?: string;
  messageCount: number;
}

interface SidebarProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSessionSelect: (sessionId: string) => void;
  onNewSession: () => Promise<string>;
  onDeleteSession: (sessionId: string) => void;
  onRenameSession: (sessionId: string, newName: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  currentSessionId,
  onSessionSelect,
  onNewSession,
  onDeleteSession,
  onRenameSession,
}) => {
  const { t } = useTranslation();
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const handleEditStart = (session: ChatSession) => {
    setEditingSessionId(session.id);
    setEditingName(session.name);
  };

  const handleEditSave = () => {
    if (editingSessionId && editingName.trim()) {
      onRenameSession(editingSessionId, editingName.trim());
    }
    setEditingSessionId(null);
    setEditingName('');
  };

  const handleEditCancel = () => {
    setEditingSessionId(null);
    setEditingName('');
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="w-64 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-glass">
        <button
          onClick={onNewSession}
          className="w-full bg-gradient-to-r from-accent to-accent-secondary hover:shadow-neon text-white px-4 py-3 rounded-xl flex items-center justify-center space-x-2 transition-all duration-200 hover:scale-105 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span className="font-medium">{t('newChat')}</span>
        </button>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="space-y-1">
          {sessions.map((session) => (
            <div
              key={session.id}
              className={`group p-3 rounded-xl cursor-pointer transition-all duration-200 hover:scale-[1.02] ${
                currentSessionId === session.id
                  ? 'glass border border-accent shadow-neon bg-accent/10'
                  : 'hover:glass hover:border-glass'
              }`}
              onClick={() => onSessionSelect(session.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  {editingSessionId === session.id ? (
                    <div className="flex items-center space-x-1">
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="flex-1 glass text-text text-sm px-2 py-1 rounded-lg border border-glass focus:outline-none focus:border-accent focus:shadow-neon transition-all duration-200"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleEditSave();
                          if (e.key === 'Escape') handleEditCancel();
                        }}
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditSave();
                        }}
                        className="text-green-400 hover:text-green-300 p-1"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditCancel();
                        }}
                        className="text-red-400 hover:text-red-300 p-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center space-x-2 mb-1">
                        <MessageSquare className="w-4 h-4 text-accent flex-shrink-0 animate-pulse-slow" />
                        <h3 className="text-sm font-medium gradient-text truncate">
                          {session.name}
                        </h3>
                      </div>
                      <p className="text-xs text-text-secondary mb-1">
                        {formatDate(session.createdAt)}
                      </p>
                      {session.lastMessage && (
                        <p className="text-xs text-text-secondary truncate">
                          {session.lastMessage}
                        </p>
                      )}
                      <p className="text-xs text-text-secondary">
                        {session.messageCount} messages
                      </p>
                    </>
                  )}
                </div>

                {editingSessionId !== session.id && (
                  <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditStart(session);
                      }}
                      className="text-gray-400 hover:text-accent p-1"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSession(session.id);
                      }}
                      className="text-gray-400 hover:text-red-400 p-1"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {sessions.length === 0 && (
          <div className="text-center py-8 text-text-secondary animate-fade-in">
            <div className="glass rounded-xl p-6">
              <MessageSquare className="w-8 h-8 mx-auto mb-3 opacity-50 animate-float" />
              <p className="text-sm gradient-text font-medium">{t('noChatSessions')}</p>
              <p className="text-xs">{t('startNewConversation')}</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-glass">
        <div className="glass rounded-lg px-3 py-2">
          <div className="text-xs gradient-text text-center font-medium">
            {sessions.length} session{sessions.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>
    </div>
  );
};
