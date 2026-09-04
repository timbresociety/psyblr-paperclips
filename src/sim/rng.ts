/**
 * Seeded Deterministic PRNG Service
 * Product Truth: company_sim_v1/AGENTS.md Section 3
 * Never use Math.random() in economic simulation code.
 */

export class SeededRng {
  private state: number;

  constructor(seed: number | string = 123456789) {
    if (typeof seed === 'string') {
      this.state = SeededRng.hashString(seed);
    } else {
      this.state = seed >>> 0;
    }
    if (this.state === 0) {
      this.state = 1;
    }
  }

  private static hashString(str: string): number {
    let hash = 2166136261;
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  /**
   * Mulberry32 algorithm: fast, period 2^32, uniform distribution.
   */
  next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  random(): number {
    return this.next();
  }

  int(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  choice<T>(items: readonly T[]): T {
    if (items.length === 0) throw new Error('Cannot choose from empty array');
    const index = Math.floor(this.next() * items.length);
    return items[index];
  }

  weightedChoice<T>(items: readonly T[], weights: readonly number[]): T {
    if (items.length !== weights.length || items.length === 0) {
      throw new Error('Items and weights length mismatch or empty');
    }
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    let rand = this.next() * totalWeight;
    for (let i = 0; i < items.length; i++) {
      if (rand < weights[i]) return items[i];
      rand -= weights[i];
    }
    return items[items.length - 1];
  }

  shuffle<T>(array: readonly T[]): T[] {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  /**
   * Create an isolated domain stream so that draws in one room/system
   * do not misalign draws in another room across game updates.
   */
  forDomain(domain: string): SeededRng {
    const domainHash = SeededRng.hashString(domain);
    const combinedSeed = ((this.state ^ domainHash) + 0x9e3779b9) >>> 0;
    return new SeededRng(combinedSeed);
  }

  getState(): number {
    return this.state;
  }

  setState(state: number): void {
    this.state = state >>> 0;
  }
}
