import type { DashboardTicket, DashboardProject, FilterState, TabId, TicketOverride } from './types'

export const ALL_TICKETS_ID = 'all'

export function flattenTickets(projects: DashboardProject[]): DashboardTicket[] {
  return projects.flatMap(p =>
    p.tickets.map(t => ({
      ...t,
      projectId: p.id,
      projectName: p.name,
      projectDot: p.dot,
    }))
  )
}

export function applyOverrides(
  tickets: DashboardTicket[],
  overrides: Record<string, TicketOverride>
): DashboardTicket[] {
  return tickets.map(t => {
    const o = overrides[t.key]
    if (!o) return t
    return { ...t, ...o }
  })
}

export function proofStats(ticket: DashboardTicket): { total: number; verified: number } {
  const total = ticket.checks.length
  const verified = ticket.checks.filter(([, verdict]) => verdict === 'verified').length
  return { total, verified }
}

export function proofText(ticket: DashboardTicket): string {
  if (ticket.status === 'not_proofed') return 'Not proofed yet'
  if (ticket.hhVerifiedCount !== null && ticket.hhAssumedCount !== null) {
    return `${ticket.hhVerifiedCount} verified · ${ticket.hhAssumedCount} assumed`
  }
  const { total, verified } = proofStats(ticket)
  return `${verified}/${total} checks verified`
}

export function statusCounts(tickets: DashboardTicket[]) {
  const counts = { ready: 0, caution: 0, not_ready: 0, not_proofed: 0 }
  tickets.forEach(t => { counts[t.status] += 1 })
  return counts
}

export function boardSubtitle(tickets: DashboardTicket[]): string {
  const c = statusCounts(tickets)
  const attention = c.caution + c.not_ready
  return `${tickets.length} tickets · ${c.ready} ready · ${attention} need attention · ${c.not_proofed} not proofed`
}

export function filterByTab(tickets: DashboardTicket[], tab: TabId): DashboardTicket[] {
  switch (tab) {
    case 'not_proofed':  return tickets.filter(t => t.status === 'not_proofed')
    case 'in_progress':  return tickets.filter(t => t.status === 'not_proofed')
    case 'proofed':      return tickets.filter(t => t.status !== 'not_proofed')
    default:             return tickets
  }
}

export function filterTickets(tickets: DashboardTicket[], filters: FilterState): DashboardTicket[] {
  const q = filters.search.trim().toLowerCase()
  return tickets.filter(t => {
    if (filters.status !== 'all' && t.status !== filters.status) return false
    if (filters.sprint !== 'all' && t.sprint !== filters.sprint) return false
    if (q && !(t.key.toLowerCase().includes(q) || t.summary.toLowerCase().includes(q))) return false
    return true
  })
}

export function sprintOptions(tickets: DashboardTicket[]): { value: string; label: string }[] {
  const sprints = Array.from(new Set(tickets.map(t => t.sprint).filter(Boolean))).sort()
  return [
    { value: 'all', label: 'All sprints' },
    ...sprints.map(s => ({ value: s, label: s }))
  ]
}

export function tabCounts(tickets: DashboardTicket[]): Record<TabId, number> {
  return {
    all:         tickets.length,
    not_proofed: tickets.filter(t => t.status === 'not_proofed').length,
    in_progress: 0,
    proofed:     tickets.filter(t => t.status !== 'not_proofed').length,
  }
}
