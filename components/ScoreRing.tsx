'use client'

interface Props {
  score: number
}

export default function ScoreRing({ score }: Props) {
  const radius = 36
  const circumference = 2 * Math.PI * radius
  const filled = (score / 10) * circumference
  const color =
    score >= 7 ? '#10b981' : score >= 4 ? '#f59e0b' : '#ef4444'

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="96" height="96" viewBox="0 0 96 96">
        <circle
          cx="48"
          cy="48"
          r={radius}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="8"
        />
        <circle
          cx="48"
          cy="48"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={`${filled} ${circumference - filled}`}
          strokeDashoffset={circumference / 4}
          strokeLinecap="round"
        />
        <text
          x="48"
          y="53"
          textAnchor="middle"
          fontSize="22"
          fontWeight="700"
          fill={color}
        >
          {score}/10
        </text>
      </svg>
      <span className="text-xs text-slate-500 font-medium">Ticket Health</span>
    </div>
  )
}
