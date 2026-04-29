import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export async function POST(req: NextRequest) {
  const { name, mode } = await req.json()

  if (!name?.trim() || !mode) {
    return NextResponse.json({ error: 'Name and mode required' }, { status: 400 })
  }

  const slug = generateSlug(name.trim())
  if (!slug || slug.length < 2) {
    return NextResponse.json({ error: 'Username must be at least 2 characters' }, { status: 400 })
  }

  // Username must be unique — no auto-increment
  const { data: existing } = await supabase
    .from('pages')
    .select('id')
    .eq('slug', slug)
    .single()

  if (existing) {
    return NextResponse.json({ error: 'Username already taken. Please choose a different one.' }, { status: 409 })
  }

  const { data, error } = await supabase
    .from('pages')
    .insert({ name: name.trim(), slug, mode })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug')
  const name = req.nextUrl.searchParams.get('name')

  // Single page by slug
  if (slug) {
    const { data, error } = await supabase
      .from('pages')
      .select('*')
      .eq('slug', slug)
      .single()

    if (error) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(data)
  }

  // Search by username — direct slug lookup (usernames are unique)
  if (name) {
    const usernameSlug = name.trim().toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
    const { data, error } = await supabase
      .from('pages')
      .select('*')
      .eq('slug', usernameSlug)
      .single()

    if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(data)
  }

  return NextResponse.json({ error: 'slug or name required' }, { status: 400 })
}
