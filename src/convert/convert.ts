import { allowMultiple } from '../util/allowMultiple';
import { pref, Wref, Iref } from '../std/constants';

export function Lw2Lp(
  Lw: number | number[],
  r: number = 1,
  Q: number = 1
): number | number[] {
  return allowMultiple(
    (x: number) => x - Math.abs(10 * Math.log10(Q / (4 * Math.PI * r * r))),
    Lw
  );
}
export function Lp2Ln(
  Lp: number | number[],
  Ar: number,
  Ao: number = 108
): number | number[] {
  return allowMultiple((lp: number) => lp - 10 * Math.log10(Ao / Ar), Lp);
}

export function P_dB(P: number | number[]): number | number[] {
  return allowMultiple((p: number) => 20 * Math.log10(p / pref.value), P);
}
export function dB_P(Lp: number | number[]): number | number[] {
  return allowMultiple((lp: number) => Math.pow(10, lp / 20) * pref.value, Lp);
}

export function I_dB(I: number | number[]): number | number[] {
  return allowMultiple((i: number) => 10 * Math.log10(i / Iref.value), I);
}
export function dB_I(Li: number | number[]): number | number[] {
  return allowMultiple((li: number) => Math.pow(10, li / 10) * Iref.value, Li);
}

export function W_dB(W: number | number[]): number | number[] {
  return allowMultiple((w: number) => 10 * Math.log10(w / Wref.value), W);
}
export function dB_W(Lw: number | number[]): number | number[] {
  return allowMultiple((lw: number) => Math.pow(10, lw / 10) * Wref.value, Lw);
}
