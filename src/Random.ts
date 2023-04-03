export type PRNG = () => number;
export function seededRandom(seed: number): PRNG {
    if (seed === 0) throw new Error("Seed cannot be zero...");
    let value = seed;
    return () => {
        value = Math.sin(value) * 10000;
        return value - Math.floor(value);
    }
}

export function randomInt(rng: PRNG): number {
    return Math.floor(rng() * Number.MAX_SAFE_INTEGER);
}