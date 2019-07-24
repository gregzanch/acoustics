export interface SweepParams {
  bitdepth: number;
  time: number;
  samplerate: number;
  mode: string;
  start: number;
  end: number;
  level: number;
  typed: boolean;
}

export function sweep(params: SweepParams) {
  let bitdepth = params.bitdepth || 16;
  let time = params.time || 1;
  let samplerate = params.samplerate || 44100;
  let mode = params.mode || 'log';
  let start = params.start || 20;
  let end = params.end || 20000;
  let level = params.level || 1;
  let typed = typeof params.typed === 'undefined' ? true : params.typed;
  if (!['log', 'lin'].includes(mode)) {
    throw new Error('invalid mode');
  }

  const map = (val: any, min1: any, max1: any, min2: any, max2: any) => {
    return min2 + ((val - min1) * (max2 - min2)) / (max1 - min1);
  };
  const numSamples = samplerate * time;
  const signal = typed ? new Float32Array(numSamples) : Array(numSamples);

  const { PI, sin, round, ceil, pow } = Math;

  // const f = (a: number, x: number) => pow(2, a * x) - 1;
  const twopi = 2 * PI;
  const mult = level * (pow(2, 16) - 1);
  const freq =
    mode === 'lin'
      ? (x: number) => map(x, 0, time, start, end)
      : (x: number) => map(pow(2, x) - 1, 0, pow(2, time) - 1, start, end);

  if (typed) {
    let buffersize = 1024;
    let nbuffers = ceil(numSamples / buffersize);
    let mult = pow(2, bitdepth);
    let phase = 0;
    for (let i = 0; i < nbuffers; i++) {
      for (let j = 0; j < buffersize; j++) {
        const index = i * buffersize + j;
        phase =
          (phase + freq(index * (time / numSamples)) * (twopi / samplerate)) %
          twopi;
        signal[index] = round(mult * sin(phase) * level) / mult;
      }
    }
  } else {
    let buffersize = 1024;
    let nbuffers = ceil(numSamples / buffersize);
    let phase = 0;
    for (let i = 0; i < nbuffers; i++) {
      for (let j = 0; j < buffersize; j++) {
        const index = i * buffersize + j;
        phase =
          (phase + freq(index * (time / numSamples)) * (twopi / samplerate)) %
          twopi;
        signal[index] = round(((sin(phase) + 1) / 2) * mult);
      }
    }
  }

  return signal;
}
