/**
 * Procedural Web Audio API sound synthesizer for SoloUnicorn.
 * Generates tactile mechanical clicks, magnetic snaps, cash ticks,
 * alerts and milestone sweeps without any external audio asset dependencies.
 */
class ProceduralAudioEngine {
  private ctx: AudioContext | null = null
  private muted = false
  private volume = 0.35

  private initContext(): AudioContext | null {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (AudioCtx) {
        this.ctx = new AudioCtx()
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume()
    }
    return this.ctx
  }

  setMuted(muted: boolean) {
    this.muted = muted
  }

  isMuted() {
    return this.muted
  }

  toggleMute() {
    this.muted = !this.muted
    return this.muted
  }

  /**
   * Tactile mechanical switch click (Leica / Teenage engineering dial click)
   */
  playClick() {
    if (this.muted) return
    const ctx = this.initContext()
    if (!ctx) return

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const now = ctx.currentTime

    osc.type = 'triangle'
    osc.frequency.setValueAtTime(1200, now)
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.025)

    gain.gain.setValueAtTime(this.volume * 0.4, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now)
    osc.stop(now + 0.025)
  }

  /**
   * Magnetic snap (Product component slotting / magnetic docking)
   */
  playSnap() {
    if (this.muted) return
    const ctx = this.initContext()
    if (!ctx) return

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const now = ctx.currentTime

    osc.type = 'sine'
    osc.frequency.setValueAtTime(440, now)
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.04)

    gain.gain.setValueAtTime(this.volume * 0.5, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now)
    osc.stop(now + 0.045)
  }

  /**
   * Restrained financial tick / cash register tone
   */
  playCashTick() {
    if (this.muted) return
    const ctx = this.initContext()
    if (!ctx) return

    const now = ctx.currentTime

    // Two-tone bell harmonic
    const freqs = [1760, 2640]
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, now)

      gain.gain.setValueAtTime((this.volume * 0.4) / (idx + 1), now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(now)
      osc.stop(now + 0.18)
    })
  }

  /**
   * Resisted card swipe release
   */
  playSwipe() {
    if (this.muted) return
    const ctx = this.initContext()
    if (!ctx) return

    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(280, now)
    osc.frequency.exponentialRampToValueAtTime(540, now + 0.06)

    gain.gain.setValueAtTime(this.volume * 0.3, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now)
    osc.stop(now + 0.06)
  }

  /**
   * Attention warning or urgent alert
   */
  playWarning() {
    if (this.muted) return
    const ctx = this.initContext()
    if (!ctx) return

    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(420, now)
    osc.frequency.setValueAtTime(320, now + 0.08)

    gain.gain.setValueAtTime(this.volume * 0.25, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now)
    osc.stop(now + 0.16)
  }

  /**
   * Monumental / Ethereal milestone sweep ($1B Unicorn achievement)
   */
  playMilestone() {
    if (this.muted) return
    const ctx = this.initContext()
    if (!ctx) return

    const now = ctx.currentTime
    const chord = [523.25, 659.25, 783.99, 1046.50, 1318.51] // C Major 9 chord

    chord.forEach((freq, idx) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, now + idx * 0.08)

      gain.gain.setValueAtTime(0, now)
      gain.gain.linearRampToValueAtTime(this.volume * 0.35, now + idx * 0.08 + 0.05)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(now + idx * 0.08)
      osc.stop(now + 1.2)
    })
  }

  /**
   * Juicy squash / whack effect (Bills Must Be Paid squashing mechanic)
   */
  playSquash() {
    if (this.muted) return
    const ctx = this.initContext()
    if (!ctx) return

    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    // Punchy downward pitch drop for rubbery impact
    osc.frequency.setValueAtTime(320, now)
    osc.frequency.exponentialRampToValueAtTime(55, now + 0.08)

    gain.gain.setValueAtTime(this.volume * 0.7, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now)
    osc.stop(now + 0.08)
  }

  /**
   * Ascending 3-tone chime for Gossip Harbor item merging
   */
  playMerge(tier: number = 2) {
    if (this.muted) return
    const ctx = this.initContext()
    if (!ctx) return

    const now = ctx.currentTime
    const baseFreq = 440 * Math.pow(1.12, Math.min(6, tier))
    const chord = [baseFreq, baseFreq * 1.25, baseFreq * 1.5]

    chord.forEach((freq, idx) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, now + idx * 0.035)

      gain.gain.setValueAtTime(this.volume * 0.45, now + idx * 0.035)
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.035 + 0.12)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(now + idx * 0.035)
      osc.stop(now + idx * 0.035 + 0.12)
    })
  }

  /**
   * Tactile foil scratch sound for Scritchy Scratchers
   */
  playScratch() {
    if (this.muted) return
    const ctx = this.initContext()
    if (!ctx) return

    const now = ctx.currentTime
    // Procedural noise burst for friction feel
    const bufferSize = Math.floor(ctx.sampleRate * 0.04)
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const output = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1
    }

    const whiteNoise = ctx.createBufferSource()
    whiteNoise.buffer = buffer

    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.setValueAtTime(2400 + Math.random() * 800, now)
    filter.Q.setValueAtTime(3.0, now)

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(this.volume * 0.35, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04)

    whiteNoise.connect(filter)
    filter.connect(gain)
    gain.connect(ctx.destination)

    whiteNoise.start(now)
    whiteNoise.stop(now + 0.04)
  }

  /**
   * Crisp pop for uncovering a Green Apple
   */
  playApplePop() {
    if (this.muted) return
    const ctx = this.initContext()
    if (!ctx) return

    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(587.33, now) // D5
    osc.frequency.exponentialRampToValueAtTime(1174.66, now + 0.05) // D6

    gain.gain.setValueAtTime(this.volume * 0.5, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now)
    osc.stop(now + 0.07)
  }

  /**
   * Sour buzzer when a Rotten Apple trap is hit
   */
  playRottenBuzzer() {
    if (this.muted) return
    const ctx = this.initContext()
    if (!ctx) return

    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(190, now)
    osc.frequency.linearRampToValueAtTime(110, now + 0.18)

    gain.gain.setValueAtTime(this.volume * 0.4, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now)
    osc.stop(now + 0.18)
  }

  /**
   * Escalating pitch multiplier chime for streak squashes
   */
  playCombo(comboCount: number) {
    if (this.muted) return
    const ctx = this.initContext()
    if (!ctx) return

    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    const basePitch = 523.25 // C5
    const pitch = basePitch * Math.pow(1.1, Math.min(10, comboCount))

    osc.type = 'triangle'
    osc.frequency.setValueAtTime(pitch, now)
    osc.frequency.exponentialRampToValueAtTime(pitch * 1.5, now + 0.08)

    gain.gain.setValueAtTime(this.volume * 0.45, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now)
    osc.stop(now + 0.1)
  }

  /**
   * Heavy 80Hz Sub-bass drop for major events (contract closes, venture rounds, high-tier merges)
   */
  playSubDrop() {
    if (this.muted) return
    const ctx = this.initContext()
    if (!ctx) return

    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(95, now)
    osc.frequency.exponentialRampToValueAtTime(32, now + 0.35)

    gain.gain.setValueAtTime(this.volume * 0.8, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now)
    osc.stop(now + 0.38)
  }

  /**
   * Balatro-style ascending arpeggio pitch ladder for consecutive scoring actions
   */
  playBalatroPitchClimb(step: number = 0) {
    if (this.muted) return
    const ctx = this.initContext()
    if (!ctx) return

    const now = ctx.currentTime
    // Pentatonic scale degrees: C, D, E, G, A
    const pentatonicRatios = [1, 9/8, 5/4, 3/2, 5/3, 2, 9/4, 5/2, 3, 10/3, 4]
    const ratio = pentatonicRatios[Math.min(step, pentatonicRatios.length - 1)]
    const baseFreq = 440 * ratio

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'triangle'
    osc.frequency.setValueAtTime(baseFreq, now)
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.05, now + 0.07)

    gain.gain.setValueAtTime(this.volume * 0.5, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now)
    osc.stop(now + 0.09)
  }

  /**
   * Tactile mechanical switch click with white-noise transient
   */
  playMechanicalClick() {
    if (this.muted) return
    const ctx = this.initContext()
    if (!ctx) return

    const now = ctx.currentTime

    // Noise burst for mechanical transient
    const bufferSize = Math.floor(ctx.sampleRate * 0.008)
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1
    }

    const noise = ctx.createBufferSource()
    noise.buffer = buffer
    const noiseGain = ctx.createGain()
    noiseGain.gain.setValueAtTime(this.volume * 0.15, now)
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.008)
    noise.connect(noiseGain)
    noiseGain.connect(ctx.destination)
    noise.start(now)

    // Tonal pop
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(1400, now)
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.018)
    gain.gain.setValueAtTime(this.volume * 0.45, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.018)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.018)
  }

  /**
   * Rapid coin cascade chime for invoice collections and big cash rewards
   */
  playCashCascade() {
    if (this.muted) return
    const ctx = this.initContext()
    if (!ctx) return

    const now = ctx.currentTime
    const notes = [1318.51, 1567.98, 2093.00, 2637.02] // E6, G6, C7, E7

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, now + idx * 0.04)

      gain.gain.setValueAtTime(0, now)
      gain.gain.linearRampToValueAtTime(this.volume * 0.35, now + idx * 0.04 + 0.005)
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.12)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(now + idx * 0.04)
      osc.stop(now + idx * 0.04 + 0.12)
    })
  }

  /**
   * Resonant laser sweep for critical compiles, socket fills, and pod releases
   */
  playLaserSweep() {
    if (this.muted) return
    const ctx = this.initContext()
    if (!ctx) return

    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(2400, now)
    osc.frequency.exponentialRampToValueAtTime(440, now + 0.12)

    gain.gain.setValueAtTime(this.volume * 0.25, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now)
    osc.stop(now + 0.12)
  }

  /**
   * Resonant harmonic chord for unlocking or drafting Relics and Upgrades
   */
  playRelicAcquire() {
    if (this.muted) return
    const ctx = this.initContext()
    if (!ctx) return

    const now = ctx.currentTime
    const chord = [392.00, 493.88, 587.33, 783.99, 987.77] // G Major 9

    chord.forEach((freq, idx) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, now + idx * 0.05)

      gain.gain.setValueAtTime(0, now)
      gain.gain.linearRampToValueAtTime(this.volume * 0.4, now + idx * 0.05 + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(now + idx * 0.05)
      osc.stop(now + 0.8)
    })
  }

  /**
   * Rising synth power-up sound for system failovers and instant recovery
   */
  playPowerUp() {
    if (this.muted) return
    const ctx = this.initContext()
    if (!ctx) return

    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(220, now)
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.25)

    gain.gain.setValueAtTime(this.volume * 0.35, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now)
    osc.stop(now + 0.28)
  }
}

export const sound = new ProceduralAudioEngine()
