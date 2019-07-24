import { white } from './white';
import { Signal } from '../signal';
// Adapted from https://github.com/zacharydenton/noise.js/blob/master/noise.js
export function pink(size: number): Signal {
  var out = white(size);
  var b0, b1, b2, b3, b4, b5, b6;

  b0 = b1 = b2 = b3 = b4 = b5 = b6 = 0.0;

  for (var i = 0; i < size; i++) {
    let _white = out.samples[i];

    b0 = 0.99886 * b0 + _white * 0.0555179;
    b1 = 0.99332 * b1 + _white * 0.0750759;
    b2 = 0.969 * b2 + _white * 0.153852;
    b3 = 0.8665 * b3 + _white * 0.3104856;
    b4 = 0.55 * b4 + _white * 0.5329522;
    b5 = -0.7616 * b5 - _white * 0.016898;
    out.samples[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + _white * 0.5362;
    out.samples[i] *= 0.11; // (roughly) compensate for gain
    b6 = _white * 0.115926;
  }
  return out;
}
