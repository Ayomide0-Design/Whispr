import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const { page_id, content } = await req.json()

  if (!page_id || !content?.trim()) {
    return NextResponse.json({ error: 'Page ID and content required' }, { status: 400 })
  }

  if (content.trim().length > 500) {
    return NextResponse.json({ error: 'Message too long (max 500 chars)' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('messages')
    .insert({ page_id, content: content.trim() })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function GET(req: NextRequest) {
  const page_id = req.nextUrl.searchParams.get('page_id')
  if (!page_id) return NextResponse.json({ error: 'Page ID required' }, { status: 400 })

  const { data: messages, error } = await supabase
    .from('messages')
    .select('*')
    .eq('page_id', page_id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!messages?.length) return NextResponse.json([])

  const messageIds = messages.map((m) => m.id)

  const [{ data: reactions }, { data: replies }] = await Promise.all([
    supabase.from('reactions').select('*').in('message_id', messageIds),
    supabase
      .from('replies')
      .select('*')
      .in('message_id', messageIds)
      .order('created_at', { ascending: true }),
  ])

  const enriched = messages.map((msg) => {
    const msgReactions = (reactions || []).filter((r) => r.message_id === msg.id)
    const emojiCounts: Record<string, number> = {}
    msgReactions.forEach((r) => {
      emojiCounts[r.emoji] = (emojiCounts[r.emoji] || 0) + 1
    })

    return {
      ...msg,
      reactions: Object.entries(emojiCounts).map(([emoji, count]) => ({ emoji, count })),
      replies: (replies || []).filter((r) => r.message_id === msg.id),
      total_reactions: msgReactions.length,
    }
  })

  return NextResponse.json(enriched)
}
