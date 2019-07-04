import { splitTabular } from '../../util/split-tabular';
import { readFile, readFileSync } from 'fs';

export function tsv(filename: string, sync: boolean = true) {
  const splitOptions = {
    line: '\n',
    cell: '\t',
  };
  if (sync) return splitTabular(readFileSync(filename, 'utf8'), splitOptions);
  return new Promise(function(resolve) {
    return readFile(filename, 'utf8', (err, data) => {
      if (err) throw err;
      resolve(splitTabular(data, splitOptions));
    });
  });
}
