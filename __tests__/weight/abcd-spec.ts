import { A, B, C, D } from '../../src/weight/abcd';
import { third_octave } from '../../src/std/bands';
import { weight } from '../../src/std/weight';

test('should match standard 1/3 Octave Band A-weight values', () => {
  const calculated: number[] = A(third_octave);
  calculated.forEach(function(x, i) {
    expect(x).toBeCloseTo(weight.A[i], 1);
  });
});
test('should match standard 1/3 Octave Band B-weight values', () => {
  const calculated: number[] = B(third_octave);
  calculated.forEach(function(x, i) {
    expect(x).toBeCloseTo(weight.B[i], 1);
  });
});
test('should match standard 1/3 Octave Band C-weight values', () => {
  const calculated: number[] = C(third_octave);
  calculated.forEach(function(x, i) {
    expect(x).toBeCloseTo(weight.C[i], 1);
  });
});
test('should match standard 1/3 Octave Band D-weight values', () => {
  const calculated: number[] = D(third_octave);
  calculated.forEach(function(x, i) {
    expect(x).toBeCloseTo(weight.D[i], 1);
  });
});
