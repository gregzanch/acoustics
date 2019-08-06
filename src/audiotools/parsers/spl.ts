import { readFileSync } from 'fs';
import { splitTabular } from '../../util/split-tabular';

export interface SPLData {
  point: string;
  LZeq: number | string;
  LAeq: number | string;
  LCeq: number | string;
  '25Hz': number | string;
  '32Hz': number | string;
  '40Hz': number | string;
  '50Hz': number | string;
  '63Hz': number | string;
  '80Hz': number | string;
  '100Hz': number | string;
  '125Hz': number | string;
  '160Hz': number | string;
  '200Hz': number | string;
  '250Hz': number | string;
  '315Hz': number | string;
  '400Hz': number | string;
  '500Hz': number | string;
  '630Hz': number | string;
  '800Hz': number | string;
  '1kHz': number | string;
  '1.25kHz': number | string;
  '1.6kHz': number | string;
  '2kHz': number | string;
  '2.5kHz': number | string;
  '3.1kHz': number | string;
  '4kHz': number | string;
  '5kHz': number | string;
  '6.3kHz': number | string;
  '8kHz': number | string;
  '10kHz': number | string;
  '12.5kHz': number | string;
  '16kHz': number | string;
  '20kHz': number | string;
  L01: number | string;
  L10: number | string;
  L50: number | string;
  L90: number | string;
  L95: number | string;
  LMin: number | string;
  LMax: number | string;
}
export interface SPLFileObject {
  header?: any;
  data: SPLData[];
  stats: any;
}

export function SPLFileFromString(str: string) {
  const raw = splitTabular(str, { line: '\n', cell: '\t' });

  let found = false;
  const stats: any = [];
  let rawdata = raw.reduce(
    (a, b) => {
      if (b[0].match(/^point/gim)) {
        found = true;
      }
      if (found) {
        a.push(b);
      } else {
        stats.push(b);
      }
      return a;
    },
    [] as string[][]
  );

  rawdata[0] = rawdata[0].map(x =>
    x.replace('1/3 Octave ', '').replace(' ', '')
  );

  const objarr = rawdata.slice(1).reduce(
    (a, b) => {
      const obj = {} as SPLData;
      rawdata[0].forEach((x, i) => {
        // @ts-ignore: Unreachable code error
        obj[x] = b[i];
      });
      if (obj.point !== '') {
        obj.point = obj.point.replace(/\"+/gim, '').trim();
        a.push(obj);
      }
      return a;
    },
    [] as SPLData[]
  );

  const returnObject: SPLFileObject = {
    header: stats[0],
    stats: stats
      .slice(1)
      .filter((x: any) => x[0].length > 0)
      .reduce((a: any, b: any) => {
        a[b[0]] = b[1];
        return a;
      }, {}),
    data: objarr,
  };
  return returnObject;
}

export function SPLFile(filename: string) {
  return SPLFileFromString(readFileSync(filename, 'utf8'));
}
