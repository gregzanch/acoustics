import { readFileSync } from 'fs';
import { splitTabular } from '../../util/split-tabular';

export function IRFile(file: string) {
  let ir = readFileSync(file, 'utf8');

  let categories = [
    'head',
    'octave',
    'third_octave',
    'impulse',
    'etc',
    'schroder',
    'fft',
  ];

  let reductor: any = {};
  let sections = ir.split('\n\n').reduce((prev, curr, index) => {
    prev[categories[index]] = curr;
    return prev;
  }, reductor);

  function formatOctave(str: string) {
    let split = splitTabular(str);
    let head = split[0];
    return split.slice(1).map((x: any) => {
      let reductor2: any = {};
      return x.reduce((prev: any, curr: any, i: number) => {
        let unit = head[i]
          .replace(/^(.+)\s?\((.+)\)$/gim, '$1,$2')
          .split(',')
          .map(x => x.trim().replace(/\/|\s/gm, '_'));
        if (unit[0].match(/band/gim)) {
          unit = ['Band', 'Hz'];
        }
        prev[unit[0]] = {
          value: Number(curr),
          unit: unit[1] || '',
        };
        return prev;
      }, reductor2);
    });
  }
  function formatThirdOctave(str: string) {
    let split = splitTabular(str);
    let head = split[0];
    return split.slice(1).map((x: any) => {
      let reductor2: any = {};
      return x.reduce((prev: any, curr: any, i: number) => {
        let unit = head[i]
          .replace(/^(.+)\s?\((.+)\)$/gim, '$1,$2')
          .split(',')
          .map(x => x.trim().replace(/\/|\s/gm, '_'));
        if (unit[0].match(/band/gim)) {
          unit = ['Band', 'Hz'];
        }
        prev[unit[0]] = {
          value: Number(curr),
          unit: unit[1] || '',
        };
        return prev;
      }, reductor2);
    });
  }

  function formatImpulse(str: string) {
    return splitTabular(str)
      .slice(1)
      .map(x => {
        return {
          time: Number(x[x.length - 1]),
          level: Number(x[1]),
        };
      });
  }

  function formatETC(str: string) {
    return splitTabular(str)
      .slice(1)
      .map(x => {
        return {
          time: Number(x[x.length - 1]),
          level: Number(x[0]),
        };
      });
  }

  function formatFFT(str: string) {
    return splitTabular(str)
      .slice(1)
      .map(x => {
        return {
          frequency: Number(x[1]),
          level: Number(x[0]),
        };
      });
  }

  function formatSchroder(str: string) {
    return splitTabular(str)
      .slice(1)
      .map(x => {
        return {
          time: Number(x[1]),
          level: Number(x[0]),
        };
      });
  }

  return {
    module: 'IR',
    octave: formatOctave(sections.octave),
    third_octave: formatThirdOctave(sections.third_octave),
    ir: formatImpulse(sections.impulse),
    etc: formatETC(sections.etc),
    fft: formatFFT(sections.fft),
    schroder: formatSchroder(sections.schroder),
  };
}
