import { readFile, readFileSync } from 'fs';
import { extname } from 'path';
import { strictEqual } from 'assert';

export function json(filename: string, sync: boolean = true) {
  let ext = extname(filename).toLowerCase();
  strictEqual(ext, '.json', `not accept ${ext} files, only .json files`);

  if (sync) return JSON.parse(readFileSync(filename, 'utf8'));
  return new Promise(function(resolve) {
    return readFile(filename, 'utf8', (err, data) => {
      if (err) throw err;
      resolve(JSON.parse(data));
    });
  });
}
