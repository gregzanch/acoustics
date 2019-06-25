import { readFileSync } from 'fs';

export interface TimeLevel {
  time: number;
  level: number;
}

export class ETCFile {
  filename: string;
  module = 'ETC';
  level: any[];
  stats: object;
  constructor(filename: string) {
    this.filename = filename;
    let foot: any[] = [];
    let reductor: TimeLevel[] = [];
    this.level = readFileSync(this.filename, 'utf8')
      .split('\n')
      .slice(2)
      .map(x => x.split('\t'))
      .reduce((a, b) => {
        if (b[0].match(/^\d+\.?\d*$/gim)) {
          const time = Number(b[0]);
          const level = Number(b[1]);
          const obj = {
            time,
            level,
          };
          a.push(obj);
        } else {
          foot.push(b);
        }
        return a;
      }, reductor);
    this.stats = Object.fromEntries(
      foot.reduce((a, b) => {
        if (b[0].length > 0) {
          b[0] = b[0].replace(/\s/gm, '_');
          a.push(b); //?
        }
        return a;
      }, [])
    );
  }
  getFrequencies() {
    return this.level.map(x => x.frequency);
  }
  getLevels() {
    return this.level.map(x => x.level);
  }
}