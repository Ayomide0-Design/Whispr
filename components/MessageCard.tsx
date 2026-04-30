'use client'

import { useState, useEffect } from 'react'
import { MessageCircle, ChevronDown, Send, ImageDown } from 'lucide-react'
import { Message, Reply, REACTION_EMOJIS } from '@/lib/types'
import ShareModal from './ShareModal'

interface Props {
  message: Message
  onReactionAdded: (messageId: string) => void
  isOwner?: boolean
  ownerName?: string
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function getSessionId(): string {
  if (typeof window === 'undefined') return ''
  let id = localStorage.getItem('whispr_session_id')
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem('whispr_session_id', id)
  }
  return id
}

function getMyReactions(): Record<string, string> {
  if (typeof window === 'undefined') return {}
  try {
    return JSON.parse(localStorage.getItem('whispr_reactions') || '{}')
  } catch {
    return {}
  }
}

function setMyReaction(messageId: string, emoji: string | null) {
  const map = getMyReactions()
  if (emoji === null) {
    delete map[messageId]
  } else {
    map[messageId] = emoji
  }
  localStorage.setItem('whispr_reactions', JSON.stringify(map))
}

export default function MessageCard({ message, onReactionAdded, isOwner = false, ownerName = '' }: Props) {
  const [reactions, setReactions] = useState(message.reactions)
  const [myEmoji, setMyEmoji] = useState<string | null>(null)
  const [replies, setReplies] = useState<Reply[]>(message.replies)
  const [showReplies, setShowReplies] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [submittingReply, setSubmittingReply] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)

  // Sync reactions + replies when poll brings fresh data from server
  useEffect(() => {
    setReactions(message.reactions)
  }, [message.reactions])

  useEffect(() => {
    setReplies(message.replies)
  }, [message.replies])

  // Hydrate from localStorage after mount (client only)
  useEffect(() => {
    const map = getMyReactions()
    setMyEmoji(map[message.id] ?? null)
  }, [message.id])

  async function handleReaction(emoji: string) {
    const sessionId = getSessionId()
    const isSame = myEmoji === emoji

    // Optimistic UI
    setReactions((prev) => {
      let next = [...prev]

      // Remove old reaction count if switching
      if (myEmoji && myEmoji !== emoji) {
        next = next.map((r) =>
          r.emoji === myEmoji ? { ...r, count: Math.max(0, r.count - 1) } : r
        )
      }

      if (isSame) {
        // Removing reaction
        next = next.map((r) =>
          r.emoji === emoji ? { ...r, count: Math.max(0, r.count - 1) } : r
        )
      } else {
        // Adding / switching to new emoji
        const existing = next.find((r) => r.emoji === emoji)
        if (existing) {
          next = next.map((r) => (r.emoji === emoji ? { ...r, count: r.count + 1 } : r))
        } else {
          next = [...next, { emoji, count: 1 }]
        }
      }

      return next
    })

    const newEmoji = isSame ? null : emoji
    setMyEmoji(newEmoji)
    setMyReaction(message.id, newEmoji)
    if (!isSame) onReactionAdded(message.id)

    // API call
    if (isSame) {
      await fetch('/api/reactions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message_id: message.id, session_id: sessionId }),
      })
    } else {
      await fetch('/api/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message_id: message.id, emoji, session_id: sessionId }),
      })
    }
  }

  async function handleReply(e: React.FormEvent) {
    e.preventDefault()
    if (!replyText.trim() || submittingReply) return

    setSubmittingReply(true)
    const res = await fetch('/api/replies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message_id: message.id, content: replyText.trim(), is_owner: isOwner }),
    })

    if (res.ok) {
      const newReply = await res.json()
      setReplies((prev) => [...prev, newReply])
      setReplyText('')
    }
    setSubmittingReply(false)
  }

  const totalReactions = reactions.reduce((sum, r) => sum + r.count, 0)

  return (
    <div id={`msg-${message.id}`} className="card">
      {/* Message */}
      <p className="text-white/90 text-[15px] leading-relaxed mb-3">{message.content}</p>
      <p className="text-white/30 text-xs mb-4">{timeAgo(message.created_at)}</p>

      {/* Reaction bar */}
      <div className="flex flex-wrap gap-2 mb-4">
        {REACTION_EMOJIS.map((emoji) => {
          const r = reactions.find((x) => x.emoji === emoji)
          const isMine = myEmoji === emoji
          const hasReactions = r && r.count > 0
          return (
            <button
              key={emoji}
              onClick={() => handleReaction(emoji)}
              className={`reaction-btn ${isMine ? 'reaction-mine' : hasReactions ? 'reaction-active' : ''}`}
            >
              <span>{emoji}</span>
              {hasReactions && (
                <span className={`text-xs ml-1 ${isMine ? 'text-blue-300' : 'text-white/70'}`}>{r.count}</span>
              )}
            </button>
          )
        })}
        {totalReactions > 0 && (
          <span className="text-white/25 text-xs self-center ml-1">
            {totalReactions} reaction{totalReactions !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Replies toggle + share button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setShowReplies((v) => !v)}
          className="text-white/40 hover:text-white/70 text-xs transition-colors flex items-center gap-1.5"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          {replies.length > 0
            ? `${replies.length} repl${replies.length === 1 ? 'y' : 'ies'}`
            : 'Reply'}
          <ChevronDown
            className="w-3 h-3 transition-transform duration-300"
            style={{ transform: showReplies ? 'rotate(180deg)' : 'rotate(0deg)' }}
          />
        </button>
        <button
          onClick={() => setShowShareModal(true)}
          className="text-white/30 hover:text-white/60 text-xs transition-colors flex items-center gap-1.5"
        >
          <ImageDown className="w-3.5 h-3.5" />
          Share image
        </button>
      </div>

      {/* Share modal */}
      {showShareModal && (
        <ShareModal
          message={message}
          replies={replies}
          showReplies={showReplies}
          ownerName={ownerName}
          onClose={() => setShowShareModal(false)}
        />
      )}

      {/* Collapsible reply thread */}
      <div className={`reply-thread ${showReplies ? 'open' : ''}`}>
        <div className="reply-thread-inner">
          <div className="pt-3 mt-3 border-t border-white/5">
            {/* Existing replies */}
            {replies.length > 0 && (
              <div className="space-y-2 mb-3">
                {replies.map((reply) => (
                  <div
                    key={reply.id}
                    className="rounded-xl px-3 py-2.5"
                    style={{
                      background: reply.is_owner ? 'rgba(51,92,255,0.08)' : 'rgba(255,255,255,0.05)',
                      border: reply.is_owner ? '1px solid rgba(51,92,255,0.25)' : '1px solid rgba(255,255,255,0.05)',
                    }}
                  >
                    <p className="text-white/80 text-sm leading-relaxed">{reply.content}</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-white/25 text-xs">{timeAgo(reply.created_at)}</p>
                      {reply.is_owner && (
                        <span style={{
                          background: '#335CFF',
                          color: 'white',
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '100px',
                          letterSpacing: '0.04em',
                        }}>
                          OWNER
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Reply input */}
            <form onSubmit={handleReply} className="flex gap-2">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a reply..."
                maxLength={300}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-blue-500/50 transition-colors"
              />
              <button
                type="submit"
                disabled={!replyText.trim() || submittingReply}
                className="px-3 py-2 disabled:opacity-40 text-white rounded-xl transition-all flex items-center justify-center"
                style={{ backgroundColor: '#335CFF' }}
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
