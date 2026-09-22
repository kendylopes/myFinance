/**
 * Sintetizador Web Audio nativo para micro-feedbacks táteis elegantes (padrão Apple / Switch).
 * Zero dependências externas e 0 KB de arquivos mp3.
 */

const STORAGE_KEY = 'myfinance_sound_enabled'

class SoundFX {
  private ctx: AudioContext | null = null
  private enabled: boolean

  constructor() {
    this.enabled = typeof window !== 'undefined' && localStorage.getItem(STORAGE_KEY) === 'true'
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (AudioCtx) {
        this.ctx = new AudioCtx()
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {})
    }
    return this.ctx
  }

  public isEnabled(): boolean {
    return this.enabled
  }

  public toggle(): boolean {
    this.enabled = !this.enabled
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, String(this.enabled))
    }
    if (this.enabled) {
      this.playClick()
    }
    return this.enabled
  }

  public playPop(): void {
    this.playClick()
  }

  /**
   * Micro-clique tátil de vidro/cerâmica (curto, suave e elegante)
   */
  public playClick(): void {
    if (!this.enabled) return
    const ctx = this.getContext()
    if (!ctx) return

    try {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      const now = ctx.currentTime

      // Pitch rápido descendente para simular impacto tátil de vidro
      osc.frequency.setValueAtTime(1100, now)
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.035)

      // Envelope de amplitude suave
      gain.gain.setValueAtTime(0.04, now)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(now)
      osc.stop(now + 0.04)
    } catch {
      // Falha silenciosa em navegadores restritos
    }
  }

  /**
   * Harmônico de confirmação sutil de sucesso
   */
  public playSuccess(): void {
    if (!this.enabled) return
    const ctx = this.getContext()
    if (!ctx) return

    try {
      const now = ctx.currentTime
      const freqs = [880, 1320] // A5 e E6

      for (let i = 0; i < freqs.length; i++) {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()

        osc.type = 'sine'
        const startTime = now + i * 0.04

        osc.frequency.setValueAtTime(freqs[i], startTime)
        gain.gain.setValueAtTime(0.03, startTime)
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.12)

        osc.connect(gain)
        gain.connect(ctx.destination)

        osc.start(startTime)
        osc.stop(startTime + 0.13)
      }
    } catch {
      // Falha silenciosa
    }
  }
}

export const soundFX = new SoundFX()
