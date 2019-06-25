const ac = require('./lib/acoustics.js');

const abs = Object.fromEntries(ac.AirAttenuation(
  ac.Bands.ThirdOctave(),
  20,
  50
).map((x, i) => {
  return [ac.Bands.ThirdOctave()[i], x]
}));


console.log(ac.Bands.ThirdOctave().slice(3).map(x => {
  return (abs[String(x)]);
}).join("\n"))
