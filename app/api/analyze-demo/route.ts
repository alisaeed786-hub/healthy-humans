import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

export const dynamic = 'force-dynamic'

const DEMO_TICKET_KEYS = ['SCRUM-11', 'SCRUM-22', 'SCRUM-17', 'SCRUM-30', 'SCRUM-31', 'SCRUM-33']

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { ticketKey } = body as { ticketKey: string }

    if (!ticketKey || !DEMO_TICKET_KEYS.includes(ticketKey.trim().toUpperCase())) {
      return NextResponse.json({ error: 'Not a demo ticket' }, { status: 400 })
    }

    const key = ticketKey.trim().toUpperCase()
    const filePath = path.join(process.cwd(), 'public', 'demo-cache', `${key}.json`)
    const raw = await fs.readFile(filePath, 'utf-8')
    const data = JSON.parse(raw)

    return NextResponse.json(data)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
