'use client'

import { useEffect, useState } from 'react'

export interface ToastItem {
  id: string
  text: string
  messageId: string
  type: 'message' | 'reply' | 'reaction'
  emoji?: string
}

interface Props {
  toasts: ToastItem[]
  onDismiss: (id: string) => void
  onScrollTo: (messageId: string) => void
}

const TYPE_ICONS: Record<ToastItem['type'], string> = {
  message: '💬',
  reply: '↩️',
  reaction: '🔥',
}

const AUTO_DISMISS_MS = 90000 // 90 seconds

function ToastCard({ toast, onDismiss, onScrollTo }: {
  toast: ToastItem
  onDismiss: (id: string) => void
  onScrollTo: (messageId: string) => void
}) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const showTimer = setTimeout(() => setVisible(true), 10)
    const hideTimer = setTimeout(() => {
      setVisible(false)
      setTimeout(() => onDismiss(toast.id), 300)
    }, AUTO_DISMISS_MS)
    return () => { clearTimeout(showTimer); clearTimeout(hideTimer) }
  }, [toast.id, onDismiss])

  function handleDismiss(e: React.MouseEvent) {
    e.stopPropagation()
    setVisible(false)
    setTimeout(() => onDismiss(toast.id), 300)
  }

  function handleClick() {
    onScrollTo(toast.messageId)
    setVisible(false)
    setTimeout(() => onDismiss(toast.id), 300)
  }

  return (
    <div
      onClick={handleClick}
      style={{
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(-16px) scale(0.96)',
        opacity: visible ? 1 : 0,
        transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        cursor: 'pointer',
        pointerEvents: 'auto',
      }}
    >
      <div style={{
        background: '#141414',
        border: '1px solid rgba(255,255,255,0.13)',
        borderRadius: '16px',
        padding: '11px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03)',
        minWidth: '220px',
        maxWidth: '320px',
      }}>
        <span style={{ fontSize: '18px', flexShrink: 0 }}>
          {toast.emoji ?? TYPE_ICONS[toast.type]}
        </span>
        <span style={{
          color: 'rgba(255,255,255,0.88)',
          fontSize: '13px',
          fontWeight: 500,
          flex: 1,
          lineHeight: 1.3,
        }}>
          {toast.text}
        </span>
        <span style={{
          color: '#335CFF',
          fontSize: '12px',
          flexShrink: 0,
          fontWeight: 600,
          marginRight: '6px',
        }}>
          View →
        </span>
        {/* Dismiss X */}
        <button
          onClick={handleDismiss}
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: 'none',
            borderRadius: '50%',
            width: '20px',
            height: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'rgba(255,255,255,0.4)',
            fontSize: '11px',
            flexShrink: 0,
            padding: 0,
          }}
        >
          ✕
        </button>
      </div>
    </div>
  )
}

export default function ToastStack({ toasts, onDismiss, onScrollTo }: Props) {
  if (toasts.length === 0) return null

  // Show max 3 at once, newest on top
  const visible = toasts.slice(-3)

  return (
    <div style={{
      position: 'fixed',
      top: '24px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      alignItems: 'center',
      pointerEvents: 'none',
    }}>
      {visible.map((toast) => (
        <ToastCard
          key={toast.id}
          toast={toast}
          onDismiss={onDismiss}
          onScrollTo={onScrollTo}
        />
      ))}
    </div>
  )
}
