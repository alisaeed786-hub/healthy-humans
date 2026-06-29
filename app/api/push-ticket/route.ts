import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      ticketKey,
      summary,
      description,
      acceptanceCriteria,
      outOfScope,
      assumptions,
      status,
      assumedCount,
      verifiedCount,
      keywords,
      confluencePages,
      hhAcceptanceCriteria,
      hhOutOfScope,
      hhAssumptions,
      hhPmNotes,
    } = body

    if (!ticketKey) {
      return NextResponse.json({ error: 'ticketKey is required' }, { status: 400 })
    }

    const BASE_URL = process.env.JIRA_BASE_URL
    const EMAIL = process.env.JIRA_EMAIL
    const TOKEN = process.env.JIRA_API_TOKEN
    const auth = 'Basic ' + Buffer.from(`${EMAIL}:${TOKEN}`).toString('base64')

    // Build fields object — only include non-empty values
    const fields: Record<string, unknown> = {}

    if (summary) fields.summary = summary

    if (description || acceptanceCriteria?.length || outOfScope?.length || assumptions?.length || hhPmNotes) {
      const descriptionText = [
        description || '',
        acceptanceCriteria?.length
          ? '\n\nAcceptance Criteria:\n' + acceptanceCriteria.map((ac: string) => `- ${ac}`).join('\n')
          : '',
        outOfScope?.length
          ? '\n\nOut of Scope:\n' + outOfScope.map((item: string) => `- ${item}`).join('\n')
          : '',
        assumptions?.length
          ? '\n\nAssumptions:\n' + assumptions.map((item: string) => `- ${item}`).join('\n')
          : '',
        hhPmNotes
          ? '\n\nPM Notes:\n' + hhPmNotes
          : '',
      ].filter(Boolean).join('')

      fields.description = {
        type: 'doc',
        version: 1,
        content: [{ type: 'paragraph', content: [{ type: 'text', text: descriptionText }] }]
      }
    }

    const updateBody = { fields }

    const res = await fetch(`${BASE_URL}/rest/api/3/issue/${ticketKey}`, {
      method: 'PUT',
      headers: {
        Authorization: auth,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(updateBody),
    })

    if (!res.ok) {
      const error = await res.text()
      throw new Error(`Jira update failed: ${error}`)
    }

    // Attempt custom field update — failure does not affect the main response
    let customFieldsUpdated = false
    try {
      const customFields: Record<string, unknown> = {}
      if (status) customFields.customfield_10080 = status
      if (assumedCount != null) customFields.customfield_10075 = assumedCount
      if (verifiedCount != null) customFields.customfield_10076 = verifiedCount
      if (keywords) customFields.customfield_10077 = keywords
      if (confluencePages) customFields.customfield_10079 = confluencePages
      if (hhAcceptanceCriteria) customFields.customfield_10117 = hhAcceptanceCriteria
      if (hhOutOfScope) customFields.customfield_10118 = hhOutOfScope
      if (hhAssumptions) customFields.customfield_10119 = hhAssumptions
      if (hhPmNotes) customFields.customfield_10120 = hhPmNotes

      if (Object.keys(customFields).length > 0) {
        const cfRes = await fetch(`${BASE_URL}/rest/api/3/issue/${ticketKey}`, {
          method: 'PUT',
          headers: {
            Authorization: auth,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({ fields: customFields }),
        })
        customFieldsUpdated = cfRes.ok
      }
    } catch {
      // silent — custom field failure does not affect the main response
    }

    return NextResponse.json({
      success: true,
      ticketUrl: `${BASE_URL}/browse/${ticketKey}`,
      customFieldsUpdated,
    })

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[push-ticket]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
