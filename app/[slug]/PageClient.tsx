'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import {
  Send, Flame, Clock, ShieldCheck, CheckCircle, ArrowRight,
  Heart, Gift, HelpCircle, Copy, Check, Ghost, Lock,
  Plus, type LucideIcon
} from 'lucide-react'
import { Page, Message, Mode, MODE_CONFIG } from '@/lib/types'
import MessageCard from '@/components/MessageCard'
import ViralCTA from '@/components/ViralCTA'
import ToastStack, { ToastItem } from '@/components/Toast'
import { supabase } from '@/lib/supabase'

const MODE_ICONS: Record<Mode, LucideIcon> = {
  roast: Flame,
  confess: Heart,
  birthday: Gift,
  ama: HelpCircle,
}

const MODE_ICON_COLORS: Record<Mode, string> = {
  roast: '#f97316',
  confess: '#ec4899',
  birthday: '#eab308',
  ama: '#06b6d4',
}

interface Props {
  page: Page
  initialCount: number
  isOwner: boolean
}

function useFeed(pageId: string) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async (showLoader = false) => {
    if (showLoader) setLoading(true)
    const res = await fetch(`/api/messages?page_id=${pageId}`)
    if (res.ok) setMessages(await res.json())
    if (showLoader) setLoading(false)
  }, [pageId])

  const bumpReaction = useCallback((messageId: string) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId ? { ...m, total_reactions: m.total_reactions + 1 } : m
      )
    )
  }, [])

  // Poll every 5 seconds to pick up new messages, reactions and replies
  useEffect(() => {
    const interval = setInterval(() => { load() }, 5000)
    return () => clearInterval(interval)
  }, [load])

  return { messages, setMessages, loading, load, bumpReaction }
}

function scrollToMessage(messageId: string) {
  const el = document.getElementById(`msg-${messageId}`)
  if (!el) return
  el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  el.classList.remove('msg-highlight')
  void el.offsetWidth // force reflow to restart animation
  el.classList.add('msg-highlight')
  setTimeout(() => el.classList.remove('msg-highlight'), 2200)
}

/* ─── OWNER VIEW ─────────────────────────────────────── */
function OwnerView({ page }: { page: Page }) {
  const cfg = MODE_CONFIG[page.mode]
  const Icon = MODE_ICONS[page.mode]
  const { messages, loading, load, bumpReaction } = useFeed(page.id)
  const [sortBy, setSortBy] = useState<'hot' | 'latest'>('latest')
  const [copied, setCopied] = useState(false)
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const prevRef = useRef<Message[]>([])

  const pageUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/${page.slug}`
    : `/${page.slug}`

  useEffect(() => { load(true) }, [load])

  // Detect changes from poll and fire toasts
  useEffect(() => {
    if (messages.length === 0) return
    const prev = prevRef.current
    if (prev.length === 0) { prevRef.current = messages; return }

    const newToasts: ToastItem[] = []
    messages.forEach((msg) => {
      const old = prev.find((p) => p.id === msg.id)
      if (!old) {
        newToasts.push({ id: crypto.randomUUID(), messageId: msg.id, type: 'message', text: 'New message received' })
      } else {
        if (msg.replies.length > old.replies.length) {
          newToasts.push({ id: crypto.randomUUID(), messageId: msg.id, type: 'reply', text: 'New reply on a message' })
        }
        if (msg.total_reactions > old.total_reactions) {
          const newest = msg.reactions.find((r) => {
            const prev = old.reactions.find((x) => x.emoji === r.emoji)
            return !prev || r.count > prev.count
          })
          newToasts.push({ id: crypto.randomUUID(), messageId: msg.id, type: 'reaction', emoji: newest?.emoji, text: 'Someone reacted to a message' })
        }
      }
    })

    if (newToasts.length > 0) setToasts((t) => [...t, ...newToasts].slice(-5))
    prevRef.current = messages
  }, [messages])

  function dismissToast(id: string) {
    setToasts((t) => t.filter((x) => x.id !== id))
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(pageUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const sorted = useMemo(() => {
    return [...messages].sort((a, b) => {
      if (sortBy === 'hot') {
        return b.replies.length - a.replies.length ||
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  }, [messages, sortBy])

  return (
    <div className="min-h-screen bg-dot-pattern">
      {/* Top bar */}
      <div className="border-b border-white/5 px-5 py-4 flex items-center justify-between">
        <a href="/" className="text-white/40 hover:text-white/70 text-sm font-semibold transition-colors">
          whispr
        </a>
        {/* Link + copy in top right */}
        <div className="flex items-center gap-2">
          <span className="text-white/30 text-xs font-mono hidden sm:block truncate max-w-[220px]">
            {pageUrl}
          </span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-white/10 text-white/60 hover:text-white hover:border-white/20 transition-all"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied!' : 'Copy link'}
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Profile header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-black border border-white/10 flex items-center justify-center flex-shrink-0">
            <Icon className="w-7 h-7" style={{ color: MODE_ICON_COLORS[page.mode] }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{page.name}</h1>
            <span className={`text-xs font-medium ${cfg.color} opacity-70`}>{cfg.label}</span>
          </div>
          <a
            href="/"
            className="ml-auto flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-white/10 text-white/50 hover:text-white hover:border-white/20 transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> New link
          </a>
        </div>

        {/* Sort tabs + count */}
        <div className="flex items-center gap-2 mb-5">
          <button onClick={() => setSortBy('latest')} className={`tab-btn ${sortBy === 'latest' ? 'active' : ''}`}>
            <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Latest</span>
          </button>
          <button onClick={() => setSortBy('hot')} className={`tab-btn ${sortBy === 'hot' ? 'active' : ''}`}>
            <span className="flex items-center gap-1.5"><Flame className="w-3.5 h-3.5" /> Hot</span>
          </button>
          <span className="text-white/30 text-xs ml-auto">
            {messages.length} message{messages.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Feed */}
        {loading ? (
          <div className="text-center py-20">
            <p className="text-white/30 text-sm">Loading messages...</p>
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-black border border-white/10 mb-4">
              <Ghost className="w-8 h-8 text-white/30" />
            </div>
            <p className="text-white/50 font-medium mb-1">No messages yet</p>
            <p className="text-white/30 text-sm">Share your link and wait for people to send messages</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sorted.map((msg) => (
              <MessageCard key={msg.id} message={msg} onReactionAdded={bumpReaction} />
            ))}
          </div>
        )}
      </div>
      <ToastStack toasts={toasts} onDismiss={dismissToast} onScrollTo={scrollToMessage} />
    </div>
  )
}

/* ─── VISITOR VIEW ───────────────────────────────────── */
export default function PageClient({ page, initialCount, isOwner }: Props) {
  if (isOwner) return <OwnerView page={page} />

  const cfg = MODE_CONFIG[page.mode]
  const Icon = MODE_ICONS[page.mode]

  const [messageText, setMessageText] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [feedVisible, setFeedVisible] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [sortBy, setSortBy] = useState<'hot' | 'latest'>('latest')
  const [promptIndex, setPromptIndex] = useState(0)
  const [count, setCount] = useState(initialCount)
  const feedRef = useRef<HTMLDivElement>(null)
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const prevRef = useRef<Message[]>([])

  const { messages, loading, load, bumpReaction } = useFeed(page.id)

  // Restore feed visibility after reload
  useEffect(() => {
    const key = `whispr_sent_${page.id}`
    if (sessionStorage.getItem(key)) {
      setSubmitted(true)
      setFeedVisible(true)
      load(true)
    }
  }, [page.id, load])

  // Detect changes from poll and fire toasts (only when feed is visible)
  useEffect(() => {
    if (!feedVisible || messages.length === 0) return
    const prev = prevRef.current
    if (prev.length === 0) { prevRef.current = messages; return }

    const newToasts: ToastItem[] = []
    messages.forEach((msg) => {
      const old = prev.find((p) => p.id === msg.id)
      if (!old) {
        newToasts.push({ id: crypto.randomUUID(), messageId: msg.id, type: 'message', text: 'New message added' })
      } else {
        if (msg.replies.length > old.replies.length) {
          newToasts.push({ id: crypto.randomUUID(), messageId: msg.id, type: 'reply', text: 'New reply on a message' })
        }
        if (msg.total_reactions > old.total_reactions) {
          const newest = msg.reactions.find((r) => {
            const oldR = old.reactions.find((x) => x.emoji === r.emoji)
            return !oldR || r.count > oldR.count
          })
          newToasts.push({ id: crypto.randomUUID(), messageId: msg.id, type: 'reaction', emoji: newest?.emoji, text: 'Someone reacted to a message' })
        }
      }
    })

    if (newToasts.length > 0) setToasts((t) => [...t, ...newToasts].slice(-5))
    prevRef.current = messages
  }, [messages, feedVisible])

  function dismissToast(id: string) {
    setToasts((t) => t.filter((x) => x.id !== id))
  }

  useEffect(() => {
    if (submitted) return
    const interval = setInterval(() => {
      setPromptIndex((i) => (i + 1) % cfg.prompts.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [submitted, cfg.prompts.length])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!messageText.trim() || sending) return
    setSending(true)
    setError('')

    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ page_id: page.id, content: messageText.trim() }),
    })

    if (res.ok) {
      setSubmitted(true)
      setFeedVisible(true)
      sessionStorage.setItem(`whispr_sent_${page.id}`, '1')
      setCount((c) => c + 1)
      await load(true)
      setTimeout(() => feedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300)
    } else {
      const { error: err } = await res.json()
      setError(err || 'Something went wrong, try again')
    }
    setSending(false)
  }

  async function handleViewMessages() {
    setFeedVisible(true)
    if (messages.length === 0) await load(true)
  }

  const sortedMessages = useMemo(() => {
    return [...messages].sort((a, b) => {
      if (sortBy === 'hot') {
        return b.replies.length - a.replies.length ||
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  }, [messages, sortBy])

  return (
    <div className="min-h-screen bg-dot-pattern">
      {/* Top nav */}
      <div className="text-center pt-8 pb-2">
        <a href="/" className="text-white/30 hover:text-white/60 text-sm transition-colors font-semibold tracking-wide">
          whispr
        </a>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-4 md:py-8">
        <div className="flex flex-col md:flex-row gap-6 items-start">

          {/* ── LEFT COLUMN ── */}
          <div className="w-full md:w-[360px] md:flex-shrink-0 md:sticky md:top-8">
            {/* Profile header */}
            <div className="text-center mb-5">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-black border border-white/10 mb-3">
                <Icon className="w-8 h-8" style={{ color: MODE_ICON_COLORS[page.mode] }} />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">{page.name}</h1>
              <span className={`inline-block text-xs font-medium px-3 py-1 rounded-full border ${cfg.color} border-current opacity-70`}>
                {cfg.label}
              </span>
              {count > 0 && (
                <p className="text-white/40 text-sm mt-3 flex items-center justify-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 pulse-dot inline-block" />
                  {count} {count === 1 ? 'person has' : 'people have'} already sent a message
                </p>
              )}
            </div>

            {/* Form / Success card */}
            {!submitted ? (
              <div className="card fade-up">
                <form onSubmit={handleSend}>
                  <p className="text-white/40 text-sm mb-3 min-h-[20px]">
                    {cfg.prompts[promptIndex]}
                  </p>
                  <textarea
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder={`Write something to ${page.name}...`}
                    maxLength={500}
                    rows={4}
                    className="input-field resize-none mb-2"
                  />
                  {/* Starter chips */}
                  {!messageText && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {cfg.starters.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setMessageText(s)}
                          className="starter-chip"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-white/25 text-xs">{messageText.length}/500</span>
                    {error && <span className="text-red-400 text-xs">{error}</span>}
                  </div>
                  <button
                    type="submit"
                    disabled={!messageText.trim() || sending}
                    className="btn-primary w-full py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    {sending ? 'Sending...' : 'Send anonymously'}
                  </button>
                </form>
                <p className="text-white/25 text-xs flex items-center justify-center gap-1 mt-3">
                  <ShieldCheck className="w-3 h-3" /> Your identity is never revealed
                </p>
              </div>
            ) : (
              <div className="card text-center fade-up">
                <div className="flex justify-center mb-3">
                  <CheckCircle className="w-10 h-10 text-green-400" />
                </div>
                <h2 className="text-white font-bold text-lg mb-1">Message delivered!</h2>
                <p className="text-white/40 text-sm mb-5">Nobody knows it was you</p>
                {!feedVisible ? (
                  <button
                    onClick={handleViewMessages}
                    className="btn-primary w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
                  >
                    See what others said <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <p className="text-white/30 text-xs">Viewing the feed →</p>
                )}
              </div>
            )}

            {/* Viral CTA — desktop only on left */}
            <div className="hidden md:block mt-4">
              <ViralCTA />
            </div>
          </div>

          {/* ── RIGHT COLUMN — Feed ── */}
          <div className="flex-1 min-w-0" ref={feedRef}>
            {!feedVisible ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-black border border-white/10 mb-4">
                  <Lock className="w-7 h-7 text-white/30" />
                </div>
                <p className="text-white/50 font-medium mb-1">Messages are hidden</p>
                <p className="text-white/30 text-sm">Send a message to unlock the feed</p>
              </div>
            ) : (
              <div className="fade-up">
                <div className="flex items-center gap-2 mb-5">
                  <button onClick={() => setSortBy('hot')} className={`tab-btn ${sortBy === 'hot' ? 'active' : ''}`}>
                    <span className="flex items-center gap-1.5"><Flame className="w-3.5 h-3.5" /> Hot</span>
                  </button>
                  <button onClick={() => setSortBy('latest')} className={`tab-btn ${sortBy === 'latest' ? 'active' : ''}`}>
                    <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Latest</span>
                  </button>
                  <span className="text-white/30 text-xs ml-auto">
                    {messages.length} message{messages.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {loading ? (
                  <div className="text-center py-16">
                    <p className="text-white/30 text-sm">Loading messages...</p>
                  </div>
                ) : sortedMessages.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-black border border-white/10 mb-4">
                      <Ghost className="w-7 h-7 text-white/30" />
                    </div>
                    <p className="text-white/50">No messages yet — be the first!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sortedMessages.map((msg) => (
                      <MessageCard key={msg.id} message={msg} onReactionAdded={bumpReaction} />
                    ))}
                  </div>
                )}

                {/* Viral CTA — mobile */}
                <div className="md:hidden mt-6">
                  <ViralCTA />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <ToastStack toasts={toasts} onDismiss={dismissToast} onScrollTo={scrollToMessage} />
    </div>
  )
}
