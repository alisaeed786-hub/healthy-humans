import fs from 'fs'
import path from 'path'
import { runFullAnalysis } from '../lib/agents'
import { fetchJiraTicket } from '../lib/jira'
import { searchConfluence, buildConfluenceContext } from '../lib/confluence'

const TICKET_KEYS = ['SCRUM-11', 'SCRUM-22', 'SCRUM-17', 'SCRUM-30', 'SCRUM-31', 'SCRUM-33']

async function seedTicket(ticketKey: string) {
  console.log(`[seed-demo-cache] ${ticketKey}: fetching ticket...`)
  const ticket = await fetchJiraTicket(ticketKey)

  console.log(`[seed-demo-cache] ${ticketKey}: searching confluence...`)
  const confluencePages = await searchConfluence(ticket.summary, 3)
  const confluenceContext = buildConfluenceContext(confluencePages)

  console.log(`[seed-demo-cache] ${ticketKey}: running full analysis...`)
  const analysis = await runFullAnalysis(ticket, confluenceContext, confluencePages)

  const response = {
    ticket,
    analysis,
    confluencePages: confluencePages.map(p => ({
      id: p.id,
      title: p.title,
      url: p.url,
      space: p.space,
      excerpt: p.excerpt
    }))
  }

  const outDir = path.join(__dirname, '..', 'public', 'demo-cache')
  fs.mkdirSync(outDir, { recursive: true })
  const outPath = path.join(outDir, `${ticketKey}.json`)
  fs.writeFileSync(outPath, JSON.stringify(response, null, 2))

  console.log(`[seed-demo-cache] ${ticketKey}: saved to ${outPath}`)
}

async function main() {
  for (const ticketKey of TICKET_KEYS) {
    try {
      await seedTicket(ticketKey)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      console.error(`[seed-demo-cache] ${ticketKey}: FAILED — ${message}`)
    }
  }
}

main()
