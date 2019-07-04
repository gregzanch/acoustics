const AC = require('../lib/index');
const fs = require('fs');
const http = require('http');
const Stream = require('stream')
const readable = new Stream.Readable()
const request = require('request');
const DSP = require('./dsp.js');

function plot_spectral(data, multiple = false) {
  // @ts-ignore
  readable.pipe(request.post("http://0.0.0.0:45921/nplot/"));
  const layout = {
    xaxis: {
      type: "log",
      autorange: true
    },
    yaxis: {
      type: "linear",
      autorange: true
    }
  };
  if (!multiple) {
    data = [data];
  }
  var traces = data.map(y => {
    return {
      y,
      type: "scatter"
    }
  });


  JSON.stringify([traces, layout], undefined, 2)
    .split("\n")
    .forEach(item => readable.push(item));

  readable.push(null);
}
function plot(data, multiple = false) {

  readable.pipe(request.post("http://0.0.0.0:45921/nplot/"));
  const layout = {
    xaxis: {
      type: "linear",
      autorange: true
    },
    yaxis: {
      type: "linear",
      autorange: true
    }
  };
  if (!multiple) {
    data = [data];
  }
  var traces = data.map(y => {
    if (y.x) {
      return {
            x: y.x,
            y: y.y,
            type: "scatter"
          }
    }
    else {
          return {
            y,
            type: "scatter"
          }
    }

  });

  JSON.stringify([traces, layout], undefined, 2)
    .split("\n")
    .forEach(item => readable.push(item));

  readable.push(null);
}
const sum = (arr) => arr.reduce((a, b) => a + b);
const avg = (arr) => sum(arr) / arr.length;

// let { sampleRate, channelData } = AC.read.wav('res/lcht12.wav')
// let buffersize = 1024;
// channelData = AC.buffer(channelData[0].map(x => Math.abs(x)), buffersize).map(x => avg(x)) //?
// let x = Array(channelData.length).fill(0).map((_, i) => i*buffersize/sampleRate);
// plot({
//   x: x,
//   y: channelData
// });

module.exports = {
  plot_spectral,
  plot
}


// const filepath = "res/pinknoise.wav";

// const filedata = AC.read.wav(filepath);

// const fftdata = AC.fft(filedata.channelData[0], {
  // buffersize: Math.pow(2, 10),
  // window: "Hann"
// });

// plot_spectral(fftdata.map(x => x.map(y => y.absolute())), true);
// plot_spectral([1,1,2,3,4,3,2,3,4])

// let sig = AC.SignalFromFile('res/1khz_distortion.wav')[0];
// let pn = AC.SignalFromFile('res/pinknoise.wav')[0];
// let arr = Array(1024).fill(0).map((x,i)=>Math.sin(i/9.5)*0.1);
// let sig2 = new AC.Signal({ samples: arr });
// plot(
//   Array.from(
//     sig
//       .add(sig2)
//       .negate()
//       .samples
//       .slice(0, 1024)
//   )
// )

