export function Leq({
  Ls,
  t,
  T,
}: {
  Ls: number;
  t: number;
  T: number;
}): number {
  return Ls + 10 * Math.log10(t / T);
}
