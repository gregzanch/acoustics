export function BladePassageFrequency({
  N,
  R,
  n,
}: {
  N: number;
  R: number;
  n: number;
}) {
  return (n * N * R) / 60;
}
