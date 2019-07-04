// import { buffer } from '../util/buffer';
// import { max } from '../util/max';
import { wav } from '../file/readers/wav';

export interface SignalParams {
  frequency?: number;
  amplitude?: number;
  phase?: number;
  length?: number;
  nsamples?: number;
  samplerate?: number;
  buffersize?: number;
  samples: Float32Array;
}

export class Signal {
  public samplerate: any;
  public buffersize: any;
  public samples: Float32Array;
  length: any;

  constructor();
  constructor(params: SignalParams);
  constructor(params?: any) {
    this.samplerate = (params && params.samplerate) || undefined;
    this.buffersize = (params && params.buffersize) || undefined;
    this.samples = (params && params.samples) || new Float32Array([0]);
    this.length = this.samples.length;
  }
  public negate(): Signal {
    this.samples = this.samples.map((x: number) => -x);
    return this;
  }
  public add(signal: Signal, offset: number = 0): Signal {
    const newlength: number = Math.max(this.length, signal.length) + offset;
    this.samples = new Float32Array(newlength).map((_, i: number) => {
      return (this.samples[i] || 0) + (signal.samples[i - offset] || 0);
    });
    this.length = this.samples.length;
    return this;
  }
  public dc(amount: number): Signal {
    this.samples = this.samples.map(x => x + amount);
    return this;
  }
  public normalize(): Signal {
    return this;
  }
  public pad(N: number, val: number = 0.0): Signal {
    this.samples = new Float32Array(this.samples.length + N).map((_, i) => {
      return this.samples[i] || val;
    });
    this.length = this.samples.length;
    return this;
  }
}

export function SignalFromFile(file: string): Signal[] {
  let wavfile = wav(file);
  let signals = wavfile.channelData.map(
    (x: Float32Array) =>
      new Signal({
        samples: x,
        samplerate: wavfile.sampleRate,
      })
  );
  return signals;
}

// let pn = SignalFromFile('res/pinknoise.wav')[0];
// let dist = SignalFromFile('res/1khz_distortion.wav')[0];

// let sig = new Signal({
//   samples: new Float32Array([0, 0.2, -0.2, 0.1, 0, 0.1]),
// });
