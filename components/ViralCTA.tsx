'use client'

import { Sparkles, ArrowRight } from 'lucide-react'

export default function ViralCTA() {
  return (
    <div className="mt-6">
      <div className="card text-center">
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 border border-white/10 mb-3">
          <Sparkles className="w-5 h-5 text-blue-400" />
        </div>
        <h3 className="text-white font-semibold text-base mb-1">
          Want people to send <span className="gradient-text">you</span> anonymous messages?
        </h3>
        <p className="text-white/40 text-sm mb-4">
          Create your own link and find out what people really think
        </p>
        <a
          href="/"
          className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold"
        >
          Create my link <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    </div>
  )
}
