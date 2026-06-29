export type ProofStatus = 'ready' | 'caution' | 'not_ready' | 'not_proofed'
export type CheckVerdict = 'verified' | 'assumed' | 'missing'
export type TabId = 'all' | 'not_proofed' | 'in_progress' | 'proofed'

export interface DashboardTicket {
  key: string
  status: ProofStatus
  sprint: string
  summary: string
  checks: [string, CheckVerdict][]
  projectId: string
  projectName: string
  projectDot: string
  hhAssumedCount: number | null
  hhVerifiedCount: number | null
  hhKeywords: string | null
  hhConfluencePages: string | null
}

export interface DashboardProject {
  id: string
  name: string
  section: 'My Projects' | 'Team Boards'
  dot: string
  tickets: DashboardTicket[]
}

export interface FilterState {
  sprint: string
  status: string
  search: string
}

export interface ProofQueueItem {
  key: string
  projectId: string
}

export interface BatchProofState {
  queue: ProofQueueItem[]
  currentlyProofing: string | null
  done: number
  total: number
  cancelRequested: boolean
}

export interface TicketOverride {
  status: ProofStatus
  hhAssumedCount: number | null
  hhVerifiedCount: number | null
  hhKeywords: string | null
  hhConfluencePages: string | null
}
