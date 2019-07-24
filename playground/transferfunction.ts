import * as AC from '../src/index';
// const ndarray = require("ndarray");

const src = {
  re: [.1, .50, 0, 0],
  im: [0, 0, 0, 0]
};

const rec = {
  re: [1, 0, 1, 0],
  im: [0, 0, 0, 0]
}

const plot = new AC.Plot(45921)


const fftsrc = {
  re: src.re.slice(),
  im: src.im.slice()
}

const fftrec = {
  re: rec.re.slice(),
  im: rec.im.slice()
}

AC.transform(fftsrc.re, fftsrc.im);
AC.transform(fftrec.re, fftrec.im);

const conj = a => {
  return {
    re: a.re.slice(),
    im: a.im.map(x=>-x)
  }
}

const copy = a => {
  return {
    re: a.re.slice(),
    im: a.im.slice()
  }
}


function mul(a, b) {
  return {
    re: a.re.map((_,i)=>a.re[i] * b.re[i] - a.im[i] * b.im[i]),
    im: a.re.map((_,i)=>a.re[i] * b.im[i] + a.im[i] * b.re[i])
  }
}

function div(a, b) {
  const p = mul(a, conj(b));
  return {
    re: a.re.map((_, i) => p.re[i] / (b.re[i] * b.re[i] + b.im[i] * b.im[i])),
    im: a.re.map((_, i) => p.im[i] / (b.re[i] * b.re[i] + b.im[i] * b.im[i]))
  }
}

const tf = div(copy(fftrec), copy(fftsrc))

AC.inverseTransform(tf.re, tf.im)

tf //?

plot.plot([
  {
    y: src.re
  },
  {
    y: rec.re
  },
  {
    y: tf.re
  }
], {

  });

AC.Lw2Lp
