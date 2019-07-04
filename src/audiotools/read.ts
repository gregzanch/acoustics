import { readFileSync } from 'fs';
import { FFTFile, RTAFile, IRFile, ETCFile } from './parsers';

export function readFile(
  filename: string,
  { module = 'infer' }: { module?: string } = {}
): any {
  if (module === 'infer') {
    module = readFileSync(filename, 'utf8')
      .split('AudioTools')[0]
      .trim();
  }
  switch (module) {
    case 'FFT':
      return FFTFile(filename);
      break;
    case 'Impulse Response':
      return IRFile(filename);
      break;
    case 'ETC':
      return ETCFile(filename);
      break;
    case 'RTA':
      return RTAFile(filename);
      break;
  }
}
