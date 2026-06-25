const BASE_URL = process.env.JIRA_BASE_URL!
const EMAIL = process.env.JIRA_EMAIL!
const TOKEN = process.env.JIRA_API_TOKEN!

function authHeader() {
  return 'Basic ' + Buffer.from(`${EMAIL}:${TOKEN}`).toString('base64')
}

export interface ConfluencePage {
  id: string
  title: string
  url: string
  excerpt: string
  body: string
  space: string
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
}

export async function searchConfluence(
  query: string,
  limit = 3
): Promise<ConfluencePage[]> {
  const words = query.replace(/"/g, '').split(/\s+/).filter(w => w.length >= 4).slice(0, 5)
  const cqlInner = words.length >= 2
    ? `(${words.map(w => `text ~ "${w}"`).join(' OR ')})`
    : `text ~ "${query.replace(/"/g, '')}"`
  const cql = encodeURIComponent(`type = page AND ${cqlInner} ORDER BY lastModified DESC`)
  const url = `${BASE_URL}/wiki/rest/api/content/search?cql=${cql}&limit=${limit}&expand=body.storage,space,excerpt`

  const res = await fetch(url, {
    headers: {
      Authorization: authHeader(),
      Accept: 'application/json',
    },
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Confluence API error ${res.status}: ${body}`)
  }

  const data = await res.json()

  return (data.results ?? []).map((page: Record<string, unknown>) => {
    const bodyStorage = page.body as Record<string, unknown>
    const storageVal = bodyStorage?.storage as Record<string, unknown>
    const spaceObj = page.space as Record<string, unknown>
    const links = page._links as Record<string, unknown>

    const rawBody = (storageVal?.value as string) ?? ''
    const fullText = stripHtml(rawBody)

    return {
      id: page.id as string,
      title: page.title as string,
      url: `${BASE_URL}/wiki${links?.webui ?? ''}`,
      excerpt: stripHtml((page.excerpt as string) ?? ''),
      body: fullText.slice(0, 1500), // cap per page to stay within token budget
      space: (spaceObj?.name as string) ?? '',
    }
  })
}

// Build a condensed RAG context string from pages
export function buildConfluenceContext(pages: ConfluencePage[]): string {
  if (pages.length === 0) return 'No relevant Confluence pages found.'

  return pages
    .map(
      (p, i) =>
        `--- Confluence Page ${i + 1}: "${p.title}" (${p.space}) ---\nURL: ${p.url}\n${p.body}`
    )
    .join('\n\n')
}
