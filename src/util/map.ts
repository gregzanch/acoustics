export function map(
  v: number,
  x1: number,
  x2: number,
  y1: number,
  y2: number
): number {
  return y1 + ((v - x1) * (x2 - y1)) / (y2 - x1);
}
