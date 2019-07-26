import { readFileSync } from 'fs';
import { splitTabular } from '../../util/split-tabular';
import { FrequencyLevel } from '../../interfaces/frequency-level';

export interface RTAFileStats {
  weighting: string;
  octave_mode: string;
  overall_dB?: string;
  decay?: string;
  source?: string;
  latitude?: string;
  longitude?: string;
  saved?: string;
}
export interface RTAFileObject {
  module: string;
  data: FrequencyLevel[];
  stats: RTAFileStats;
}

export function RTAFileFromString(str: string, arrays: boolean = false) {
  const module: string = 'RTA';
  const regex = /^\d+\.?\d*$/gim;
  const table = splitTabular(str, {
    line: '\n',
    cell: '\t',
  }).slice(2);
  const foot = table.filter(x => !x[0].match(regex));

  if (arrays) {
  }
  const data = arrays
    ? table.reduce(
      (a: any, b) => {
        if (b[0].match(regex)) {
          a.frequency.push(Number(b[0]));
          a.level.push(Number(b[1]));
        }
        return a;
      },
      {
        frequency: [],
        level: [],
      }
    )
    : table.reduce((a: FrequencyLevel[], b) => {
      if (b[0].match(regex)) {
        a.push({
          frequency: Number(b[0]),
          level: Number(b[1]),
        });
      }
      return a;
    }, []);
  const _stats = foot.reduce((a: any, b: any) => {
    if (b[0].length > 0) {
      b[0] = b[0].replace(/\s/gm, '_');
      a.push(b);
    }
    return a;
  }, []);

  const stats: RTAFileStats = {
    octave_mode: _stats.octave_mode,
    weighting: _stats.weighting,
  };
  stats.decay = _stats.decay || '';
  stats.latitude = _stats.latitude || '';
  stats.longitude = _stats.longitude || '';
  stats.overall_dB = _stats.overall_dB || '';
  stats.saved = _stats.saved || '';
  stats.source = _stats.source || '';

  const returnObject: RTAFileObject = {
    module,
    data,
    stats,
  };
  return returnObject;
}

export function RTAFile(filename: string, arrays: boolean = false) {
  return RTAFileFromString(readFileSync(filename, 'utf8'), arrays);
}

// export function RTAFiles(query: string | string[] | RegExp): RTAFileObject {
//   if (query instanceof RegExp) {

//   }
//   else if ()
// }
