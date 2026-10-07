import type { CSSProperties, HTMLAttributes } from 'react'

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  className?: string
  variant?: 'text' | 'circular' | 'rectangular' | 'card'
  width?: string | number
  height?: string | number
}

export function Skeleton({
  className = '',
  variant = 'rectangular',
  width,
  height,
  style,
  ...props
}: SkeletonProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'circular':
        return 'rounded-full'
      case 'text':
        return 'rounded-lg h-4 w-3/4'
      case 'card':
        return 'rounded-3xl'
      default:
        return 'rounded-2xl'
    }
  }

  const customStyle: CSSProperties = {
    ...style,
    ...(width !== undefined ? { width: typeof width === 'number' ? `${width}px` : width } : {}),
    ...(height !== undefined
      ? { height: typeof height === 'number' ? `${height}px` : height }
      : {}),
  }

  return (
    <div
      role="status"
      aria-label="Carregando conteúdo"
      className={`relative overflow-hidden bg-white/4 border border-white/5 ${getVariantStyles()} ${className}`}
      style={customStyle}
      {...props}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/8 to-transparent animate-shimmer-sweep"
      />
    </div>
  )
}
