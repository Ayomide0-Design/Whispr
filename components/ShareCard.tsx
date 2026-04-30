'use client'

import { Message, Reply } from '@/lib/types'

interface Props {
  message: Message
  replies: Reply[]
  showReplies: boolean
  ownerName: string
}

// This component renders the visual card that gets captured as an image
export default function ShareCard({ message, replies, showReplies, ownerName }: Props) {
  function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  const topReactions = message.reactions
    .filter(r => r.count > 0)
    .sort((a, b) => b.count - a.count)

  return (
    <div
      id="whispr-share-card"
      style={{
        width: '480px',
        background: '#0d0d0d',
        borderRadius: '20px',
        padding: '28px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Dot pattern background */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
        pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Message bubble */}
        <div style={{
          background: '#000',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '16px',
          padding: '20px',
          marginBottom: topReactions.length > 0 || (showReplies && replies.length > 0) ? '12px' : '0',
        }}>
          <p style={{
            color: 'rgba(255,255,255,0.9)',
            fontSize: '15px',
            lineHeight: '1.6',
            margin: '0 0 10px 0',
          }}>
            {message.content}
          </p>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', margin: 0 }}>
            {timeAgo(message.created_at)}
          </p>

          {/* Reactions */}
          {topReactions.length > 0 && (
            <div style={{ display: 'flex', gap: '8px', marginTop: '14px', flexWrap: 'wrap' }}>
              {topReactions.map(r => (
                <div key={r.emoji} style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '100px',
                  padding: '4px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '14px',
                }}>
                  <span>{r.emoji}</span>
                  <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>{r.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Replies */}
        {showReplies && replies.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
            {replies.map(reply => (
              <div key={reply.id} style={{
                background: reply.is_owner ? 'rgba(51,92,255,0.08)' : 'rgba(255,255,255,0.04)',
                border: reply.is_owner ? '1px solid rgba(51,92,255,0.25)' : '1px solid rgba(255,255,255,0.06)',
                borderRadius: '12px',
                padding: '12px 14px',
              }}>
                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px', lineHeight: '1.5', margin: '0 0 6px 0' }}>
                  {reply.content}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '11px' }}>
                    {timeAgo(reply.created_at)}
                  </span>
                  {reply.is_owner && (
                    <span style={{
                      background: '#335CFF',
                      color: 'white',
                      fontSize: '9px',
                      fontWeight: 700,
                      padding: '2px 7px',
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

        {/* Branding footer */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: '16px',
          paddingTop: '16px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}>
          <span style={{
            background: 'linear-gradient(135deg, #335CFF, #5b7fff)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontSize: '18px',
            fontWeight: 700,
            letterSpacing: '-0.5px',
          }}>
            whispr
          </span>
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px' }}>
            whispr-ashen.vercel.app/{ownerName}
          </span>
        </div>
      </div>
    </div>
  )
}
