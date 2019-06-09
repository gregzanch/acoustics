import * as AC from '../src/index';

test('Has Weight module', () => expect(AC.Weight).toBeTruthy());
test('Weight Has A-weight module', () => expect(AC.Weight.A).toBeTruthy());
test('Weight Has B-weight module', () => expect(AC.Weight.B).toBeTruthy());
test('Weight Has C-weight module', () => expect(AC.Weight.C).toBeTruthy());
test('Weight Has D-weight module', () => expect(AC.Weight.D).toBeTruthy());

test('Has Bands module', () => expect(AC.Bands).toBeTruthy());
test('Bands Has ThirdOctaveBands module', () =>
  expect(AC.Bands.ThirdOctave).toBeTruthy());
test('Bands Has OctaveBands module', () =>
  expect(AC.Bands.Octave).toBeTruthy());
test('Bands Has Flower module', () => expect(AC.Bands.Flower).toBeTruthy());
test('Bands Has Fupper module', () => expect(AC.Bands.Fupper).toBeTruthy());

test('Has Transmission module', () => expect(AC.Transmission).toBeTruthy());
test('Transmission Has TL module', () =>
  expect(AC.Transmission.TL).toBeTruthy());
test('Transmission Has NR module', () =>
  expect(AC.Transmission.NR).toBeTruthy());
test('Transmission Has tau module', () =>
  expect(AC.Transmission.tau).toBeTruthy());
test('Transmission Has compositeTL module', () =>
  expect(AC.Transmission.compositeTL).toBeTruthy());
