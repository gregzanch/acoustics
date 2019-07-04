const AC = require('../lib/index');
// const DSP = require('./dsp.js');
const nplot = require('./index');

function processIIRFilter(inputBuffer, gain) {
	/*this function takes our input and applies the coefficients via a difference equation.*/

	/*make an output buffer using a vector*/
	let outputBuffer = inputBuffer;
	/*initialize state*/
	let outputPrev = 0;
	/*enforce stability conditions*/
	if (gain >= 1)
	{
		gain = 0.999;
	}
	else if (gain <= -1) {
		gain = -0.999;
	}

	/*loop through samples.
	this implementation would be more efficient if it used iterators.
	but, i think the math is clearer this way.*/
	for (let n = 0; n < inputBuffer.length; n++)
	{
		/*function y[n] = x[n] + (g*y[n-1])*/
		outputBuffer[n] = inputBuffer[n] + (gain*outputPrev);
		/*reset y[n-1]*/
		outputPrev = outputBuffer[n];
	}
	return outputBuffer;
}
module.exports = processIIRFilter;


let unfiltered = new AC.SignalFromFile('res/pinknoise.wav')[0];

let filtered = new AC.Signal({
  samples: new Float32Array(processIIRFilter(Array.from(unfiltered.samples), .9))
})



nplot.plot(Array.from(unfiltered.negate().add(filtered).samples)) //?
