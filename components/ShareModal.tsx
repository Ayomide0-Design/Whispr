'use client'

import { useRef, useState } from 'react'
import { X, Copy, Check } from 'lucide-react'
import { Message, Reply } from '@/lib/types'

interface Props {
  message: Message
  replies: Reply[]
  showReplies: boolean
  ownerName: string
  onClose: () => void
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

// SVG dot pattern as a data URI — html2canvas renders this reliably
// (CSS radial-gradient and `inset` shorthand are not supported by html2canvas)
const DOT_BG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24'%3E%3Ccircle cx='12' cy='12' r='1' fill='rgba(255%2C255%2C255%2C0.18)'/%3E%3C/svg%3E")`

export default function ShareModal({ message, replies, showReplies, ownerName, onClose }: Props) {
  const captureRef = useRef<HTMLDivElement>(null)
  const [copied, setCopied] = useState(false)
  const [copying, setCopying] = useState(false)

  const topReactions = message.reactions.filter(r => r.count > 0).sort((a, b) => b.count - a.count)

  async function handleCopy() {
    if (!captureRef.current) return
    setCopying(true)
    try {
      const html2canvas = (await import('html2canvas')).default
      const scale = Math.max(window.devicePixelRatio * 2, 4)
      const canvas = await html2canvas(captureRef.current, {
        backgroundColor: '#335CFF',
        scale,
        useCORS: true,
        logging: false,
        imageTimeout: 0,
        allowTaint: false,
      })

      await new Promise<void>((resolve) => {
        canvas.toBlob(async (blob) => {
          if (!blob) { resolve(); return }
          try {
            await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
            setCopied(true)
            setTimeout(() => setCopied(false), 2500)
          } catch {
            const link = document.createElement('a')
            link.download = `whispr-${message.id.slice(0, 8)}.png`
            link.href = canvas.toDataURL('image/png')
            link.click()
          }
          resolve()
        }, 'image/png')
      })
    } catch (e) {
      console.error(e)
    }
    setCopying(false)
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 9998,
        background: 'rgba(0,0,0,0.85)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '24px',
        backdropFilter: 'blur(4px)',
      }}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute', top: '20px', right: '20px',
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '50%', width: '36px', height: '36px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: 'rgba(255,255,255,0.6)',
        }}
      >
        <X size={16} />
      </button>

      {/* Blue card — captured by html2canvas */}
      <div
        ref={captureRef}
        onClick={e => e.stopPropagation()}
        style={{
          background: '#335CFF',
          backgroundImage: DOT_BG,
          backgroundRepeat: 'repeat',
          borderRadius: '24px',
          width: '480px',
          maxWidth: '100%',
          overflow: 'hidden',
          position: 'relative',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        } as React.CSSProperties}
      >
        {/* Message card */}
        <div style={{ margin: '20px 20px 0', position: 'relative', zIndex: 1 }}>
          <div style={{
            background: '#000',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '16px',
            padding: '18px',
          }}>
            {/* Message text */}
            <p style={{
              color: 'rgba(255,255,255,0.9)',
              fontSize: '15px',
              lineHeight: '1.6',
              margin: '0 0 6px',
              fontFamily: 'inherit',
            }}>
              {message.content}
            </p>
            <p style={{
              color: 'rgba(255,255,255,0.3)',
              fontSize: '11px',
              margin: topReactions.length > 0 || (showReplies && replies.length > 0) ? '0 0 12px' : '0',
              fontFamily: 'inherit',
            }}>
              {timeAgo(message.created_at)}
            </p>

            {/* Reactions */}
            {topReactions.length > 0 && (
              <div style={{
                display: 'flex',
                gap: '6px',
                flexWrap: 'wrap',
                marginBottom: showReplies && replies.length > 0 ? '12px' : '0',
              }}>
                {topReactions.map(r => (
                  <div key={r.emoji} style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '100px',
                    padding: '4px 10px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    lineHeight: '1',
                  }}>
                    <span style={{ fontSize: '14px', lineHeight: '1' }}>{r.emoji}</span>
                    <span style={{
                      color: 'rgba(255,255,255,0.7)',
                      fontSize: '12px',
                      fontWeight: 600,
                      lineHeight: '1',
                      fontFamily: 'inherit',
                    }}>{r.count}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Replies */}
            {showReplies && replies.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {replies.map(reply => (
                  <div key={reply.id} style={{
                    background: reply.is_owner ? 'rgba(51,92,255,0.12)' : 'rgba(255,255,255,0.04)',
                    border: reply.is_owner ? '1px solid rgba(51,92,255,0.35)' : '1px solid rgba(255,255,255,0.07)',
                    borderRadius: '10px',
                    padding: '10px 12px',
                  }}>
                    <p style={{
                      color: 'rgba(255,255,255,0.85)',
                      fontSize: '13px',
                      lineHeight: '1.5',
                      margin: '0 0 6px',
                      fontFamily: 'inherit',
                    }}>
                      {reply.content}
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{
                        color: 'rgba(255,255,255,0.25)',
                        fontSize: '10px',
                        fontFamily: 'inherit',
                      }}>{timeAgo(reply.created_at)}</span>
                      {reply.is_owner && (
                        <span style={{
                          background: '#335CFF',
                          color: 'white',
                          fontSize: '9px',
                          fontWeight: 700,
                          letterSpacing: '0.06em',
                          padding: '3px 8px',
                          borderRadius: '100px',
                          lineHeight: '1',
                          display: 'inline-flex',
                          alignItems: 'center',
                          fontFamily: 'inherit',
                        }}>OWNER</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Whispr watermark */}
        <div style={{
          textAlign: 'center',
          padding: '14px 0 26px',
          position: 'relative',
          zIndex: 1,
          color: 'rgba(255,255,255,0.08)',
          fontSize: '72px',
          fontWeight: 700,
          letterSpacing: '-2px',
          lineHeight: '1',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          userSelect: 'none',
        }}>
          Whispr
        </div>
      </div>

      {/* Copy image button */}
      <button
        onClick={e => { e.stopPropagation(); handleCopy() }}
        disabled={copying}
        style={{
          marginTop: '24px',
          display: 'flex', alignItems: 'center', gap: '10px',
          background: 'transparent', border: 'none',
          color: 'white', fontSize: '18px', fontWeight: 500,
          cursor: 'pointer', padding: '8px 16px',
          opacity: copying ? 0.5 : 1,
          transition: 'opacity 0.15s',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {copied
          ? <><Check size={22} color="#4ade80" /> <span style={{ color: '#4ade80' }}>Copied!</span></>
          : <><Copy size={22} /> {copying ? 'Copying...' : 'Copy image'}</>
        }
      </button>
      <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '12px', marginTop: '6px' }}>
        Paste anywhere — WhatsApp, X, Instagram
      </p>
    </div>
  )
}
