/**
 * Deterministic pseudo-random number generator using SplitMix32 / Mulberry32.
 * Ensures runs are 100% reproducible given the same seed and sequence.
 */
export class DeterministicRNG {
  private state: number

  constructor(seed: number) {
    this.state = seed >>> 0
  }

  /**
   * Generates a 32-bit unsigned integer.
   */
  nextUint32(): number {
    this.state = (this.state + 0x6d2b79f5) | 0
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0)
  }

  /**
   * Returns a float in [0, 1).
   */
  nextFloat(): number {
    return this.nextUint32() / 4294967296
  }

  /**
   * Returns an integer in [min, max] inclusive.
   */
  nextInt(min: number, max: number): number {
    return Math.floor(this.nextFloat() * (max - min + 1)) + min
  }

  /**
   * Normal distributed sample (Box-Muller) with mean and standard deviation.
   */
  nextGaussian(mean = 0, stdDev = 1): number {
    let u1 = this.nextFloat()
    let u2 = this.nextFloat()
    while (u1 === 0) u1 = this.nextFloat()
    while (u2 === 0) u2 = this.nextFloat()
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2)
    return z0 * stdDev + mean
  }
}
