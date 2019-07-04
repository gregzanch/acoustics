/**
 * @param  {} n
 * @param  {} Ns
 * @param  {} Nb
 * @param  {} R
 * @param  {} k GCF
 */
export function StrutFrequency({
  n,
  Ns,
  Nb,
  R,
  k,
}: {
  n: number;
  Ns: number;
  Nb: number;
  R: number;
  k: number;
}): number {
  return (n * Ns * Nb * R) / (60 * k);
}
