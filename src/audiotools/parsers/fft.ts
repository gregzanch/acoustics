import { readFileSync } from 'fs';
import { splitTabular } from '../../util/split-tabular';

interface fl {
  frequency: number;
  level: number;
}

export function FFTFile(filename: string) {
  const module = 'FFT';
  const regex = /^\d+\.?\d*$/gim;
  const table = splitTabular(readFileSync(filename, 'utf8'), {
    line: '\n',
    cell: '\t',
  }).slice(2);
  const foot = table.filter(x => !x[0].match(regex));

  const data = table.reduce((a: fl[], b) => {
    if (b[0].match(regex)) {
      a.push({
        frequency: Number(b[0]),
        level: Number(b[1]),
      });
    }
    return a;
  }, []);
  const stats = Object.fromEntries(
    foot.reduce((a: any, b: any) => {
      if (b[0].length > 0) {
        b[0] = b[0].replace(/\s/gm, '_');
        a.push(b);
      }
      return a;
    }, [])
  );
  return { module, data, stats };
}
