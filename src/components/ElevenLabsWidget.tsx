'use client';

import { useConversation } from '@elevenlabs/react';
import { useEffect, useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { Mic, MicOff, Sparkles, Volume2, Waves } from 'lucide-react';

interface ElevenLabsWidgetProps {
  agentId?: string;
  variant?: 'floating' | 'sidebar' | 'compact';
  className?: string;
}

export default function ElevenLabsWidget({
  agentId,
  variant = 'floating',
  className = ''
}: ElevenLabsWidgetProps) {
  const pathname = usePathname();
  const effectiveAgentId = agentId || process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;
  const [isActive, setIsActive] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  const conversation = useConversation({
    onConnect: () => {
      setIsActive(true);
    },
    onDisconnect: () => {
      setIsActive(false);
      setAudioLevel(0);
    },
    onError: (error) => {
      console.error('ElevenLabs error:', error);
    },
    onMessage: () => {},
  });

  useEffect(() => {
    if (isActive) {
      const interval = setInterval(() => {
        if (conversation.isSpeaking) {
          setAudioLevel(Math.random() * 100);
        } else {
          setAudioLevel(Math.random() * 30);
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, [isActive, conversation.isSpeaking]);

  const updateAgentContext = useCallback(async () => {
    try {
      const response = await fetch('/api/elevenlabs/conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: 'get_context',
          context: pathname || '/'
        })
      });

      if (response.ok) {
        const contextData = await response.json();

        if (conversation.status === 'connected') {
          conversation.sendContextualUpdate(
            `User is now on ${contextData.page_info.name}. ${contextData.page_info.description}`
          );
        }

        if (typeof window !== 'undefined') {
          (window as any).farmConContext = {
            currentPage: pathname,
            pageInfo: contextData.page_info,
            suggestions: contextData.suggestions,
            apiEndpoint: '/api/elevenlabs/tools',
            conversationEndpoint: '/api/elevenlabs/conversation',
            timestamp: new Date().toISOString()
          };
        }
      }
    } catch (error) {
      console.error('Failed to update agent context:', error);
    }
  }, [pathname, conversation]);

  useEffect(() => {
    if (isActive && pathname) {
      updateAgentContext();
    }
  }, [isActive, pathname, updateAgentContext]);

  const startConversation = async () => {
    if (!effectiveAgentId) {
      alert('ElevenLabs agent ID is not configured. Please check your environment variables.');
      return;
    }

    try {
      await conversation.startSession({
        agentId: effectiveAgentId,
        connectionType: 'webrtc',
      });
    } catch (error) {
      console.error('Failed to start ElevenLabs conversation:', error);
      alert('Failed to start voice conversation. Please check console for details.');
    }
  };

  const endConversation = async () => {
    try {
      await conversation.endSession();
    } catch (error) {
      console.error('Failed to end ElevenLabs conversation:', error);
    }
  };

  if (!effectiveAgentId) {
    return null;
  }

  if (variant === 'sidebar') {
    return (
      <div className={`relative ${className}`}>
        <div
          className={`
            relative overflow-hidden rounded-2xl transition-all duration-500
            ${isActive
              ? 'bg-linear-to-br from-violet-600 via-purple-600 to-indigo-700'
              : 'bg-linear-to-br from-slate-800 via-slate-900 to-slate-800 hover:from-violet-900 hover:via-purple-900 hover:to-indigo-900'
            }
          `}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {isActive && (
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent" />
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="absolute bottom-0 bg-white/20 rounded-full transition-all duration-100"
                  style={{
                    left: `${15 + i * 18}%`,
                    width: '8px',
                    height: `${Math.max(10, audioLevel * (0.3 + Math.random() * 0.7))}%`,
                    transition: 'height 0.1s ease-out'
                  }}
                />
              ))}
            </div>
          )}

          <div className="relative p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className={`
                relative w-12 h-12 rounded-xl flex items-center justify-center
                ${isActive
                  ? 'bg-white/20 backdrop-blur-sm'
                  : 'bg-linear-to-br from-violet-500 to-purple-600'
                }
                transition-all duration-300
              `}>
                {isActive ? (
                  <Waves className="w-6 h-6 text-white animate-pulse" />
                ) : (
                  <Sparkles className="w-6 h-6 text-white" />
                )}
                {isActive && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-white font-semibold text-sm">AI Voice Assistant</h3>
                <p className={`text-xs ${isActive ? 'text-green-300' : 'text-slate-400'}`}>
                  {isActive
                    ? conversation.isSpeaking ? 'Speaking...' : 'Listening...'
                    : 'Click to start'
                  }
                </p>
              </div>
            </div>

            <button
              onClick={isActive ? endConversation : startConversation}
              className={`
                w-full py-3 px-4 rounded-xl font-medium text-sm
                flex items-center justify-center gap-2
                transition-all duration-300 transform
                ${isActive
                  ? 'bg-red-500/90 hover:bg-red-600 text-white hover:scale-[1.02]'
                  : 'bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm hover:scale-[1.02]'
                }
              `}
            >
              {isActive ? (
                <>
                  <MicOff className="w-4 h-4" />
                  End Conversation
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4" />
                  Start Voice Chat
                </>
              )}
            </button>

            {isActive && conversation.isSpeaking && (
              <div className="mt-3 flex items-center justify-center gap-2 text-white/80 text-xs">
                <Volume2 className="w-3 h-3 animate-pulse" />
                <span>AI is responding...</span>
              </div>
            )}
          </div>
        </div>

        {(isHovered && !isActive) && (
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-linear-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center animate-bounce shadow-lg">
            <Mic className="w-3 h-3 text-white" />
          </div>
        )}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <button
        onClick={isActive ? endConversation : startConversation}
        className={`
          relative group flex items-center gap-2 px-4 py-2 rounded-full
          transition-all duration-300 transform hover:scale-105
          ${isActive
            ? 'bg-linear-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/30'
            : 'bg-linear-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-purple-500/30'
          }
          ${className}
        `}
      >
        {isActive ? (
          <>
            <div className="relative">
              <MicOff className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            </div>
            <span className="text-sm font-medium">End</span>
          </>
        ) : (
          <>
            <Mic className="w-4 h-4 group-hover:animate-pulse" />
            <span className="text-sm font-medium">Voice</span>
          </>
        )}
      </button>
    );
  }

  return (
    <div className={`fixed bottom-6 left-6 lg:left-80 z-60 ${className}`}>
      <div
        className="relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {isHovered && !isActive && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-4 py-2 bg-slate-900 text-white text-sm rounded-xl whitespace-nowrap shadow-xl animate-fadeIn">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>Talk to AI Assistant</span>
            </div>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-3 h-3 bg-slate-900 rotate-45" />
          </div>
        )}

        {!isActive ? (
          <button
            onClick={startConversation}
            className="relative group"
          >
            <div className="absolute inset-0 bg-linear-to-r from-violet-600 to-purple-600 rounded-full blur-lg opacity-50 group-hover:opacity-80 transition-opacity duration-300 animate-pulse" />
            <div className="relative w-14 h-14 bg-linear-to-br from-violet-500 via-purple-500 to-indigo-600 rounded-full flex items-center justify-center shadow-2xl transform transition-all duration-300 group-hover:scale-110">
              <Mic className="w-6 h-6 text-white" />
              <div className="absolute inset-0 rounded-full border-2 border-white/20 group-hover:border-white/40 transition-colors duration-300" />
            </div>
          </button>
        ) : (
          <div className="relative">
            <div className="absolute -top-1 -right-1 z-10">
              <span className="relative flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500 border-2 border-white" />
              </span>
            </div>

            <button
              onClick={endConversation}
              className="relative group"
            >
              <div className="absolute inset-0 bg-linear-to-r from-red-500 to-rose-600 rounded-full blur-lg opacity-60 animate-pulse" />
              <div className="relative w-14 h-14 bg-linear-to-br from-red-500 via-rose-500 to-red-600 rounded-full flex items-center justify-center shadow-2xl transform transition-all duration-300 group-hover:scale-110">
                <MicOff className="w-6 h-6 text-white" />
              </div>
            </button>

            {conversation.isSpeaking && (
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 bg-linear-to-r from-blue-500 to-cyan-500 text-white text-xs font-medium rounded-full shadow-lg whitespace-nowrap">
                <Volume2 className="w-3 h-3 animate-pulse" />
                Speaking...
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function ElevenLabsSidebarWidget({ agentId }: { agentId?: string }) {
  return <ElevenLabsWidget agentId={agentId} variant="sidebar" />;
}

export function ElevenLabsCompactWidget({ agentId, className }: { agentId?: string; className?: string }) {
  return <ElevenLabsWidget agentId={agentId} variant="compact" className={className} />;
}
