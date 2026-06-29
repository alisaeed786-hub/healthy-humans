import type { ProofStatus, CheckVerdict } from './types'

export const STATUS_META: Record<ProofStatus, {
  label: string
  color: string
  bg: string
  dot: string
  proofColor: string
}> = {
  ready:       { label: 'Ready',       color: '#047857', bg: '#d1fae5', dot: '#059669', proofColor: '#059669' },
  caution:     { label: 'Caution',     color: '#b45309', bg: '#fef3c7', dot: '#D97706', proofColor: '#D97706' },
  not_ready:   { label: 'Not ready',   color: '#be123c', bg: '#ffe4e6', dot: '#E11D48', proofColor: '#E11D48' },
  not_proofed: { label: 'Not proofed', color: '#475569', bg: '#f1f5f9', dot: '#94a3b8', proofColor: '#94a3b8' },
}

export const CHECK_META: Record<CheckVerdict, {
  symbol: string
  color: string
  bg: string
  note: string
}> = {
  verified: { symbol: '✓', color: '#059669', bg: '#d1fae5', note: 'Verified' },
  assumed:  { symbol: '≈', color: '#D97706', bg: '#fef3c7', note: 'Assumed'  },
  missing:  { symbol: '!', color: '#E11D48', bg: '#ffe4e6', note: 'Missing'  },
}

export const STATUS_OPTIONS = [
  { value: 'all',        label: 'All statuses' },
  { value: 'ready',      label: 'Ready'        },
  { value: 'caution',    label: 'Caution'      },
  { value: 'not_ready',  label: 'Not ready'    },
  { value: 'not_proofed',label: 'Not proofed'  },
]

export const TAB_OPTIONS = [
  { id: 'all',        label: 'All'         },
  { id: 'not_proofed',label: 'Not Proofed' },
  { id: 'in_progress',label: 'In Progress' },
  { id: 'proofed',    label: 'Proofed'     },
] as const

export const COLORS = {
  primary:      '#3730A3',
  primaryHover: '#312a8f',
  primarySoft:  '#eef2ff',
  background:   '#F8FAFC',
  border:       '#e8edf3',
  borderSoft:   '#eef2f6',
  text:         '#0f172a',
  textMuted:    '#64748b',
  textFaint:    '#94a3b8',
}

export const PROJECT_CONFIG: Record<string, { name: string; dot: string; section: 'My Projects' | 'Team Boards' }> = {
  SCRUM: { name: 'Healthy Humans', dot: '#059669', section: 'My Projects' },
}

export const DEFAULT_PROJECT_CONFIG = {
  dot: '#94a3b8',
  section: 'My Projects' as const,
}
