const BASE_URL = process.env.JIRA_BASE_URL!
const EMAIL = process.env.JIRA_EMAIL!
const TOKEN = process.env.JIRA_API_TOKEN!

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

export async function listRecentTickets(projectKey: string, maxResults = 20) {
  const params = new URLSearchParams({
    jql: `project=${projectKey} ORDER BY updated DESC`,
    maxResults: String(maxResults),
    fields: 'summary,status,issuetype,priority',
  })
  const url = `${BASE_URL}/rest/api/3/search/jql?${params.toString()}`
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
  return data.issues.map((issue: Record<string, unknown>) => {
    const f = issue.fields as Record<string, unknown>
    const issuetype = f.issuetype as Record<string, unknown>
    const status = f.status as Record<string, unknown>
    const priority = f.priority as Record<string, unknown>
    return {
      key: issue.key,
      summary: f.summary,
      status: status?.name,
      type: issuetype?.name,
      priority: priority?.name,
    }
  })
}
