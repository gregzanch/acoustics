import { writeFileSync } from 'fs';
import { encode } from '../../util/wav';
import { NumericArray } from '../../types';

export function wav(
  outfile: string,
  signal: NumericArray[],
  samplerate: number,
  bitdepth: number
) {
  const buffer = encode([signal], {
    sampleRate: samplerate,
    floatingPoint: true,
    bitDepth: bitdepth,
    channels: signal.length,
  });
  writeFileSync(outfile, buffer, 'binary');
}
