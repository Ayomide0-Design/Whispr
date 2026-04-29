import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

function generateSlug(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
}

export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get('username')
  if (!username) return NextResponse.json({ available: false })

  const slug = generateSlug(username)
  if (slug.length < 2) return NextResponse.json({ available: false, slug })

  const { data } = await supabase.from('pages').select('id').eq('slug', slug).single()
  return NextResponse.json({ available: !data, slug })
}
