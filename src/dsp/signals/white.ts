import { Signal } from '../signal';

export function white(size: number): Signal {
  let sig = new Float32Array(size);
  for (let i = 0; i < size; i++) {
    sig[i] = (Math.random() << 1) - 1;
  }
  return new Signal({ samples: sig });
}
