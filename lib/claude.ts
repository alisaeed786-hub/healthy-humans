import Anthropic from '@anthropic-ai/sdk'
import type { JiraTicket } from './jira'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export interface PressureTestResult {
  missingRequirements: string[]
  edgeCases: string[]
  ambiguities: string[]
  acceptanceCriteriaGaps: string[]
  riskAreas: string[]
  overallScore: number // 1-10
  summary: string
  refinedTicket: RefinedTicket
}

export interface RefinedTicket {
  summary: string
  description: string
  acceptanceCriteria: string[]
  outOfScope: string[]
  assumptions: string[]
  technicalNotes: string
}

function formatTicket(ticket: JiraTicket): string {
  return `**Ticket Key:** ${ticket.key}
**Type:** ${ticket.issueType}
**Priority:** ${ticket.priority}
**Status:** ${ticket.status}
**Summary:** ${ticket.summary}
**Labels:** ${ticket.labels.join(', ') || 'none'}
**Components:** ${ticket.components.join(', ') || 'none'}
**Story Points:** ${ticket.storyPoints ?? 'unestimated'}

**Description:**
${ticket.description || '(no description)'}

**Acceptance Criteria:**
${ticket.acceptanceCriteria || '(none specified)'}`.trim()
}

const SYSTEM_PROMPT = `You are a senior product manager and software architect conducting a thorough pressure test of Jira user stories. Your job is to:

1. Identify gaps, ambiguities, missing requirements, and edge cases in the ticket
2. Use the provided Confluence documentation as domain context to spot inconsistencies or missing domain knowledge
3. Produce a refined, production-ready version of the ticket

You must respond with valid JSON matching the exact schema provided. Be specific and actionable — vague feedback is not useful.`

export async function pressureTestTicket(
  ticket: JiraTicket,
  confluenceContext: string
): Promise<PressureTestResult> {
  const userPrompt = `## Jira Ticket to Pressure Test

${formatTicket(ticket)}

## Relevant Confluence Documentation (RAG Context)

${confluenceContext}

## Your Task

Analyze the ticket above using the Confluence context and return a JSON object with this exact schema:

{
  "missingRequirements": ["string", ...],
  "edgeCases": ["string", ...],
  "ambiguities": ["string", ...],
  "acceptanceCriteriaGaps": ["string", ...],
  "riskAreas": ["string", ...],
  "overallScore": <number 1-10 where 10 is a perfect ticket>,
  "summary": "<2-3 sentence executive summary of issues found>",
  "refinedTicket": {
    "summary": "<improved one-line summary>",
    "description": "<full rewritten description as a proper user story with context>",
    "acceptanceCriteria": ["Given/When/Then or clear testable criterion", ...],
    "outOfScope": ["explicitly out of scope item", ...],
    "assumptions": ["assumption made in this ticket", ...],
    "technicalNotes": "<any technical implementation notes or constraints from Confluence>"
  }
}

Be specific. Reference the Confluence context where relevant. Return only the JSON object with no markdown fencing.`

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt }],
  })

  const rawText =
    message.content[0].type === 'text' ? message.content[0].text : ''

  // Strip any accidental markdown fencing
  const jsonText = rawText
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/, '')
    .trim()

  try {
    return JSON.parse(jsonText) as PressureTestResult
  } catch {
    throw new Error(`Failed to parse Claude response as JSON: ${rawText.slice(0, 300)}`)
  }
}
