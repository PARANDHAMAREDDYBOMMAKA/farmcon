'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { ConversationProvider, useConversation } from '@elevenlabs/react'
import {
  Bot,
  Headphones,
  Loader2,
  MessageCircle,
  Mic,
  MicOff,
  Send,
  Sparkles,
  UserRound,
  Volume2,
  Waves,
  X,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/cn'

type AgentUser = {
  id: string
  name: string | null
  role: string | null
  city: string | null
  state: string | null
  pending_orders?: number
  active_crops?: number
}

type Tab = 'chat' | 'voice'

type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

const welcome: ChatMessage = {
  role: 'assistant',
  content:
    "Hi, I'm FarmCon AI. Ask me anything — crop care, mandi prices, orders, or weather. Switch to Voice anytime for hands-free help.",
}

export function AIAssistant() {
  return (
    <ConversationProvider>
      <AssistantInner />
    </ConversationProvider>
  )
}

function AssistantInner() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<Tab>('chat')

  const [messages, setMessages] = useState<ChatMessage[]>([welcome])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID
  const tawkEnabled =
    typeof window !== 'undefined' &&
    !!process.env.NEXT_PUBLIC_TAWK_PROPERTY_ID

  const [voiceActive, setVoiceActive] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)
  const [agentUser, setAgentUser] = useState<AgentUser | null>(null)

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user || !active) return

        const res = await fetch('/api/elevenlabs/conversation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: 'bootstrap',
            context: pathname || '/',
            user_id: session.user.id,
          }),
        })
        if (!res.ok) return
        const data = await res.json()
        if (active && data?.user) setAgentUser(data.user as AgentUser)
      } catch (err) {
        console.error('Failed to bootstrap agent context:', err)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [pathname])

  const conversation = useConversation({
    onConnect: () => setVoiceActive(true),
    onDisconnect: () => {
      setVoiceActive(false)
      setAudioLevel(0)
    },
    onError: (err) => console.error('ElevenLabs error:', err),
    onMessage: () => {},
  })

  useEffect(() => {
    if (!voiceActive) return
    const t = setInterval(() => {
      setAudioLevel(conversation.isSpeaking ? Math.random() * 100 : Math.random() * 30)
    }, 120)
    return () => clearInterval(t)
  }, [voiceActive, conversation.isSpeaking])

  const pushContext = useCallback(async () => {
    if (!voiceActive) return
    try {
      const res = await fetch('/api/elevenlabs/conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: 'context_update',
          context: pathname || '/',
          user_id: agentUser?.id,
        }),
      })
      if (!res.ok) return
      const data = await res.json()
      if (conversation.status !== 'connected') return

      const userBit = data?.user
        ? `Signed in as ${data.user.name || 'user'} (${data.user.role}) in ${data.user.city || ''} ${data.user.state || ''}. Pending orders: ${data.user.pending_orders ?? 0}.`
        : 'Anonymous visitor.'
      const pageBit = data?.page_info
        ? `Now on ${data.page_info.name}: ${data.page_info.description}.`
        : ''
      conversation.sendContextualUpdate(`${userBit} ${pageBit}`.trim())
    } catch (err) {
      console.error('Failed to push context:', err)
    }
  }, [voiceActive, pathname, conversation, agentUser?.id])

  useEffect(() => {
    if (voiceActive) pushContext()
  }, [voiceActive, pathname, pushContext])

  useEffect(() => {
    if (!open) return
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open, tab])

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || sending) return
    const nextMessages = [...messages, { role: 'user' as const, content: text }]
    setMessages(nextMessages)
    setInput('')
    setSending(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextMessages.slice(-10),
          context: pathname || '/',
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setMessages([...nextMessages, { role: 'assistant', content: data.message }])
      } else {
        setMessages([
          ...nextMessages,
          {
            role: 'assistant',
            content:
              "Sorry, I hit a snag. Try again in a moment, or switch to Voice for a live chat.",
          },
        ])
      }
    } catch (err) {
      console.error('Chat error:', err)
      setMessages([
        ...nextMessages,
        {
          role: 'assistant',
          content:
            "Network hiccup on my end. Check your connection and try again.",
        },
      ])
    } finally {
      setSending(false)
    }
  }

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const startVoice = async () => {
    if (!agentId) {
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          content:
            "Voice agent isn't set up yet. Ask your admin to configure NEXT_PUBLIC_ELEVENLABS_AGENT_ID.",
        },
      ])
      setTab('chat')
      return
    }
    try {
      const dynamicVariables: Record<string, string | number | boolean> = {
        current_page: pathname || '/',
      }
      if (agentUser) {
        if (agentUser.id) dynamicVariables.user_id = agentUser.id
        if (agentUser.name) dynamicVariables.user_name = agentUser.name
        if (agentUser.role) dynamicVariables.user_role = agentUser.role
        if (agentUser.city) dynamicVariables.user_city = agentUser.city
        if (agentUser.state) dynamicVariables.user_state = agentUser.state
        if (typeof agentUser.pending_orders === 'number')
          dynamicVariables.pending_orders = agentUser.pending_orders
        if (typeof agentUser.active_crops === 'number')
          dynamicVariables.active_crops = agentUser.active_crops
      }

      conversation.startSession({
        agentId,
        connectionType: 'webrtc',
        dynamicVariables,
      } as any)
    } catch (err) {
      console.error('Voice start failed:', err)
    }
  }

  const endVoice = () => {
    try {
      conversation.endSession()
    } catch (err) {
      console.error('Voice end failed:', err)
    }
  }

  const openHumanSupport = () => {
    const Tawk = (typeof window !== 'undefined' ? (window as any).Tawk_API : null) as any
    if (Tawk?.maximize) {
      try {
        Tawk.showWidget?.()
        Tawk.maximize()
        setOpen(false)
        return
      } catch (err) {
        console.error('Tawk launch failed:', err)
      }
    }
    window.open('mailto:support@farmcon.in?subject=Support%20request', '_blank')
  }

  return (
    <>
      <div className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-[60]">
        {!open && (
          <button
            onClick={() => setOpen(true)}
            className="group relative w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-emerald-500 via-teal-500 to-emerald-600 shadow-2xl shadow-emerald-500/40 hover:shadow-emerald-500/60 transition-all hover:scale-105 flex items-center justify-center"
            aria-label="Open FarmCon AI assistant"
          >
            <span className="absolute inset-0 rounded-full bg-emerald-400 opacity-30 blur-xl group-hover:opacity-60 transition-opacity" />
            <Bot className="relative w-7 h-7 text-white" />
            <span className="absolute -top-1 -right-1 bg-amber-400 text-amber-950 text-[10px] font-extrabold rounded-full w-5 h-5 flex items-center justify-center shadow-lg ring-2 ring-white">
              AI
            </span>
            <span className="absolute right-full mr-3 hidden sm:flex items-center gap-1.5 bg-emerald-950 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg whitespace-nowrap opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all pointer-events-none">
              <Sparkles className="w-3 h-3 text-amber-400" />
              Chat or talk with FarmCon AI
            </span>
          </button>
        )}
      </div>

      {open && (
        <div className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-[60] w-[calc(100vw-2.5rem)] sm:w-[400px] max-w-md max-h-[calc(100vh-3rem)]">
          <div className="flex flex-col h-[620px] max-h-[calc(100vh-3rem)] rounded-3xl overflow-hidden bg-white shadow-2xl ring-1 ring-emerald-200">
            <div className="px-5 py-4 bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Bot className="w-5 h-5 text-white" />
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-300 rounded-full ring-2 ring-emerald-700 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base leading-none">FarmCon AI</h3>
                    <p className="text-[11px] text-emerald-100 mt-1 font-medium">
                      Your smart farming assistant
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="w-8 h-8 rounded-lg hover:bg-white/15 flex items-center justify-center transition-colors"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-1 p-1 bg-white/15 rounded-xl backdrop-blur-sm">
                <TabButton
                  active={tab === 'chat'}
                  onClick={() => setTab('chat')}
                  icon={MessageCircle}
                  label="Chat"
                />
                <TabButton
                  active={tab === 'voice'}
                  onClick={() => setTab('voice')}
                  icon={Mic}
                  label="Voice"
                />
              </div>
            </div>

            {tab === 'chat' ? (
              <ChatPanel
                messages={messages}
                input={input}
                onInput={setInput}
                onKey={onKey}
                onSend={sendMessage}
                sending={sending}
                onHuman={openHumanSupport}
                tawkEnabled={tawkEnabled}
                endRef={messagesEndRef}
              />
            ) : (
              <VoicePanel
                active={voiceActive}
                speaking={conversation.isSpeaking}
                audioLevel={audioLevel}
                onStart={startVoice}
                onEnd={endVoice}
                hasAgent={!!agentId}
                onSwitch={() => setTab('chat')}
              />
            )}
          </div>
        </div>
      )}
    </>
  )
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ElementType
  label: string
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all',
        active ? 'bg-white text-emerald-800 shadow-md' : 'text-white hover:bg-white/10',
      )}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </button>
  )
}

function ChatPanel({
  messages,
  input,
  onInput,
  onKey,
  onSend,
  sending,
  onHuman,
  tawkEnabled,
  endRef,
}: {
  messages: ChatMessage[]
  input: string
  onInput: (v: string) => void
  onKey: (e: React.KeyboardEvent) => void
  onSend: () => void
  sending: boolean
  onHuman: () => void
  tawkEnabled: boolean
  endRef: React.RefObject<HTMLDivElement | null>
}) {
  return (
    <>
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gradient-to-b from-white to-emerald-50/40">
        {messages.map((m, i) => (
          <div
            key={i}
            className={cn('flex items-end gap-2', m.role === 'user' ? 'justify-end' : 'justify-start')}
          >
            {m.role === 'assistant' && (
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                <Bot className="w-3.5 h-3.5 text-white" />
              </div>
            )}
            <div
              className={cn(
                'max-w-[78%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed whitespace-pre-wrap break-words',
                m.role === 'user'
                  ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-br-sm shadow-md shadow-emerald-500/20'
                  : 'bg-white ring-1 ring-emerald-100 text-emerald-950 rounded-bl-sm shadow-sm',
              )}
            >
              {m.content}
            </div>
            {m.role === 'user' && (
              <div className="w-7 h-7 rounded-lg bg-emerald-50 ring-1 ring-emerald-200 flex items-center justify-center flex-shrink-0">
                <UserRound className="w-3.5 h-3.5 text-emerald-700" />
              </div>
            )}
          </div>
        ))}
        {sending && (
          <div className="flex items-end gap-2 justify-start">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <Bot className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="bg-white ring-1 ring-emerald-100 rounded-2xl rounded-bl-sm px-4 py-2.5 shadow-sm">
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" />
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:120ms]" />
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:240ms]" />
              </div>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="border-t border-emerald-100 p-3 bg-white">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => onInput(e.target.value)}
            onKeyDown={onKey}
            placeholder="Ask about crops, prices, weather…"
            rows={1}
            disabled={sending}
            className="flex-1 resize-none max-h-28 rounded-xl border-2 border-emerald-100 px-3 py-2 text-sm text-emerald-950 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:opacity-60"
          />
          <button
            onClick={onSend}
            disabled={sending || !input.trim()}
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30 disabled:opacity-50 disabled:shadow-none hover:scale-105 transition-all flex items-center justify-center flex-shrink-0"
            aria-label="Send"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
        <div className="flex items-center justify-between mt-2 px-1">
          <span className="text-[10px] font-semibold text-slate-500">
            Powered by FarmCon AI · Context-aware
          </span>
          <button
            onClick={onHuman}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-900"
          >
            <Headphones className="w-3 h-3" />
            {tawkEnabled ? 'Talk to human' : 'Email support'}
          </button>
        </div>
      </div>
    </>
  )
}

function VoicePanel({
  active,
  speaking,
  audioLevel,
  onStart,
  onEnd,
  hasAgent,
  onSwitch,
}: {
  active: boolean
  speaking: boolean
  audioLevel: number
  onStart: () => void
  onEnd: () => void
  hasAgent: boolean
  onSwitch: () => void
}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      <div
        className={cn(
          'relative w-40 h-40 rounded-full flex items-center justify-center transition-all duration-500 mb-6',
          active
            ? 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-2xl shadow-emerald-500/40'
            : 'bg-gradient-to-br from-emerald-100 to-teal-100 shadow-lg',
        )}
      >
        {active && (
          <>
            <span className="absolute inset-0 rounded-full bg-emerald-400 opacity-30 blur-2xl animate-pulse" />
            <span
              className="absolute inset-0 rounded-full bg-white/20 transition-transform duration-150"
              style={{ transform: `scale(${1 + audioLevel / 300})` }}
            />
          </>
        )}

        {active ? (
          speaking ? (
            <Waves className="w-16 h-16 text-white animate-pulse relative" />
          ) : (
            <Mic className="w-16 h-16 text-white relative" />
          )
        ) : (
          <Mic className="w-16 h-16 text-emerald-600" />
        )}
      </div>

      <h4 className="text-lg font-extrabold text-emerald-950">
        {active ? (speaking ? 'Speaking…' : 'Listening…') : 'Voice assistant'}
      </h4>
      <p className="mt-1 text-sm text-slate-600 text-center max-w-xs">
        {active
          ? 'Talk naturally. Say things like “what’s the price of tomato in Kolar?” or “will it rain tomorrow?”'
          : hasAgent
            ? 'Start a hands-free conversation. Ask about weather, crops, or your orders — in English or Hindi.'
            : 'Voice is not configured. You can still chat in text.'}
      </p>

      {active && speaking && (
        <div className="mt-4 inline-flex items-center gap-1.5 bg-emerald-100 ring-1 ring-emerald-200 px-3 py-1 rounded-full text-xs font-bold text-emerald-800">
          <Volume2 className="w-3 h-3 animate-pulse" />
          AI is responding
        </div>
      )}

      <div className="mt-6 w-full max-w-xs space-y-2">
        {active ? (
          <button
            onClick={onEnd}
            className="w-full h-12 rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 text-white font-bold text-sm shadow-lg shadow-rose-500/30 hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
          >
            <MicOff className="w-4 h-4" />
            End conversation
          </button>
        ) : hasAgent ? (
          <button
            onClick={onStart}
            className="w-full h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold text-sm shadow-lg shadow-emerald-500/30 hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
          >
            <Mic className="w-4 h-4" />
            Start voice chat
          </button>
        ) : (
          <button
            onClick={onSwitch}
            className="w-full h-12 rounded-xl bg-emerald-50 ring-1 ring-emerald-200 text-emerald-800 font-bold text-sm flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-4 h-4" />
            Use text chat
          </button>
        )}
      </div>
    </div>
  )
}

export default AIAssistant
