import { NextRequest, NextResponse } from 'next/server'
import { fetchJiraTicket, updateAnalysisFields } from '@/lib/jira'
import { searchConfluence, buildConfluenceContext } from '@/lib/confluence'
import { runFullAnalysis, extractSearchKeywords } from '@/lib/agents'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { ticketKey } = body as { ticketKey: string }
    if (!ticketKey) {
      return NextResponse.json({ error: 'ticketKey is required' }, { status: 400 })
    }

    const ticket = await fetchJiraTicket(ticketKey.trim().toUpperCase())

    const [searchQuery] = await Promise.allSettled([
      extractSearchKeywords(ticket)
    ])

    const query = searchQuery.status === 'fulfilled'
      ? searchQuery.value
      : ticket.summary.slice(0, 100)

    const confluencePages = await searchConfluence(query, 3)
    const confluenceContext = buildConfluenceContext(confluencePages)

    console.log('[confluence] query:', query, '| pages found:', confluencePages.length, '| titles:', confluencePages.map(p => p.title).join(', '))

    const analysis = await runFullAnalysis(ticket, confluenceContext, confluencePages)

    updateAnalysisFields(ticket.key, analysis, query)

    const escalationMessage = analysis.assumedCount >= 4
      ? `This ticket has ${analysis.assumedCount} assumptions. Resolve the assumed items before presenting to the team.`
      : undefined

    return NextResponse.json({
      ticket,
      analysis,
      confluencePages: confluencePages.map(p => ({
        id: p.id,
        title: p.title,
        url: p.url,
        space: p.space,
        excerpt: p.excerpt
      })),
      escalationMessage
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[refine]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
