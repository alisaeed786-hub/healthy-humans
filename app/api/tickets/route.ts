export const dynamic = 'force-dynamic'
export const revalidate = 0

import { NextResponse } from 'next/server'
import { listRecentTickets } from '@/lib/jira'

export async function GET() {
  console.log('[/api/tickets] env keys present:', Object.keys(process.env).sort().join(', '))
  console.log('[/api/tickets] JIRA_BASE_URL:', process.env.JIRA_BASE_URL ?? 'UNDEFINED')
  console.log('[/api/tickets] JIRA_EMAIL:', process.env.JIRA_EMAIL ?? 'UNDEFINED')
  console.log('[/api/tickets] JIRA_API_TOKEN set:', !!process.env.JIRA_API_TOKEN)
  console.log('[/api/tickets] JIRA_PROJECT_KEY:', process.env.JIRA_PROJECT_KEY ?? 'UNDEFINED')

  try {
    const projectKey = process.env.JIRA_PROJECT_KEY ?? 'SCRUM'
    const tickets = await listRecentTickets(projectKey, 20)
    console.log('[/api/tickets] success — ticket count:', tickets.length)
    return NextResponse.json({ tickets })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[/api/tickets] error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
