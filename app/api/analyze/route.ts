import { NextRequest, NextResponse } from 'next/server'
import { fetchJiraTicket } from '@/lib/jira'
import { searchConfluence, buildConfluenceContext } from '@/lib/confluence'
import { pressureTestTicket } from '@/lib/claude'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { ticketKey } = body as { ticketKey: string }

    if (!ticketKey) {
      return NextResponse.json({ error: 'ticketKey is required' }, { status: 400 })
    }

    // 1. Fetch the Jira ticket
    const ticket = await fetchJiraTicket(ticketKey.trim().toUpperCase())

    // 2. Build a search query from ticket content
    const searchQuery = [ticket.summary, ...ticket.labels]
      .filter(Boolean)
      .join(' ')
      .slice(0, 200)

    // 3. Retrieve relevant Confluence pages
    const confluencePages = await searchConfluence(searchQuery, 5)
    const confluenceContext = buildConfluenceContext(confluencePages)

    // 4. Pressure test with Claude
    const analysis = await pressureTestTicket(ticket, confluenceContext)

    return NextResponse.json({
      ticket,
      confluencePages: confluencePages.map(p => ({
        id: p.id,
        title: p.title,
        url: p.url,
        space: p.space,
        excerpt: p.excerpt,
      })),
      analysis,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[analyze]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
