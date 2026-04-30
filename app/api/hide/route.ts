import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

// PATCH /api/hide
// Body: { type: 'message' | 'reply', id: string, hidden: boolean, token: string }
// Validates owner token before toggling visibility
export async function PATCH(req: NextRequest) {
  const { type, id, hidden, token } = await req.json()

  if (!type || !id || hidden === undefined || !token) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  if (type === 'message') {
    // Validate: token must match the page that owns this message
    const { data: msg } = await supabase
      .from('messages')
      .select('page_id')
      .eq('id', id)
      .single()

    if (!msg) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { data: page } = await supabase
      .from('pages')
      .select('owner_token')
      .eq('id', msg.page_id)
      .single()

    if (!page || page.owner_token !== token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { error } = await getSupabaseAdmin()
      .from('messages')
      .update({ hidden })
      .eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  if (type === 'reply') {
    // Validate: token must match the page that owns the message this reply belongs to
    const { data: reply } = await supabase
      .from('replies')
      .select('message_id')
      .eq('id', id)
      .single()

    if (!reply) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { data: msg } = await supabase
      .from('messages')
      .select('page_id')
      .eq('id', reply.message_id)
      .single()

    if (!msg) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { data: page } = await supabase
      .from('pages')
      .select('owner_token')
      .eq('id', msg.page_id)
      .single()

    if (!page || page.owner_token !== token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { error } = await getSupabaseAdmin()
      .from('replies')
      .update({ hidden })
      .eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
}
