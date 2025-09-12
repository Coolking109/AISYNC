import React, { useState } from 'react';
import { ChatMessage as ChatMessageType } from '@/lib/types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Image, FileText, File, Download, ThumbsUp, ThumbsDown, Brain } from 'lucide-react';

interface ChatMessageProps {
  message: ChatMessageType;
  isStreaming?: boolean;
  onFeedback?: (messageId: string, feedback: 'positive' | 'negative' | 'neutral') => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, isStreaming, onFeedback }) => {
  const isUser = message.role === 'user';
  const [feedbackGiven, setFeedbackGiven] = useState<'positive' | 'negative' | null>(null);
  const isSelfDevelopingAI = message.model === 'custom-ai';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-6 animate-slide-up`}>
      <div
        className={`max-w-3xl px-6 py-4 rounded-2xl backdrop-blur-sm transition-all duration-200 hover:scale-[1.01] ${
          isUser
            ? 'bg-gradient-to-r from-accent to-accent-secondary text-white ml-12 shadow-neon'
            : 'glass text-text mr-12 border border-glass hover:shadow-glass'
        }`}
      >
        {!isUser && (
          <div className="flex items-center mb-3">
            <div className="w-2 h-2 bg-accent rounded-full mr-2 animate-pulse-slow"></div>
            <span className="text-sm gradient-text font-medium">
              {message.model || 'AI Assistant'}
            </span>
            {isSelfDevelopingAI && (
              <div className="ml-2 flex items-center">
                <Brain className="w-4 h-4 text-accent-secondary" />
                <span className="text-xs text-accent-secondary ml-1">Learning AI</span>
              </div>
            )}
          </div>
        )}
        
        {/* Display attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="mb-4 space-y-2">
            {message.attachments.map((attachment) => (
              <div key={attachment.id} className="flex items-center gap-3 p-3 glass rounded-lg border border-glass">
                {attachment.type.startsWith('image/') ? (
                  <div className="flex-shrink-0">
                    <Image className="w-5 h-5 text-accent" />
                  </div>
                ) : attachment.type.includes('text') || attachment.type.includes('json') ? (
                  <div className="flex-shrink-0">
                    <FileText className="w-5 h-5 text-accent" />
                  </div>
                ) : (
                  <div className="flex-shrink-0">
                    <File className="w-5 h-5 text-accent" />
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-text truncate">
                    {attachment.name}
                  </div>
                  <div className="text-xs text-text-secondary">
                    {(attachment.size / 1024).toFixed(1)} KB
                  </div>
                </div>
                
                {attachment.type.startsWith('image/') && attachment.base64 && (
                  <div className="flex-shrink-0">
                    <img
                      src={attachment.base64}
                      alt={attachment.name}
                      className="w-16 h-16 object-cover rounded-lg border border-glass"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="prose prose-invert max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ node, className, children, ...props }: any) {
                const match = /language-(\w+)/.exec(className || '');
                const inline = props.inline;
                return !inline && match ? (
                  <SyntaxHighlighter
                    style={oneDark}
                    language={match[1]}
                    PreTag="div"
                    {...props}
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                ) : (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              },
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>

        {message.sources && message.sources.length > 0 && (
          <div className="mt-4 pt-3 border-t border-glass">
            <div className="space-y-2">
              {message.sources.map((source, index) => (
                <a
                  key={index}
                  href={source}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm text-accent hover:text-accent-secondary transition-colors duration-200 truncate glass px-2 py-1 rounded-lg hover:shadow-neon"
                >
                  {source}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Feedback buttons for AI responses */}
        {!isUser && !isStreaming && onFeedback && (
          <div className="mt-4 pt-3 border-t border-glass/50">
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-secondary">
                {isSelfDevelopingAI ? 'Help me learn:' : 'Was this helpful?'}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    onFeedback(message.id, 'positive');
                    setFeedbackGiven('positive');
                  }}
                  disabled={feedbackGiven !== null}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    feedbackGiven === 'positive' 
                      ? 'bg-green-500/20 text-green-400' 
                      : feedbackGiven 
                        ? 'opacity-50 cursor-not-allowed' 
                        : 'glass hover:bg-green-500/10 hover:text-green-400'
                  }`}
                  title="This was helpful"
                >
                  <ThumbsUp className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    onFeedback(message.id, 'negative');
                    setFeedbackGiven('negative');
                  }}
                  disabled={feedbackGiven !== null}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    feedbackGiven === 'negative' 
                      ? 'bg-red-500/20 text-red-400' 
                      : feedbackGiven 
                        ? 'opacity-50 cursor-not-allowed' 
                        : 'glass hover:bg-red-500/10 hover:text-red-400'
                  }`}
                  title="This needs improvement"
                >
                  <ThumbsDown className="w-4 h-4" />
                </button>
              </div>
            </div>
            {feedbackGiven && (
              <div className="mt-2">
                <span className="text-xs text-accent">
                  {feedbackGiven === 'positive' 
                    ? (isSelfDevelopingAI ? '✨ Thanks! I\'m learning from this.' : '✨ Thank you for the feedback!')
                    : (isSelfDevelopingAI ? '🔄 I\'ll improve this response.' : '🔄 Thanks, we\'ll work on improving this.')
                  }
                </span>
              </div>
            )}
          </div>
        )}

        {isStreaming && (
          <div className="mt-3">
            <div className="flex space-x-2">
              <div className="w-3 h-3 bg-gradient-to-r from-accent to-accent-secondary rounded-full animate-bounce"></div>
              <div className="w-3 h-3 bg-gradient-to-r from-accent-secondary to-accent-tertiary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-3 h-3 bg-gradient-to-r from-accent-tertiary to-accent rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
