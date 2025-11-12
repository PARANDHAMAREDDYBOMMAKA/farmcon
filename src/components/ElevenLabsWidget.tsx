'use client';

import { useConversation } from '@elevenlabs/react';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

interface ElevenLabsWidgetProps {
  agentId?: string;
}

export default function ElevenLabsWidget({ agentId }: ElevenLabsWidgetProps) {
  const pathname = usePathname();
  const effectiveAgentId = agentId || process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;
  const [isActive, setIsActive] = useState(false);

  // Debug log
  useEffect(() => {
    console.log('🔍 ElevenLabsWidget mounted, agent ID:', effectiveAgentId ? 'configured' : 'missing');
  }, []);

  const conversation = useConversation({
    onConnect: () => {
      console.log('✅ ElevenLabs Conversational AI connected');
      setIsActive(true);
    },
    onDisconnect: () => {
      console.log('📴 ElevenLabs Conversational AI disconnected');
      setIsActive(false);
    },
    onError: (error) => {
      console.error('❌ ElevenLabs error:', error);
    },
    onMessage: (message) => {
      console.log('💬 ElevenLabs message:', message);
    },
  });

  // Update context when pathname changes
  useEffect(() => {
    if (isActive && pathname) {
      updateAgentContext();
    }
  }, [isActive, pathname]);

  /**
   * Update the ElevenLabs agent with current application context
   */
  const updateAgentContext = async () => {
    try {
      // Fetch context from our API
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
        console.log('📍 Context updated for ElevenLabs agent:', contextData.page_info);

        // Send contextual update to the agent
        if (conversation.status === 'connected') {
          conversation.sendContextualUpdate(
            `User is now on ${contextData.page_info.name}. ${contextData.page_info.description}`
          );
        }

        // Store context in window for agent access
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
      console.error('❌ Failed to update agent context:', error);
    }
  };

  const startConversation = async () => {
    if (!effectiveAgentId) {
      console.warn('⚠️ ElevenLabs agent ID not configured');
      alert('ElevenLabs agent ID is not configured. Please check your environment variables.');
      return;
    }

    try {
      console.log('🎙️ Starting ElevenLabs conversation...');
      await conversation.startSession({
        agentId: effectiveAgentId,
        connectionType: 'webrtc', // or 'websocket'
      });
    } catch (error) {
      console.error('❌ Failed to start ElevenLabs conversation:', error);
      alert('Failed to start voice conversation. Please check console for details.');
    }
  };

  const endConversation = async () => {
    try {
      console.log('🛑 Ending ElevenLabs conversation...');
      await conversation.endSession();
    } catch (error) {
      console.error('❌ Failed to end ElevenLabs conversation:', error);
    }
  };

  // Don't render if agent ID is not configured
  if (!effectiveAgentId) {
    console.warn('⚠️ ElevenLabs Widget: Agent ID not configured, widget will not render');
    return null;
  }

  return (
    <>
      {/* Widget Button - Bottom Left (adjusted for dashboard sidebar) */}
      <div className="fixed bottom-4 left-4 sm:bottom-6 sm:left-6 lg:left-80 z-[60]">
        {!isActive ? (
          <button
            onClick={startConversation}
            className="relative bg-gradient-to-br from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 text-white rounded-full p-4 sm:p-5 shadow-2xl transition-all duration-300 transform hover:scale-110 group"
            aria-label="Start voice conversation"
            title="Talk to AI Assistant"
          >
            <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
            <span className="absolute inset-0 rounded-full bg-purple-400 opacity-0 group-hover:opacity-30 blur-xl transition-opacity duration-300"></span>
          </button>
        ) : (
          <div className="relative">
            {/* Active indicator with pulsing animation */}
            <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-pulse">
              ●
            </div>
            <button
              onClick={endConversation}
              className="relative bg-gradient-to-br from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 text-white rounded-full p-4 sm:p-5 shadow-2xl transition-all duration-300 transform hover:scale-110 group"
              aria-label="End voice conversation"
              title="End conversation"
            >
              <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Status indicator when speaking */}
        {isActive && conversation.isSpeaking && (
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white text-xs px-3 py-1 rounded-full whitespace-nowrap">
            AI Speaking...
          </div>
        )}
      </div>
    </>
  );
}
