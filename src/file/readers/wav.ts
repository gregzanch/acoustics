import { readFile, readFileSync } from 'fs';
import { extname } from 'path';
import { decode } from '../../util/wav';
import { strictEqual } from 'assert';

export function wav(filename: string, sync: boolean = true): any {
  let ext = extname(filename).toLowerCase();
  strictEqual(
    extname(filename).toLowerCase(),
    '.wav',
    `readWAVFile does not accept ${ext} files, only .wav file`
  );

  if (sync) return decode(readFileSync(filename));
  return new Promise(function(resolve) {
    return readFile(filename, (err, data) => {
      if (err) throw err;
      resolve(decode(data));
    });
  });
}
