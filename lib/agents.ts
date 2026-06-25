import Anthropic from '@anthropic-ai/sdk'
import type { JiraTicket } from './jira'
import type { ConfluencePage } from './confluence'

export interface VerifiedItem {
  claim: string
  source: string
  quote: string
}

export interface AssumedItem {
  claim: string
  reason: string
  pmAction: string
}

export interface RefinedTicket {
  summary: string
  description: string
  acceptanceCriteria: string[]
  outOfScope: string[]
  assumptions: string[]
}

export interface AgentResult {
  status: 'ready' | 'caution' | 'not_ready'
  verifiedCount: number
  assumedCount: number
  verified: VerifiedItem[]
  assumed: AssumedItem[]
  structuralIssues: string[]
  refinedTicket: RefinedTicket
  diff: {
    summary: { original: string, revised: string }
    description: { original: string, revised: string }
    acceptanceCriteria: { original: string, revised: string }
  }
  confluenceLinks: string[]
  confluencePageCount: number
  confluencePageTitles: string[]
  escalationMessage?: string
  error?: string
}

function safeParseJSON<T>(raw: string, fallback: T): T {
  try {
    const cleaned = raw
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/,'')
      .trim()
    const parsed = JSON.parse(cleaned)
    return parsed
  } catch {
    return fallback
  }
}

export async function extractSearchKeywords(ticket: JiraTicket): Promise<string> {
  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 60,
      messages: [{
        role: 'user',
        content: `You are a search query builder for a healthcare product documentation system.
Read this Jira ticket and return 4-6 specific keywords that a healthcare
product documentation page would use to describe this feature area.
Focus on clinical, technical, and product terminology — not the conversational
language in the ticket.
Return only the keywords space-separated on one line. No explanation, no punctuation.

Ticket summary: ${ticket.summary}
Ticket description: ${ticket.description.slice(0, 500)}`
      }]
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text : ''
    const cleaned = raw.replace(/\n/g, ' ').trim()
    return cleaned.length > 0 ? cleaned : ticket.summary.slice(0, 100)
  } catch {
    return ticket.summary.slice(0, 100)
  }
}

export async function runStructuralAnalyst(ticket: JiraTicket): Promise<string[]> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const prompt = `You are a senior product manager reviewing a Jira ticket for structural completeness.

Ticket:
Summary: ${ticket.summary}
Description: ${ticket.description}
Acceptance Criteria: ${ticket.acceptanceCriteria || 'none'}

Check for these structural problems:
- Not written as a user story (missing As a / I want / So that format)
- No acceptance criteria present
- Acceptance criteria are not testable (contains vague words: should, might, may, etc)
- More than 7 acceptance criteria
- Technical prescription — tells engineers HOW to build not WHAT to build
- No out of scope items defined
- No assumptions documented
- Ambiguous scope (words like: all, everything, any user, etc)
- Missing obvious edge cases for this type of feature

Return ONLY a JSON array of strings. Each string is one specific problem found.
Return an empty array [] if no problems found.
No markdown, no explanation, no fencing. Only the JSON array.`

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1000,
    messages: [{ role: 'user', content: prompt }]
  })

  const raw = message.content[0].type === 'text' ? message.content[0].text : '[]'
  const result = safeParseJSON<string[]>(raw, [])

  if (!Array.isArray(result)) return []
  return result
}

export async function runContextualVerifier(
  ticket: JiraTicket,
  confluenceContext: string,
  confluencePages: ConfluencePage[]
): Promise<{ verified: VerifiedItem[], assumed: AssumedItem[], confluenceLinks: string[], confluencePageTitles: string[] }> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const pageList = confluencePages.map(p => p.title).join(', ')
  const confluencePageTitles = confluencePages.map(p => p.title)
  const confluenceLinks = confluencePages.map(p => p.url)

  if (!confluenceContext || confluencePages.length === 0) {
    return {
      verified: [],
      assumed: [{
        claim: 'No Confluence documentation found for this ticket',
        reason: 'Confluence search returned no relevant pages',
        pmAction: 'Manually verify all claims against product documentation before presenting'
      }],
      confluenceLinks: [],
      confluencePageTitles: []
    }
  }

  const prompt = `You are a product compliance reviewer checking a Jira ticket against documentation.

TICKET:
Summary: ${ticket.summary}
Description: ${ticket.description}
Acceptance Criteria: ${ticket.acceptanceCriteria || 'none'}

CONFLUENCE DOCUMENTATION (pages: ${pageList}):
${confluenceContext}

YOUR TASK:
Go through every significant claim in the ticket. For each claim decide if it is VERIFIED or ASSUMED.

STRICT RULES:
1. A claim is VERIFIED only if you can find the exact sentence in the documentation that confirms it. You must quote that exact sentence. No paraphrasing counts.
2. If no exact quote exists the claim is ASSUMED regardless of how reasonable it sounds.
3. If the ticket references something explicitly listed as out of scope in the documentation — mark as ASSUMED with reason "Out of scope per product decisions".
4. If the ticket contradicts a HIPAA rule in the documentation — mark as ASSUMED with reason "Contradicts HIPAA constraints. PM must resolve before sprint."
5. If the ticket contradicts a documented product decision — mark as ASSUMED with reason "Contradicts documented product decision".
6. Do not verify claims against general knowledge. Only the provided documentation counts.

Return ONLY this JSON object. No markdown fencing. No explanation:
{
  "verified": [{ "claim": "", "source": "", "quote": "" }],
  "assumed": [{ "claim": "", "reason": "", "pmAction": "" }]
}`

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }]
  })

  const raw = message.content[0].type === 'text' ? message.content[0].text : '{}'
  const result = safeParseJSON<{ verified: VerifiedItem[], assumed: AssumedItem[] }>(
    raw,
    { verified: [], assumed: [] }
  )

  return {
    verified: Array.isArray(result.verified) ? result.verified : [],
    assumed: Array.isArray(result.assumed) ? result.assumed : [],
    confluenceLinks,
    confluencePageTitles
  }
}

export async function runStoryWriter(
  ticket: JiraTicket,
  structuralIssues: string[],
  verified: VerifiedItem[]
): Promise<{ refinedTicket: RefinedTicket, diff: AgentResult['diff'] }> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const verifiedFacts = verified.length > 0
    ? verified.map(v => `- ${v.claim} (confirmed: "${v.quote}")`).join('\n')
    : 'No verified facts available. Fix structural issues only. Do not add any new content.'

  const prompt = `You are a senior product manager rewriting a Jira ticket.

ORIGINAL TICKET:
Summary: ${ticket.summary}
Description: ${ticket.description}
Acceptance Criteria: ${ticket.acceptanceCriteria || 'none'}

STRUCTURAL ISSUES TO FIX:
${structuralIssues.length > 0 ? structuralIssues.join('\n') : 'None'}

VERIFIED FACTS YOU MAY USE:
${verifiedFacts}

RULES YOU MUST FOLLOW WITHOUT EXCEPTION:
1. Never change the core intent of the ticket.
2. Only use the verified facts listed above as confirmed information.
3. If verified facts are empty — fix structural issues only. Do not add any new content or invented requirements.
4. Never tell engineers HOW to build — only WHAT to build.
5. Never exceed 7 acceptance criteria. Consolidate if needed.
6. Never add compliance requirements not in the verified facts list.
7. Preserve the PM voice and intent.
8. Every acceptance criterion must use Given/When/Then format or a clear testable statement.
9. Add an assumptions section listing anything that could not be confirmed.

Return ONLY this JSON object. No markdown fencing. No explanation:
{
  "refinedTicket": {
    "summary": "",
    "description": "",
    "acceptanceCriteria": [],
    "outOfScope": [],
    "assumptions": []
  },
  "diff": {
    "summary": { "original": "", "revised": "" },
    "description": { "original": "", "revised": "" },
    "acceptanceCriteria": { "original": "", "revised": "" }
  }
}`

  const safeFallback = {
    refinedTicket: {
      summary: ticket.summary,
      description: ticket.description,
      acceptanceCriteria: [],
      outOfScope: [],
      assumptions: ['Story writer failed — original ticket returned unchanged']
    },
    diff: {
      summary: { original: ticket.summary, revised: ticket.summary },
      description: { original: ticket.description, revised: ticket.description },
      acceptanceCriteria: { original: ticket.acceptanceCriteria || '', revised: '' }
    }
  }

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4000,
    messages: [{ role: 'user', content: prompt }]
  })

  const raw = message.content[0].type === 'text' ? message.content[0].text : ''
  if (raw.length < 200) return safeFallback

  const result = safeParseJSON<typeof safeFallback>(raw, safeFallback)
  if (!result.refinedTicket || !result.diff) return safeFallback
  return result
}

export async function runFullAnalysis(
  ticket: JiraTicket,
  confluenceContext: string,
  confluencePages: ConfluencePage[]
): Promise<AgentResult> {
  try {
    const [structuralIssues, contextResult] = await Promise.allSettled([
      runStructuralAnalyst(ticket),
      runContextualVerifier(ticket, confluenceContext, confluencePages)
    ])

    const issues = structuralIssues.status === 'fulfilled' ? structuralIssues.value : ['Structural analysis failed']
    const context = contextResult.status === 'fulfilled'
      ? contextResult.value
      : { verified: [], assumed: [{ claim: 'Contextual verification failed', reason: 'Agent error', pmAction: 'Review manually' }], confluenceLinks: [], confluencePageTitles: [] }

    const writerResult = await runStoryWriter(ticket, issues, context.verified)

    const assumedCount = context.assumed.length
    const status = assumedCount <= 1 ? 'ready' : assumedCount <= 3 ? 'caution' : 'not_ready'
    const escalationMessage = assumedCount >= 4
      ? `This ticket has ${assumedCount} assumptions. Resolve the items in the assumed list before presenting to the team.`
      : undefined

    return {
      status,
      verifiedCount: context.verified.length,
      assumedCount,
      verified: context.verified,
      assumed: context.assumed,
      structuralIssues: issues,
      refinedTicket: writerResult.refinedTicket,
      diff: writerResult.diff,
      confluenceLinks: context.confluenceLinks,
      confluencePageCount: confluencePages.length,
      confluencePageTitles: context.confluencePageTitles,
      escalationMessage
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return {
      status: 'not_ready',
      verifiedCount: 0,
      assumedCount: 0,
      verified: [],
      assumed: [],
      structuralIssues: ['Analysis failed: ' + message],
      refinedTicket: {
        summary: ticket.summary,
        description: ticket.description,
        acceptanceCriteria: [],
        outOfScope: [],
        assumptions: []
      },
      diff: {
        summary: { original: ticket.summary, revised: ticket.summary },
        description: { original: ticket.description, revised: ticket.description },
        acceptanceCriteria: { original: ticket.acceptanceCriteria || '', revised: '' }
      },
      confluenceLinks: [],
      confluencePageCount: 0,
      confluencePageTitles: [],
      error: message
    }
  }
}
