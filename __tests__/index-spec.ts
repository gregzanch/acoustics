import * as AC from '../src/index';

test('Weight', () => expect(AC.Weight).toBeTruthy());
test('Weight:A-weight', () => expect(AC.Weight.A).toBeTruthy());
test('Weight:B-weight', () => expect(AC.Weight.B).toBeTruthy());
test('Weight:C-weight', () => expect(AC.Weight.C).toBeTruthy());
test('Weight:D-weight', () => expect(AC.Weight.D).toBeTruthy());

test('Bands', () => expect(AC.Bands).toBeTruthy());
test('Bands:ThirdOctaveBands', () => expect(AC.Bands.ThirdOctave).toBeTruthy());
test('Bands:OctaveBands', () => expect(AC.Bands.Octave).toBeTruthy());
test('Bands:Flower', () => expect(AC.Bands.Flower).toBeTruthy());
test('Bands:Fupper', () => expect(AC.Bands.Fupper).toBeTruthy());

test('Transmission', () => expect(AC.Transmission).toBeTruthy());
test('Transmission:TL', () => expect(AC.Transmission.TL).toBeTruthy());
test('Transmission:NR', () => expect(AC.Transmission.NR).toBeTruthy());
test('Transmission:tau', () => expect(AC.Transmission.tau).toBeTruthy());
test('Transmission:compositeTL', () =>
  expect(AC.Transmission.compositeTL).toBeTruthy());
