const spawn = require('child_process').spawn;

const s = spawn('octave', ['--eval', `"[a,fs]=audioread('/Users/greg/ants.wav'); b=fft(a);"`]);

s.stdout.pipe(process.stdout);


