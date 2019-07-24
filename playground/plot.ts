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
    }
  },

  yaxis: {
    title: {
      text: `Level (dBFS)`
    }
  }
}
const opts = {
  scrollZoom: true
};


// p.plot(traces, layout, opts);


// const wav = AC.read.wav('recordings/src.wav');
// console.log(wav.channelData[0][4]);

const d = AC.transpose(AC.read.csv('/Users/greg/Downloads/lcht/peaksnare.csv')); //?
d.forEach(y => {
  const x = Array(150).fill(0).map((_, i) => i * 256 / 48000);
  for (let j = 0; j < 10; j++) {
    y = y.map((a, i) => {
      if (i > 1 && i < y.length - 1) {
        return (Number(y[i - 1]) + Number(y[i + 1])) / 2;
      }
      else {
        return a
      }
    })
  }

  return traces.push({
    x,
    y,
    marker: {
      size: 2
    },
  });
})

p.plot(traces.slice(3,4), layout, opts);




