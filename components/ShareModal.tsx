'use client'

import { useRef, useState, useEffect } from 'react'
import { X, Copy, Check, Share2 } from 'lucide-react'
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

const DOT_BG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24'%3E%3Ccircle cx='12' cy='12' r='1' fill='rgba(255%2C255%2C255%2C0.18)'/%3E%3C/svg%3E")`

type OS = 'mac' | 'windows' | 'linux' | 'mobile'

function detectOS(): OS {
  if (typeof navigator === 'undefined') return 'windows'
  const ua = navigator.userAgent
  if (/iPhone|iPad|iPod|Android/i.test(ua)) return 'mobile'
  // userAgentData is available in modern Chromium browsers
  const platform = (navigator as any).userAgentData?.platform || navigator.platform || ''
  if (/Mac/i.test(platform) || /Mac/i.test(ua)) return 'mac'
  if (/Win/i.test(platform) || /Win/i.test(ua)) return 'windows'
  if (/Linux/i.test(platform) || /Linux/i.test(ua)) return 'linux'
  return 'windows'
}

const SCREENSHOT_HINT: Record<OS, { keys: string; action: string }> = {
  mac:     { keys: '⌘ ⇧ 4',          action: 'press · release · then drag the card' },
  windows: { keys: 'Win + Shift + S', action: 'then drag around the card' },
  linux:   { keys: 'Shift + PrtScn',  action: 'then drag around the card' },
  mobile:  { keys: '',                action: '' },
}

export default function ShareModal({ message, replies, showReplies, ownerName, onClose }: Props) {
  const captureRef = useRef<HTMLDivElement>(null)
  const [copied, setCopied] = useState(false)
  const [copying, setCopying] = useState(false)
  const [chromeVisible, setChromeVisible] = useState(true)
  const [hoveringCard, setHoveringCard] = useState(false)
  const [os] = useState<OS>(() => detectOS())
  const mobile = os === 'mobile'
  const hint = SCREENSHOT_HINT[os]

  const topReactions = message.reactions.filter(r => r.count > 0).sort((a, b) => b.count - a.count)

  // Start in capture mode immediately on desktop
  const [captureMode, setCaptureMode] = useState(() => detectOS() !== 'mobile')

  // Fade chrome quickly on desktop
  useEffect(() => {
    if (mobile) return
    const t = setTimeout(() => setChromeVisible(false), 600)
    return () => clearTimeout(t)
  }, [mobile])

  // Escape exits capture mode
  useEffect(() => {
    if (mobile) return
    function onKey(e: KeyboardEvent) {
      if (e.code === 'Escape') setCaptureMode(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mobile])

  async function buildCanvas() {
    const html2canvas = (await import('html2canvas')).default
    const scale = Math.max(window.devicePixelRatio * 2, 4)
    return html2canvas(captureRef.current!, {
      backgroundColor: '#335CFF',
      scale,
      useCORS: true,
      logging: false,
      imageTimeout: 0,
      allowTaint: false,
    })
  }

  // Mobile: open native share sheet with the image
  async function handleMobileShare() {
    if (!captureRef.current) return
    setCopying(true)
    try {
      const canvas = await buildCanvas()
      await new Promise<void>((resolve) => {
        canvas.toBlob(async (blob) => {
          if (!blob) { resolve(); return }
          const file = new File([blob], 'whispr.png', { type: 'image/png' })
          try {
            if (navigator.share && navigator.canShare({ files: [file] })) {
              await navigator.share({ files: [file], title: 'Whispr' })
            } else {
              // Fallback: download
              const link = document.createElement('a')
              link.download = `whispr-${message.id.slice(0, 8)}.png`
              link.href = canvas.toDataURL('image/png')
              link.click()
            }
          } catch { /* user cancelled share sheet */ }
          resolve()
        }, 'image/png')
      })
    } catch (e) { console.error(e) }
    setCopying(false)
  }

  // Desktop fallback: copy to clipboard
  async function handleCopy() {
    if (!captureRef.current) return
    setCopying(true)
    try {
      const canvas = await buildCanvas()
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
    } catch (e) { console.error(e) }
    setCopying(false)
  }

  return (
    <div
      onClick={captureMode ? undefined : onClose}
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 9998,
        // In capture mode: lighter overlay + heavier blur so background fades away
        background: captureMode ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.88)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        backdropFilter: captureMode ? 'blur(10px) saturate(0.5)' : 'blur(6px)',
        cursor: captureMode ? 'crosshair' : 'default',
        transition: 'background 0.25s ease, backdrop-filter 0.25s ease',
      }}
    >
      {/* Close button — hidden in capture mode */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute', top: '20px', right: '20px',
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '50%', width: '36px', height: '36px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: 'rgba(255,255,255,0.6)',
          opacity: (chromeVisible && !captureMode) ? 1 : 0,
          transition: 'opacity 0.3s ease',
          pointerEvents: (chromeVisible && !captureMode) ? 'auto' : 'none',
        }}
      >
        <X size={16} />
      </button>

      {!mobile && (
        <>
          {/* OS shortcut prompt — visible immediately in capture mode */}
          <div style={{
            position: 'absolute', top: '18px', left: '50%', transform: 'translateX(-50%)',
            opacity: captureMode ? 1 : 0,
            transition: 'opacity 0.2s ease',
            pointerEvents: 'none',
            background: '#335CFF',
            borderRadius: '100px',
            padding: '7px 18px',
            fontSize: '13px',
            fontWeight: 600,
            color: 'white',
            whiteSpace: 'nowrap',
            display: 'flex', alignItems: 'center', gap: '8px',
            boxShadow: '0 4px 20px rgba(51,92,255,0.5)',
          }}>
            <span>{hint.keys}</span>
            <span style={{ opacity: 0.75, fontWeight: 400 }}>{hint.action}</span>
          </div>
        </>
      )}

      {/* Blue card */}
      <div
        ref={captureRef}
        onClick={e => e.stopPropagation()}
        onMouseEnter={() => setHoveringCard(true)}
        onMouseLeave={() => setHoveringCard(false)}
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
          // Crosshair cursor hints "screenshot this"
          cursor: hoveringCard ? 'crosshair' : 'default',
          boxShadow: hoveringCard ? '0 0 0 3px rgba(255,255,255,0.25), 0 24px 64px rgba(0,0,0,0.6)' : '0 24px 64px rgba(0,0,0,0.5)',
          transition: 'box-shadow 0.2s ease',
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
            <p style={{
              color: 'rgba(255,255,255,0.9)', fontSize: '15px',
              lineHeight: '1.6', margin: '0 0 6px', fontFamily: 'inherit',
            }}>
              {message.content}
            </p>
            <p style={{
              color: 'rgba(255,255,255,0.3)', fontSize: '11px',
              margin: topReactions.length > 0 || (showReplies && replies.length > 0) ? '0 0 12px' : '0',
              fontFamily: 'inherit',
            }}>
              {timeAgo(message.created_at)}
            </p>

            {topReactions.length > 0 && (
              <div style={{
                display: 'flex', gap: '6px', flexWrap: 'wrap',
                marginBottom: showReplies && replies.length > 0 ? '12px' : '0',
              }}>
                {topReactions.map(r => (
                  <div key={r.emoji} style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '100px', padding: '4px 10px',
                    display: 'inline-flex', alignItems: 'center',
                    gap: '5px', lineHeight: '1',
                  }}>
                    <span style={{ fontSize: '14px', lineHeight: '1' }}>{r.emoji}</span>
                    <span style={{
                      color: 'rgba(255,255,255,0.7)', fontSize: '12px',
                      fontWeight: 600, lineHeight: '1', fontFamily: 'inherit',
                    }}>{r.count}</span>
                  </div>
                ))}
              </div>
            )}

            {showReplies && replies.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {replies.map(reply => (
                  <div key={reply.id} style={{
                    background: reply.is_owner ? 'rgba(51,92,255,0.12)' : 'rgba(255,255,255,0.04)',
                    border: reply.is_owner ? '1px solid rgba(51,92,255,0.35)' : '1px solid rgba(255,255,255,0.07)',
                    borderRadius: '10px', padding: '10px 12px',
                  }}>
                    <p style={{
                      color: 'rgba(255,255,255,0.85)', fontSize: '13px',
                      lineHeight: '1.5', margin: '0 0 6px', fontFamily: 'inherit',
                    }}>
                      {reply.content}
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '10px', fontFamily: 'inherit' }}>
                        {timeAgo(reply.created_at)}
                      </span>
                      {reply.is_owner && (
                        <span style={{
                          background: '#335CFF', color: 'white',
                          fontSize: '9px', fontWeight: 700, letterSpacing: '0.06em',
                          padding: '3px 8px', borderRadius: '100px',
                          lineHeight: '1', display: 'inline-flex', alignItems: 'center',
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
          textAlign: 'center', padding: '14px 0 26px',
          position: 'relative', zIndex: 1,
          color: 'rgba(255,255,255,0.08)', fontSize: '72px',
          fontWeight: 700, letterSpacing: '-2px', lineHeight: '1',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          userSelect: 'none',
        }}>
          Whispr
        </div>
      </div>

      {/* Bottom actions — hidden in capture mode */}
      <div style={{
        marginTop: '20px', textAlign: 'center',
        opacity: captureMode ? 0 : 1,
        transition: 'opacity 0.25s ease',
        pointerEvents: captureMode ? 'none' : 'auto',
      }}>
        {mobile ? (
          /* Mobile: big Share button → native share sheet */
          <button
            onClick={e => { e.stopPropagation(); handleMobileShare() }}
            disabled={copying}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '10px',
              background: '#335CFF', border: 'none', borderRadius: '14px',
              color: 'white', fontSize: '16px', fontWeight: 600,
              cursor: 'pointer', padding: '14px 32px',
              opacity: copying ? 0.5 : 1,
              transition: 'opacity 0.15s',
              fontFamily: 'system-ui, sans-serif',
            }}
          >
            <Share2 size={18} />
            {copying ? 'Preparing…' : 'Share image'}
          </button>
        ) : (
          /* Desktop: Space copies, button is a visible fallback */
          <button
            onClick={e => { e.stopPropagation(); handleCopy() }}
            disabled={copying}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: 'transparent', border: 'none',
              color: copied ? '#4ade80' : 'rgba(255,255,255,0.35)',
              fontSize: '13px', fontWeight: 500,
              cursor: 'pointer', padding: '6px 12px',
              opacity: copying ? 0.4 : 1,
              transition: 'color 0.15s, opacity 0.15s',
              fontFamily: 'system-ui, sans-serif',
            }}
          >
            {copied
              ? <><Check size={14} /> Copied to clipboard</>
              : <><Copy size={14} /> {copying ? 'Copying…' : 'Copy image'}</>
            }
          </button>
        )}
      </div>
    </div>
  )
}
