import { useMemo } from 'react'

interface BalanceSparklineProps {
  points: number[]
  className?: string
  strokeColor?: string
  gradientId?: string
}

export function BalanceSparkline({
  points,
  className = '',
  strokeColor = '#10b981',
  gradientId = 'sparkline-gradient',
}: BalanceSparklineProps) {
  const { pathD, areaD } = useMemo(() => {
    if (!points || points.length < 2) {
      return { pathD: '', areaD: '' }
    }

    const width = 180
    const height = 48
    const padding = 4

    const min = Math.min(...points)
    const max = Math.max(...points)
    const range = max - min || 1

    const coords = points.map((val, idx) => {
      const x = padding + (idx / (points.length - 1)) * (width - padding * 2)
      // Invertido para SVG: valores maiores ficam no topo
      const y = height - padding - ((val - min) / range) * (height - padding * 2)
      return { x, y }
    })

    // Construção de curva Bézier suave entre os pontos
    let path = `M ${coords[0].x},${coords[0].y}`
    for (let i = 0; i < coords.length - 1; i++) {
      const p0 = coords[i]
      const p1 = coords[i + 1]
      const cpX = (p0.x + p1.x) / 2
      path += ` C ${cpX},${p0.y} ${cpX},${p1.y} ${p1.x},${p1.y}`
    }

    const lastCoord = coords[coords.length - 1]
    const firstCoord = coords[0]
    const area = `${path} L ${lastCoord.x},${height} L ${firstCoord.x},${height} Z`

    return { pathD: path, areaD: area }
  }, [points])

  if (!pathD) {
    return null
  }

  return (
    <div
      className={`overflow-hidden pointer-events-none select-none ${className}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 180 48"
        preserveAspectRatio="none"
        className="w-full h-full opacity-80"
        role="img"
      >
        <title>Gráfico de tendência de saldo</title>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={strokeColor} stopOpacity="0.35" />
            <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
          </linearGradient>
        </defs>
        <path d={areaD} fill={`url(#${gradientId})`} />
        <path
          d={pathD}
          fill="none"
          stroke={strokeColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="drop-shadow-[0_2px_8px_rgba(16,185,129,0.3)]"
        />
      </svg>
    </div>
  )
}
