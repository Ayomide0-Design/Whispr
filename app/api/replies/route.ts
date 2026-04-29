import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const { message_id, content } = await req.json()

  if (!message_id || !content?.trim()) {
    return NextResponse.json({ error: 'Message ID and content required' }, { status: 400 })
  }

  if (content.trim().length > 300) {
    return NextResponse.json({ error: 'Reply too long (max 300 chars)' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('replies')
    .insert({ message_id, content: content.trim() })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
