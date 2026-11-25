export class Mulberry32 {
  private s: number;

  constructor(seed: number) {
    this.s = seed >>> 0;
  }

  nextUint32(): number {
    this.s = (this.s + 0x6D2B79F5) >>> 0;
    let t = this.s;
    const m1 = (t ^ (t >>> 15)) >>> 0;
    const m2 = (t | 61) >>> 0;
    t = Math.imul(m1, m2) >>> 0;
    t = (t ^ ((t + Math.imul(t ^ (t >>> 7), 61)) >>> 0)) >>> 0;
    return (t ^ (t >>> 14)) >>> 0;
  }

  nextInt(maxExclusive: number): number {
    if (maxExclusive <= 0) throw new RangeError('maxExclusive must be positive');
    const limit = Math.floor(0x100000000 / maxExclusive) * maxExclusive;
    while (true) {
      const value = this.nextUint32();
      if (value < limit) return value % maxExclusive;
    }
  }
}
