import type { DashboardProject, DashboardTicket, ProofStatus } from './types'
import { PROJECT_CONFIG, DEFAULT_PROJECT_CONFIG } from './constants'

function getProjectPrefix(ticketKey: string): string {
  return ticketKey.split('-')[0].toUpperCase()
}

function mapHhStatus(hhStatus: string | null | undefined): ProofStatus {
  if (!hhStatus) return 'not_proofed'
  if (hhStatus === 'ready') return 'ready'
  if (hhStatus === 'caution') return 'caution'
  if (hhStatus === 'not_ready') return 'not_ready'
  return 'not_proofed'
}

export async function fetchProjects(): Promise<DashboardProject[]> {
  const res = await fetch('/api/tickets')
  if (!res.ok) throw new Error('Failed to fetch tickets')
  const data = await res.json()
  const tickets = data.tickets ?? []

  const filtered = tickets.filter((t: Record<string, unknown>) =>
    t.type !== 'Epic' && t.type !== 'Subtask'
  )

  const groups = new Map<string, typeof filtered>()
  for (const ticket of filtered) {
    const prefix = getProjectPrefix(ticket.key as string)
    if (!groups.has(prefix)) groups.set(prefix, [])
    groups.get(prefix)!.push(ticket)
  }

  const projects: DashboardProject[] = []
  for (const [prefix, groupTickets] of Array.from(groups.entries())) {
    const config = PROJECT_CONFIG[prefix] ?? {
      name: prefix,
      dot: DEFAULT_PROJECT_CONFIG.dot,
      section: DEFAULT_PROJECT_CONFIG.section,
    }

    const mappedTickets: DashboardTicket[] = groupTickets.map((t: Record<string, unknown>) => ({
      key: t.key as string,
      status: mapHhStatus(t.hhStatus as string | null),
      sprint: (t.sprint as string) ?? 'No sprint',
      summary: (t.summary as string) ?? '',
      checks: [],
      projectId: prefix.toLowerCase(),
      projectName: config.name,
      projectDot: config.dot,
      hhAssumedCount: (t.hhAssumedCount as number) ?? null,
      hhVerifiedCount: (t.hhVerifiedCount as number) ?? null,
      hhKeywords: (t.hhKeywords as string) ?? null,
      hhConfluencePages: (t.hhConfluencePages as string) ?? null,
    }))

    projects.push({
      id: prefix.toLowerCase(),
      name: config.name,
      section: config.section,
      dot: config.dot,
      tickets: mappedTickets,
    })
  }

  return projects
}
