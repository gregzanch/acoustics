export function AirSpring({
  Patm,
  m,
  gamma,
  S,
  h,
}: {
  Patm: number;
  m: number;
  gamma: number;
  S: number;
  h: number;
}) {
  if (gamma && Patm && S && m && h) {
    return (1 / (Math.PI * 2)) * Math.sqrt((gamma * Patm * S) / (m * h));
  } else return undefined;
}
