import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Page } from '@/lib/types'
import PageClient from './PageClient'

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ owner?: string }>
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const { data: page } = await supabase
    .from('pages')
    .select('name, mode')
    .eq('slug', slug)
    .single()

  if (!page) return { title: 'Not found — Whispr' }
  return {
    title: `Send ${page.name} an anonymous message — Whispr`,
    description: `Send ${page.name} an anonymous message. They'll never know it was you.`,
  }
}

export default async function SlugPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { owner } = await searchParams

  const { data: page } = await supabase
    .from('pages')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!page) notFound()

  const { count } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('page_id', (page as Page).id)

  return <PageClient page={page as Page} initialCount={count ?? 0} isOwner={owner === '1'} />
}
