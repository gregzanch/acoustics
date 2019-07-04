/** Calcualtes the electrical power required by an amplifier
 * Marshal Long pg. 689
 * @function PowerDemand
 * @param  {Number} channels - number of amplifier channels (assuming 2 channels per amplifier)
 * @param  {Number} J - rated amplifier output power for one channel in Watts
 * @param  {Number} duty - duty cycle
 * @param  {Number} efficieny - amplifier efficiency
 * @param  {Number} Jq - quiescent power for zero input voltage (defaults to 90W)
 */
export function PowerDemand(
  channels: number,
  J: number,
  duty: number,
  efficieny: number,
  Jq: number = 90
): number {
  return channels * J * duty * (1 / efficieny) + channels * Jq * 0.5;
}

/** Calculates the electrical current from the AC Main (A)
 * @function CurrentDemand
 * @param  {Number} Je - Power Demand
 * @param  {Number} Ve - electrical voltage from the AC Main (V)
 * @param  {Number} f - Power factor (defaults to 0.83)
 */
export function CurrentDemand(
  Je: number,
  Ve: number,
  f: number = 0.83
): number {
  return Je / (Ve * f);
}
