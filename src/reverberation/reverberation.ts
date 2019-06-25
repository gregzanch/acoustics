// /** Computes the Arau-Puchades reverberation time of a space
//  * @param  {number} volume volume of the space
//  * @param  {object} SA 3 component (x,y,z) vector of the surfaces areas
//  * @param  {[object]} alpha array of 3 component (x,y,z) vectors for the mean absorption
//  * @param  {String} [units] TODO convert units
//  */

// export interface ReverbTimeParams{
//   volume: number,
//   SA: Vector,
//   alpha: Vector[],
//   units?: string
// }

// export function ArauPuchades(params: ReverbTimeParams) {
//   params.units = params.units || "ft";
//   let vol = 0.049 * volume;
//   SA.total = Object.keys(SA).map(x => SA[x]).reduce((a, b) => a + b);
//   const rt = alpha.map(a => {
//     return [
//       Math.pow((vol / (-SA.total * Math.log(1 - a.x))), SA.x / SA.total),
//       Math.pow((vol / (-SA.total * Math.log(1 - a.y))), SA.y / SA.total),
//       Math.pow((vol / (-SA.total * Math.log(1 - a.z))), SA.z / SA.total)
//     ].reduce((a, b) => a * b);
//   });
//   return rt
// }

// const vec3 = (x, y, z) => {
//   return {
//     x,
//     y,
//     z
//   }
// }

// const transpose = array => array[0].map((col, i) => array.map(row => row[i]));

// function ArauPuchades_test() {
//   const volume = 3807; //ft
//   const SA = vec3(420, 240, 846);
//   const alpha = transpose([
//     [0.12, 0.10, 0.21, 0.25, 0.23, 0.23, 0.22],
//     [0.39, 0.34, 0.23, 0.21, 0.19, 0.22, 0.24],
//     [0.20, 0.16, 0.24, 0.43, 0.40, 0.39, 0.51]
//   ]).map(a => vec3(a[0], a[1], a[2]));
//   return ArauPuchades(volume, SA, alpha);
// }
