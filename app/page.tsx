'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  Copy, Check, Link2, Flame, Heart, Gift, HelpCircle,
  MessageSquare, PartyPopper, Search, BookmarkCheck,
  CheckCircle, XCircle, Loader, type LucideIcon
} from 'lucide-react'
import Confetti from '@/components/Confetti'
import { Mode, MODE_CONFIG } from '@/lib/types'

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

const MODES: Mode[] = ['roast', 'confess', 'birthday', 'ama']

type AvailState = 'idle' | 'checking' | 'available' | 'taken' | 'too-short'

export default function HomePage() {
  const [username, setUsername] = useState('')
  const [mode, setMode] = useState<Mode>('confess')
  const [loading, setLoading] = useState(false)
  const [createError, setCreateError] = useState('')
  const [createdSlug, setCreatedSlug] = useState<string | null>(null)
  const [ownerToken, setOwnerToken] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [ownerCopied, setOwnerCopied] = useState(false)
  const [avail, setAvail] = useState<AvailState>('idle')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Find my page
  const [showFind, setShowFind] = useState(false)
  const [findUsername, setFindUsername] = useState('')
  const [finding, setFinding] = useState(false)
  const [findError, setFindError] = useState('')

  const siteUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const shareLink = createdSlug ? `${siteUrl}/${createdSlug}` : ''
  const ownerLink = createdSlug && ownerToken ? `${siteUrl}/${createdSlug}?token=${ownerToken}` : ''

  // Real-time username availability check
  useEffect(() => {
    if (!username.trim()) { setAvail('idle'); return }
    if (username.trim().length < 2) { setAvail('too-short'); return }

    setAvail('checking')
    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(async () => {
      const res = await fetch(`/api/check-username?username=${encodeURIComponent(username)}`)
      const { available } = await res.json()
      setAvail(available ? 'available' : 'taken')
    }, 500)

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [username])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!username.trim() || loading || avail !== 'available') return
    setLoading(true)
    setCreateError('')

    const res = await fetch('/api/pages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: username.trim(), mode }),
    })

    if (res.ok) {
      const page = await res.json()
      setCreatedSlug(page.slug)
      setOwnerToken(page.owner_token)
      // Save owner link to localStorage so "find my page" works on this device
      const saved = JSON.parse(localStorage.getItem('whispr_owner_links') || '{}')
      saved[page.slug] = `${window.location.origin}/${page.slug}?token=${page.owner_token}`
      localStorage.setItem('whispr_owner_links', JSON.stringify(saved))
    } else {
      const { error } = await res.json()
      setCreateError(error || 'Something went wrong')
      setAvail('taken')
    }
    setLoading(false)
  }

  async function handleCopyShare() {
    await navigator.clipboard.writeText(shareLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleCopyOwner() {
    await navigator.clipboard.writeText(ownerLink)
    setOwnerCopied(true)
    setTimeout(() => setOwnerCopied(false), 2000)
  }

  function handleWhatsApp() {
    const text = encodeURIComponent(`Send me an anonymous message 👀\n${shareLink}`)
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  async function handleFind(e: React.FormEvent) {
    e.preventDefault()
    if (!findUsername.trim() || finding) return
    setFinding(true)
    setFindError('')

    const res = await fetch(`/api/pages?name=${encodeURIComponent(findUsername.trim())}`)
    if (res.ok) {
      const data = await res.json()
      // Check localStorage for saved owner link (same device)
      const saved = JSON.parse(localStorage.getItem('whispr_owner_links') || '{}')
      if (saved[data.slug]) {
        window.location.href = saved[data.slug]
      } else {
        setFindError("Page found but your owner link isn't saved on this device. Use your private owner link to access your messages.")
        setFinding(false)
      }
    } else {
      setFindError('No page found with that username.')
      setFinding(false)
    }
  }

  /* ── Availability indicator ── */
  function AvailBadge() {
    if (avail === 'idle') return null
    if (avail === 'checking') return (
      <span className="flex items-center gap-1 text-white/40 text-xs">
        <Loader className="w-3 h-3 animate-spin" /> Checking...
      </span>
    )
    if (avail === 'too-short') return (
      <span className="text-white/40 text-xs">Min. 2 characters</span>
    )
    if (avail === 'available') return (
      <span className="flex items-center gap-1 text-green-400 text-xs">
        <CheckCircle className="w-3.5 h-3.5" /> Available
      </span>
    )
    return (
      <span className="flex items-center gap-1 text-red-400 text-xs">
        <XCircle className="w-3.5 h-3.5" /> Already taken — pick another
      </span>
    )
  }

  /* ── SUCCESS STATE ── */
  if (createdSlug) {
    return (
      <div className="min-h-screen bg-dot-pattern flex flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-md fade-up">
          <div className="text-center mb-8">
            <Link href="/">
              <h1 className="text-3xl font-bold gradient-text cursor-pointer">whispr</h1>
            </Link>
          </div>

          <div className="card text-center mb-4 relative overflow-hidden">
            <Confetti />
            <div className="relative z-20">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white/5 border border-white/10 mb-3">
                <PartyPopper className="w-6 h-6 text-blue-400" />
              </div>
              <h2 className="text-white text-xl font-bold mb-1">Your link is ready!</h2>
              <p className="text-white/50 text-sm mb-5">Share it and watch the messages roll in</p>

              {/* Share link */}
              <div className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 mb-3 break-all text-left">
                <p className="text-white/40 text-[10px] uppercase tracking-widest mb-1">Share this link</p>
                <p className="text-blue-400 text-sm font-mono">{shareLink}</p>
              </div>
              <button
                onClick={handleCopyShare}
                className="btn-primary w-full py-3 rounded-xl font-semibold mb-2 flex items-center justify-center gap-2"
              >
                {copied ? <><Check className="w-4 h-4" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy link</>}
              </button>
              <button
                onClick={handleWhatsApp}
                className="w-full py-3 rounded-xl font-semibold text-white border border-white/10 hover:bg-white/5 transition-colors mb-5"
                style={{ background: 'transparent' }}
              >
                Share on WhatsApp
              </button>

              {/* Owner access link */}
              <div className="border-t border-white/8 pt-4">
                <div className="flex items-start gap-2 mb-2">
                  <BookmarkCheck className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <p className="text-white/70 text-xs text-left font-medium">
                    Save your private link — this is the only way to access your messages later
                  </p>
                </div>
                <div className="bg-white/5 border border-yellow-500/20 rounded-xl px-3 py-2.5 mb-3 break-all text-left">
                  <p className="text-white/40 text-[10px] uppercase tracking-widest mb-1">Your private access link</p>
                  <p className="text-yellow-300/80 text-sm font-mono">{ownerLink}</p>
                </div>
                <button
                  onClick={handleCopyOwner}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold text-white/70 hover:text-white border border-yellow-500/20 hover:border-yellow-500/40 flex items-center justify-center gap-2 transition-all mb-2"
                  style={{ background: 'transparent' }}
                >
                  {ownerCopied
                    ? <><Check className="w-4 h-4 text-green-400" /> Copied!</>
                    : <><Copy className="w-4 h-4" /> Copy owner link</>}
                </button>
                <a
                  href={ownerLink}
                  className="w-full py-2.5 rounded-xl text-sm text-white/50 hover:text-white flex items-center justify-center gap-2 transition-colors"
                >
                  <MessageSquare className="w-4 h-4" /> View my messages now
                </a>
              </div>
            </div>
          </div>

          <p className="text-center text-white/25 text-xs">
            Or use your username <span className="text-white/40 font-mono">@{createdSlug}</span> to find your page anytime from the homepage
          </p>
        </div>
      </div>
    )
  }

  /* ── CREATE STATE ── */
  return (
    <div className="min-h-screen bg-dot-pattern flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold gradient-text mb-3">whispr</h1>
          <p className="text-white/60 text-lg">Find out what people <em>really</em> think</p>
        </div>

        <form onSubmit={handleCreate} className="space-y-5">
          {/* Username input */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-white/50 text-xs font-medium uppercase tracking-widest">
                Pick a username
              </label>
              <AvailBadge />
            </div>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. mercy, ayo99, xgirl..."
              maxLength={40}
              className={`input-field text-lg ${avail === 'taken' ? 'border-red-500/50' : avail === 'available' ? 'border-green-500/50' : ''}`}
              autoFocus
              autoComplete="off"
            />
            <p className="text-white/25 text-xs mt-1.5">
              This is your unique identity on whispr — no two people can have the same one
            </p>
            {createError && <p className="text-red-400 text-xs mt-1">{createError}</p>}
          </div>

          {/* Mode selector */}
          <div>
            <label className="text-white/50 text-xs font-medium uppercase tracking-widest block mb-3">
              Choose your vibe
            </label>
            <div className="grid grid-cols-2 gap-3">
              {MODES.map((m) => {
                const cfg = MODE_CONFIG[m]
                const isSelected = mode === m
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    className={`mode-card ${isSelected ? `selected-${m}` : ''}`}
                  >
                    {(() => { const Icon = MODE_ICONS[m]; return <Icon className="w-6 h-6 mb-2" style={{ color: MODE_ICON_COLORS[m] }} /> })()}
                    <div className="text-white text-sm font-semibold">{cfg.label}</div>
                    <div className="text-white/40 text-xs mt-0.5">{cfg.description}</div>
                  </button>
                )
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={!username.trim() || loading || avail !== 'available'}
            className="btn-primary w-full py-4 rounded-xl font-semibold text-base flex items-center justify-center gap-2"
          >
            <Link2 className="w-4 h-4" />
            {loading ? 'Creating...' : 'Create my link'}
          </button>
        </form>

        <p className="text-center text-white/25 text-xs mt-6 mb-8">
          No accounts. No login. 100% anonymous.
        </p>

        {/* ── Find my page ── */}
        <div className="border-t border-white/5 pt-6">
          {!showFind ? (
            <button
              onClick={() => setShowFind(true)}
              className="w-full text-white/30 hover:text-white/60 text-sm flex items-center justify-center gap-2 transition-colors py-2"
            >
              <Search className="w-4 h-4" />
              Already have a link? Find my messages
            </button>
          ) : (
            <div className="fade-up">
              <p className="text-white/50 text-xs text-center mb-3 uppercase tracking-widest">Enter your username</p>
              <form onSubmit={handleFind} className="flex gap-2">
                <input
                  type="text"
                  value={findUsername}
                  onChange={(e) => { setFindUsername(e.target.value); setFindError('') }}
                  placeholder="Your username..."
                  className="input-field flex-1"
                  autoFocus
                  autoComplete="off"
                />
                <button
                  type="submit"
                  disabled={!findUsername.trim() || finding}
                  className="btn-primary px-4 rounded-xl flex items-center gap-1.5 text-sm font-semibold flex-shrink-0"
                >
                  <Search className="w-4 h-4" />
                  {finding ? '...' : 'Find'}
                </button>
              </form>
              {findError && (
                <p className="text-red-400 text-xs mt-2 text-center">{findError}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
