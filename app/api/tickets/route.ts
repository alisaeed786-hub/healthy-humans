import { NextResponse } from 'next/server'
import { listRecentTickets } from '@/lib/jira'

export async function GET() {
  try {
    const projectKey = process.env.JIRA_PROJECT_KEY ?? 'SCRUM'
    const tickets = await listRecentTickets(projectKey, 20)
    return NextResponse.json({ tickets })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
