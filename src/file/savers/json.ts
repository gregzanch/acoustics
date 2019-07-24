import { writeFile, writeFileSync } from 'fs';
import { extname } from 'path';
import { strictEqual } from 'assert';

export function json(filename: string, obj: any, sync: boolean = true) {
  let ext = extname(filename).toLowerCase();
  strictEqual(ext, '.json', `not accept ${ext} files, only .json files`);

  if (sync) {
    writeFileSync(filename, JSON.stringify(obj, undefined, 2), 'utf8');
  } else {
    writeFile(
      filename,
      JSON.stringify(obj, undefined, 2),
      {
        encoding: 'utf8',
      },
      err => {
        if (err) console.log(err);
      }
    );
  }
}
