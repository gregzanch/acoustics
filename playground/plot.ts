import * as AC from '../lib/index';

const p = new AC.Plot(45921);

const traces = [];

let max = Math.pow(2, 16);
const noise = AC.Signals.sweep({
  start: 100,
  end: 4,
  level: 0.64,
  bitdepth: 16,
  samplerate: 8000,
  mode: 'lin',
  time: 1,
  typed: false
}).map(x => x / max);



const layout: AC.PlotLayout = {
  title: {
    text: /*html*/ `
     Snare Drum Energy Envelope (800Hz)
    `
  },
  xaxis: {
    title: {
      text: `Time (s)`
    },
    type: 'lin'
  },

  yaxis: {
    title: {
      text: `Level (dBFS)`
    }
  }
}
const opts = {
  scrollZoom: true,
  responsive: true
};





// const wav = AC.read.wav('recordings/src.wav');
// console.log(wav.channelData[0][4]);

// const d = AC.read.wav('/Users/greg/Desktop/sad.L.wav',true).channelData[0]; //?
// const saddel = AC.read.wav('/Users/greg/Desktop/saddel.L.wav', true).channelData[0]; //?
// const sig = {
//   re: Float64Array.from(d),
//   im: Float64Array.from(d).map(x => 0.0)
// }

// AC.transform(sig.re, sig.im);

// const abs = (re, im) => {
//   return Math.sqrt(re * re + im * im);
// }

// const len = sig.re.length; //?
// let data = Array.from(sig.re.map((x, i) => 10 * Math.log10(abs(x, sig.im[i])))).slice(0, len / 2);

// let offset = 94 - AC.db_add(data); //?

// p.plot([{
//   y: data.map(x => x + offset)
// }], layout, opts);


// p.plot(traces.slice(3,4), layout, opts);


interface xcorropts{
  maxdelay?: number
}


const xcorr = (x, y, opts: xcorropts) => {
  if (x.length != y.length) {
    throw new Error('mismatch lengths');
  }
  const maxdelay = opts && opts.maxdelay || x.length;
  const sqrt = Math.sqrt;
  const n = x.length
  /* Calculate the mean of the two series x[], y[] */
  let mx = 0;
  let my = 0;
  for (let i = 0; i < n; i++) {
    mx += x[i];
    my += y[i];
  }
  mx /= n;
  my /= n;

  /* Calculate the denominator */
  let sx = 0;
  let sy = 0;
  for (let i = 0; i < n; i++) {
    sx += (x[i] - mx) * (x[i] - mx);
    sy += (y[i] - my) * (y[i] - my);
  }
  let denom = sqrt(sx * sy);

/* Calculate the correlation series */

  const R = [];

  for (let delay = -maxdelay; delay < maxdelay; delay++) {
    let sxy = 0;
    for (let i = 0; i < n; i++) {
      let j = i + delay;
      if (j < 0 || j >= n)
        continue;
      else
        sxy += (x[i] - mx) * (y[j] - my);
      /* Or should it be (?)
      if (j < 0 || j >= n)
         sxy += (x[i] - mx) * (-my);
      else
         sxy += (x[i] - mx) * (y[j] - my);
      */
    }
    R.push(sxy / denom);

    /* r is the correlation coefficient at "delay" */

  }
  return R;
}

const sad = Array.from(AC.read.wav('/Users/greg/Desktop/sad.L.wav', true).channelData[0]).slice(0, 4000); //?
const saddel = Array.from(AC.read.wav('/Users/greg/Desktop/saddel.L.wav', true).channelData[0]).slice(0, 4000);


const corr = xcorr(sad,saddel, {})//?
const data = [
  {
    y: sad
  },
  {
    y: saddel
  },
  {
    y: corr
  }
];

p.plot(data,layout,opts);

console.log(layout);
console.log(opts);
