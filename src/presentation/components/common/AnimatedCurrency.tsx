import { useEffect, useRef, useState } from 'react'
import { formatCurrencyBRL } from '../../../core/formatters/currency'

interface AnimatedCurrencyProps {
  value: number
  className?: string
  duration?: number
  'data-testid'?: string
}

export function AnimatedCurrency({
  value,
  className = '',
  duration = 600,
  'data-testid': testId,
}: AnimatedCurrencyProps) {
  const [displayValue, setDisplayValue] = useState<number>(value)
  const previousValueRef = useRef<number>(value)
  const animFrameRef = useRef<number | null>(null)

  useEffect(() => {
    const startValue = previousValueRef.current
    const targetValue = value

    // Se o valor não mudou, apenas atualiza
    if (startValue === targetValue) {
      setDisplayValue(targetValue)
      return
    }

    // Suporte a acessibilidade: respeitar preferência de movimento reduzido
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReducedMotion || duration <= 0) {
      setDisplayValue(targetValue)
      previousValueRef.current = targetValue
      return
    }

    const startTime = performance.now()

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Easing cúbico desacelerado (ease-out-cubic): 1 - (1 - t)^3
      const ease = 1 - (1 - progress) ** 3
      const current = startValue + (targetValue - startValue) * ease

      setDisplayValue(current)

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate)
      } else {
        setDisplayValue(targetValue)
        previousValueRef.current = targetValue
      }
    }

    animFrameRef.current = requestAnimationFrame(animate)

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current)
      }
    }
  }, [value, duration])

  return (
    <span className={className} data-testid={testId} title={formatCurrencyBRL(value)}>
      {formatCurrencyBRL(displayValue)}
    </span>
  )
}
