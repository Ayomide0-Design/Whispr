import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { REACTION_EMOJIS } from '@/lib/types'

// Add or switch reaction
export async function POST(req: NextRequest) {
  const { message_id, emoji, session_id } = await req.json()

  if (!message_id || !emoji || !session_id) {
    return NextResponse.json({ error: 'message_id, emoji and session_id required' }, { status: 400 })
  }

  if (!REACTION_EMOJIS.includes(emoji)) {
    return NextResponse.json({ error: 'Invalid emoji' }, { status: 400 })
  }

  // Delete any existing reaction from this session on this message first
  await supabase
    .from('reactions')
    .delete()
    .eq('message_id', message_id)
    .eq('session_id', session_id)

  // Then insert the new reaction
  const { data, error } = await supabase
    .from('reactions')
    .insert({ message_id, emoji, session_id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// Remove reaction (unreact)
export async function DELETE(req: NextRequest) {
  const { message_id, session_id } = await req.json()

  if (!message_id || !session_id) {
    return NextResponse.json({ error: 'message_id and session_id required' }, { status: 400 })
  }

  const { error } = await supabase
    .from('reactions')
    .delete()
    .eq('message_id', message_id)
    .eq('session_id', session_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
