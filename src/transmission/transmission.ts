// export function NR({
//   TL,
//   absorption,
//   area,
//   Lsource,
//   Lreciever
// }: {
//     TL: number,
//     absorption: number,
//     area: number,
//     Lsource: number,
//     Lreciever: number
// }) {
//   if (Lsource && Lreciever) {
//     return Lsource - Lreciever;
//   }
//   else if (TL && area && absorption) {
//     return TL + 10 * Math.log10(absorption / area);
//   }
//   else {
//     throw "Not enough input parameters"
//   }
// };
// TL: ({ tau, NR, area, absorption, Z, m, f }) => {
//   if (tau) {
//     return 10 * Math.log10(1 / tau);
//   } else if (NR && area && absorption) {
//     return NR + 10 * Math.log10(area / absorption);
//   } else if (m && f) {
//     return 20 * Math.log10(m) + 20 * Math.log10(f) - 47;
//   }
//   else {
//     throw "Not enough input parameters"
//   }
// },
// coefficient: ({ TL, Z, m, f, rho, L, c }) => {
//   if (TL) {
//     return 1 / (Math.pow(10, TL / 10));
//   }
// },
// compositeTL: (wallElements) => {
//   wallElements.forEach((elt, i, arr) => {
//     if (elt.TL) {
//       arr[i].tau = transmission.coefficient({ TL: elt.TL });
//     }
//     if (!elt.area) {
//       throw "need area";
//     }
//   });
//   let num = wallElements.map(elt => elt.area).reduce((a, b) => a + b);
//   let den = wallElements.map(elt => elt.tau * elt.area).reduce((a, b) => a + b);
//   return 10 * Math.log10(num / den);
// }
