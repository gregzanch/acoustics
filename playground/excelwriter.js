const AC = require('../lib/index');
const fs = require('fs');
const path = require('path');

const inputs = {
  onaxis: {
    control: "/Users/greg/SHAcoustics/fabric_measurements/Control.txt",
    fabrics: [
      "/Users/greg/SHAcoustics/fabric_measurements/A.txt",
      "/Users/greg/SHAcoustics/fabric_measurements/B.txt",
      "/Users/greg/SHAcoustics/fabric_measurements/C.txt"
    ]
  },
  offaxis: {
    control: "/Users/greg/SHAcoustics/fabric_measurements/Control Off Axis.txt",
    fabrics: [
      "/Users/greg/SHAcoustics/fabric_measurements/A off axis.txt",
      "/Users/greg/SHAcoustics/fabric_measurements/B off axis.txt",
      "/Users/greg/SHAcoustics/fabric_measurements/C off axis.txt"
    ]
  }
}
function onaxis() {
  const data = AC.read.RTAFile(inputs.onaxis.control, true).data;
  return []
    .concat([
      [`Frequency`].concat(data.frequency)
    ])
    .concat([
      [`Pink Noise`].concat(data.level)
    ])
    .concat(inputs.onaxis.fabrics.map(x => [path.basename(x)].concat(AC.read.RTAFile(x, true).data.level)))
}

function offaxis() {
  const data = AC.read.RTAFile(inputs.offaxis.control, true).data;
  return []
    .concat([
      [`Frequency`].concat(data.frequency)
    ])
    .concat([
      [`Pink Noise`].concat(data.level)
    ])
    .concat(inputs.offaxis.fabrics.map(x => [path.basename(x)].concat(AC.read.RTAFile(x, true).data.level)))
}

fs.writeFileSync('playground/onaxis.json',JSON.stringify(onaxis()),'utf8'); //?
fs.writeFileSync('playground/offaxis.json', JSON.stringify(offaxis()), 'utf8'); //?
