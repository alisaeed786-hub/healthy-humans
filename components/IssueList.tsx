'use client'

interface Props {
  title: string
  items: string[]
  color: 'red' | 'yellow' | 'blue' | 'purple' | 'orange'
  icon: string
}

const colorMap = {
  red: 'bg-red-50 border-red-200 text-red-800',
  yellow: 'bg-amber-50 border-amber-200 text-amber-800',
  blue: 'bg-blue-50 border-blue-200 text-blue-800',
  purple: 'bg-purple-50 border-purple-200 text-purple-800',
  orange: 'bg-orange-50 border-orange-200 text-orange-800',
}

const badgeMap = {
  red: 'bg-red-100 text-red-700',
  yellow: 'bg-amber-100 text-amber-700',
  blue: 'bg-blue-100 text-blue-700',
  purple: 'bg-purple-100 text-purple-700',
  orange: 'bg-orange-100 text-orange-700',
}

export default function IssueList({ title, items, color, icon }: Props) {
  if (items.length === 0) return null

  return (
    <div className={`rounded-lg border p-4 ${colorMap[color]}`}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">{icon}</span>
        <h3 className="font-semibold text-sm">{title}</h3>
        <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${badgeMap[color]}`}>
          {items.length}
        </span>
      </div>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="text-sm flex gap-2">
            <span className="opacity-50 shrink-0 mt-0.5">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
