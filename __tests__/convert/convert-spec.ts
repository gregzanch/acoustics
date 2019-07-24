import * as AC from '../../src/convert/convert';

test('Lp2P at 94db', () => expect(AC.Lp2P(94)).toBeCloseTo(1.0023, 2));
test('Lp2P at 114db', () => expect(AC.Lp2P(114)).toBeCloseTo(10.0237, 2));
test('P2Lp at 1Pa', () => expect(AC.P2Lp(1)).toBeCloseTo(93.9794, 2));
test('P2Lp at 10Pa', () => expect(AC.P2Lp(10)).toBeCloseTo(113.9794, 2));

test('I2Li at 1W/m^2', () => expect(AC.I2Li(1)).toBeCloseTo(120.0, 2));
test('Li2I at 120dB', () => expect(AC.Li2I(120)).toBeCloseTo(1.0, 2));
