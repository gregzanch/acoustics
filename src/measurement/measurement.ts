import { FrequencyLevel } from '../interfaces/frequency-level';
import { between } from '../util/between';

export class Measurement {
  public data: FrequencyLevel[];
  public name: string;
  constructor(name?: string, data?: FrequencyLevel[]) {
    this.data = data || ([{}] as FrequencyLevel[]);
    this.name = name || 'untitled measurement';
  }
  setData(data: FrequencyLevel[]): Measurement {
    this.data = data;
    return this;
  }
  setName(name: string): Measurement {
    this.name = name;
    return this;
  }
  fromArrays(frequency: number[], level: number[]) {
    this.data = frequency.map((x, i) => {
      return {
        frequency: x,
        level: level[i],
      };
    });
  }
  ats(frequencies: number[]): number[] {
    return frequencies.reduce(
      (prev, curr) => {
        let point: FrequencyLevel[] = this.data.filter(
          x => x.frequency == curr
        );
        prev.push(point[0].level);
        return prev;
      },
      [] as number[]
    );
  }
  at(frequency: number): number {
    return this.data.filter(x => x.frequency == frequency)[0].level;
  }
  range(min: number, max: number): FrequencyLevel[] {
    return this.data.reduce(
      (prev, curr) => {
        if (between(min, max)(curr.frequency)) {
          prev.push(curr);
        }
        return prev;
      },
      [] as FrequencyLevel[]
    );
  }
  operate(
    measurement: Measurement,
    operation: (self: number, other: number) => number,
    applyToThis?: boolean
  ): Measurement {
    applyToThis = applyToThis || false;
    if (applyToThis) {
      this.data = this.data.reduce(
        (prev, curr) => {
          let level = measurement.at(curr.frequency) as number;
          if (level) {
            curr.level = operation(curr.level, level);
          }
          prev.push(curr);
          return prev;
        },
        [] as FrequencyLevel[]
      );
      return this;
    } else {
      let m = new Measurement();
      this.data.forEach(x =>
        m.data.push({
          frequency: x.frequency,
          level: x.level - measurement.at(x.frequency),
        })
      );
      m.data = m.data.reduce(
        (prev, curr) => {
          let level = measurement.at(curr.frequency) as number;
          if (level) {
            curr.level = operation(curr.level, level);
          }
          prev.push(curr);
          return prev;
        },
        [] as FrequencyLevel[]
      );
      return m;
    }
  }
  add(measurement: Measurement, applyToThis?: boolean): Measurement {
    return this.operate(
      measurement,
      (self, other) => self + other,
      applyToThis
    );
  }
  sub(measurement: Measurement, applyToThis?: boolean): Measurement {
    return this.operate(
      measurement,
      (self, other) => self - other,
      applyToThis
    );
  }
  div(measurement: Measurement, applyToThis?: boolean): Measurement {
    return this.operate(
      measurement,
      (self, other) => self / other,
      applyToThis
    );
  }
  mul(measurement: Measurement, applyToThis?: boolean): Measurement {
    return this.operate(
      measurement,
      (self, other) => self * other,
      applyToThis
    );
  }
}
