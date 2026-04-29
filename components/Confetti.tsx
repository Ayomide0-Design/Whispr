'use client'

import { useEffect, useState } from 'react'

interface Piece {
  id: number
  left: number
  color: string
  delay: number
  duration: number
  size: number
  rotation: number
  round: boolean
}

const COLORS = ['#335CFF', '#f472b6', '#facc15', '#4ade80', '#fb923c', '#a78bfa', '#ffffff']

export default function Confetti() {
  const [pieces, setPieces] = useState<Piece[]>([])
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const generated: Piece[] = Array.from({ length: 70 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      delay: Math.random() * 1.5,
      duration: 2 + Math.random() * 2,
      size: 5 + Math.random() * 7,
      rotation: Math.random() * 360,
      round: Math.random() > 0.5,
    }))
    setPieces(generated)

    const timer = setTimeout(() => setVisible(false), 5000)
    return () => clearTimeout(timer)
  }, [])

  if (!visible || pieces.length === 0) return null

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-2xl z-10">
      {pieces.map((p) => (
        <div
          key={p.id}
          className="absolute top-0 confetti-piece"
          style={{
            left: `${p.left}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            transform: `rotate(${p.rotation}deg)`,
            borderRadius: p.round ? '50%' : '2px',
          }}
        />
      ))}
    </div>
  )
}
