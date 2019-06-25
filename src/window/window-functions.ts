const hann = (n: number, N: number) =>
  Math.pow(Math.sin((Math.PI * n) / (N - 1)), 2);

/** Hann window
 * @function Hann
 * @param  {number} N Length of the window
 * @returns {number[]} a Hann window of length N
 */
export function Hann(N: number): number[] {
  return Object.keys(Array(N).fill(0)).map(x => hann(Number(x), N));
}
