const BASE_URL = process.env.JIRA_BASE_URL!
const EMAIL = process.env.JIRA_EMAIL!
const TOKEN = process.env.JIRA_API_TOKEN!

console.log('[jira] env check — JIRA_BASE_URL:', BASE_URL ?? 'UNDEFINED', '| JIRA_EMAIL:', EMAIL ?? 'UNDEFINED', '| JIRA_API_TOKEN set:', !!TOKEN)

function authHeader() {
  return 'Basic ' + Buffer.from(`${EMAIL}:${TOKEN}`).toString('base64')
}

export interface JiraTicket {
  key: string
  summary: string
  description: string
  issueType: string
  status: string
  priority: string
  assignee: string | null
  reporter: string
  labels: string[]
  acceptanceCriteria: string
  storyPoints: number | null
  components: string[]
  rawFields: Record<string, unknown>
}

function extractText(adf: unknown): string {
  if (!adf) return ''
  if (typeof adf === 'string') return adf

  const node = adf as Record<string, unknown>

  if (node.type === 'text') return (node.text as string) ?? ''

  if (Array.isArray(node.content)) {
    return (node.content as unknown[])
      .map(extractText)
      .join(node.type === 'paragraph' ? '\n' : '')
  }

  return ''
}

export async function fetchJiraTicket(ticketKey: string): Promise<JiraTicket> {
  const url = `${BASE_URL}/rest/api/3/issue/${ticketKey}`
  const res = await fetch(url, {
    headers: {
      Authorization: authHeader(),
      Accept: 'application/json',
    },
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Jira API error ${res.status}: ${body}`)
  }

  const data = await res.json()
  const f = data.fields

  const description = f.description
    ? extractText(f.description)
    : ''

  // Acceptance criteria stored in custom field or inside description
  const acceptanceCriteria = f.customfield_10016
    ? extractText(f.customfield_10016)
    : ''

  return {
    key: data.key,
    summary: f.summary ?? '',
    description,
    issueType: f.issuetype?.name ?? '',
    status: f.status?.name ?? '',
    priority: f.priority?.name ?? '',
    assignee: f.assignee?.displayName ?? null,
    reporter: f.reporter?.displayName ?? '',
    labels: f.labels ?? [],
    acceptanceCriteria,
    storyPoints: f.story_points ?? f.customfield_10028 ?? null,
    components: (f.components ?? []).map((c: { name: string }) => c.name),
    rawFields: f,
  }
}

const TICKET_FIELDS = ['summary', 'status', 'issuetype', 'priority']

function mapIssues(issues: Record<string, unknown>[]) {
  return issues.map(issue => {
    const f = (issue.fields ?? {}) as Record<string, unknown>
    const issuetype = f.issuetype as Record<string, unknown>
    const status = f.status as Record<string, unknown>
    const priority = f.priority as Record<string, unknown>
    return {
      key: issue.key as string,
      summary: f.summary as string,
      status: status?.name as string,
      type: issuetype?.name as string,
      priority: priority?.name as string,
    }
  })
}

export async function listRecentTickets(projectKey: string, maxResults = 20) {
  const params = new URLSearchParams({
    jql: `project=${projectKey} ORDER BY updated DESC`,
    fields: TICKET_FIELDS.join(','),
    maxResults: String(maxResults),
  })
  const url = `${BASE_URL}/rest/api/3/search/jql?${params.toString()}`
  console.log('[jira] listRecentTickets — GET', url)

  const res = await fetch(url, {
    headers: { Authorization: authHeader(), Accept: 'application/json' },
  })

  console.log('[jira] listRecentTickets — status:', res.status, res.statusText)

  const rawBody = await res.text()
  console.log('[jira] listRecentTickets — body:', rawBody.slice(0, 2000))

  if (!res.ok) {
    throw new Error(`Jira API error ${res.status}: ${rawBody}`)
  }

  const data = JSON.parse(rawBody)
  console.log('[jira] listRecentTickets — total:', data.total, '| returned:', data.issues?.length ?? 0)

  return mapIssues(data.issues ?? [])
}
