'use client';

import React, { useState, useEffect } from 'react';
import { ChevronDown, Settings, Brain, Zap } from 'lucide-react';
import { createPortal } from 'react-dom';

export interface ModelSelection {
  mode: 'all' | 'single';
  selectedModel?: string;
}

interface ModelSelectorProps {
  selection: ModelSelection;
  onSelectionChange: (selection: ModelSelection) => void;
}

const availableModels = [
  { id: 'openai', name: 'OpenAI GPT-4o', provider: 'OpenAI', hasVision: true },
  { id: 'google', name: 'Google Gemini 1.5 Flash', provider: 'Google', hasVision: true },
  { id: 'anthropic', name: 'Anthropic Claude 3.5', provider: 'Anthropic', hasVision: true },
  { id: 'cohere', name: 'Cohere Command', provider: 'Cohere', hasVision: false },
  { id: 'mistral', name: 'Mistral Large', provider: 'Mistral', hasVision: false },
  { id: 'learning-ai', name: 'AISync Nexus', provider: 'AISync', hasVision: true, isLearning: true },
];

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  selection,
  onSelectionChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [buttonRect, setButtonRect] = useState<DOMRect | null>(null);
  const [buttonRef, setButtonRef] = useState<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (isOpen && buttonRef) {
      // Use viewport coordinates for fixed positioning
      const rect = buttonRef.getBoundingClientRect();
      console.log('Button rect:', {
        top: rect.top,
        bottom: rect.bottom,
        left: rect.left,
        right: rect.right,
        width: rect.width,
        height: rect.height
      });
      console.log('Window dimensions:', {
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight
      });
      setButtonRect(rect);
    }
  }, [isOpen, buttonRef]);

  useEffect(() => {
    const updatePosition = () => {
      if (buttonRef) {
        // Use viewport coordinates for fixed positioning
        setButtonRect(buttonRef.getBoundingClientRect());
      }
    };

    const handleResize = () => {
      if (isOpen) {
        updatePosition();
      }
    };

    const handleScroll = () => {
      if (isOpen) {
        updatePosition();
      }
    };

    if (isOpen) {
      window.addEventListener('resize', handleResize);
      window.addEventListener('scroll', handleScroll);
      
      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('scroll', handleScroll);
      };
    }
  }, [isOpen, buttonRef]);

  const handleModeChange = (mode: 'all' | 'single') => {
    if (mode === 'all') {
      onSelectionChange({ mode: 'all' });
    } else {
      onSelectionChange({ 
        mode: 'single', 
        selectedModel: selection.selectedModel || 'openai' 
      });
    }
    setIsOpen(false);
  };

  const handleModelChange = (modelId: string) => {
    onSelectionChange({ 
      mode: 'single', 
      selectedModel: modelId 
    });
    setIsOpen(false);
  };

  const getDisplayText = () => {
    if (selection.mode === 'all') {
      return 'All AI Models';
    } else {
      const model = availableModels.find(m => m.id === selection.selectedModel);
      return model ? model.name : 'Select Model';
    }
  };

  const getDisplayIcon = () => {
    if (selection.mode === 'all') {
      return <Brain className="w-4 h-4" />;
    } else {
      return <Zap className="w-4 h-4" />;
    }
  };

  return (
    <>
      <button
        ref={setButtonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 glass border border-glass rounded-lg hover:border-accent transition-colors text-text"
      >
        {getDisplayIcon()}
        <span className="text-sm font-medium">{getDisplayText()}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && buttonRect && typeof document !== 'undefined' && createPortal(
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[9998]"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Menu */}
          <div 
            className="fixed glass border border-glass rounded-lg shadow-2xl overflow-hidden backdrop-blur-xl bg-surface/98 border-accent/20"
            style={{
              top: (() => {
                const dropdownHeight = 400;
                const spaceBelow = window.innerHeight - buttonRect.bottom;
                const spaceAbove = buttonRect.top;
                
                if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
                  const finalTop = buttonRect.top - dropdownHeight;
                  console.log('Positioning above - Final top:', finalTop);
                  return `${finalTop}px`;
                }
                
                const finalTop = buttonRect.bottom;
                console.log('Positioning below - Final top:', finalTop, 'Button bottom was:', buttonRect.bottom);
                return `${finalTop}px`;
              })(),
              left: (() => {
                const finalLeft = buttonRect.left;
                console.log('Final left:', finalLeft, 'Button left was:', buttonRect.left);
                return `${finalLeft}px`;
              })(),
              width: Math.max(buttonRect.width, 256) + 'px',
              maxHeight: '400px',
              overflowY: 'auto',
              zIndex: 9999,
              position: 'fixed', // Ensure it's definitely fixed
              transform: 'none', // Prevent any transforms
            }}
          >
            {/* All Models Option */}
            <button
              onClick={() => handleModeChange('all')}
              className={`w-full px-4 py-3 text-left hover:bg-accent/10 transition-colors border-b border-glass ${
                selection.mode === 'all' ? 'bg-accent/20 border-l-4 border-l-accent' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <Brain className="w-5 h-5 text-accent" />
                <div>
                  <div className="font-medium text-text">All AI Models</div>
                  <div className="text-xs text-text-secondary">
                    Query multiple models and get aggregated results
                  </div>
                </div>
              </div>
            </button>

            {/* Individual Models */}
            <div className="py-2">
              <div className="px-4 py-2 text-xs font-semibold text-text-secondary uppercase tracking-wide">
                Individual Models
              </div>
              
              {availableModels.map((model) => (
                <button
                  key={model.id}
                  onClick={() => handleModelChange(model.id)}
                  className={`w-full px-4 py-3 text-left hover:bg-accent/10 transition-colors ${
                    selection.mode === 'single' && selection.selectedModel === model.id
                      ? 'bg-accent/20 border-l-4 border-l-accent'
                      : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {model.isLearning ? (
                      <Brain className="w-4 h-4 text-purple-400" />
                    ) : (
                      <Zap className="w-4 h-4 text-accent-secondary" />
                    )}
                    <div className="flex-1">
                      <div className="font-medium text-text">{model.name}</div>
                      <div className="flex items-center gap-2 text-xs text-text-secondary">
                        <span>{model.provider}</span>
                        {model.hasVision && (
                          <span className="px-2 py-0.5 bg-accent/20 text-accent rounded-full text-xs">
                            Vision
                          </span>
                        )}
                        {model.isLearning && (
                          <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded-full text-xs">
                            Learning
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  );
};
