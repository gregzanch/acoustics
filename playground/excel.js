const Excel = require('exceljs/modern.nodejs');

const filename = 'playground/fabric.xlsx'

// read from a file
var workbook = new Excel.Workbook();
workbook.xlsx.readFile(filename)
  .then(function () {
   // Iterate over all sheets
   // Note: workbook.worksheets.forEach will still work but this is better
   workbook.eachSheet(function (worksheet, sheetId) {
     console.log(sheetId); //?
   });

   // fetch sheet by name
   var worksheet = workbook.getWorksheet('My Sheet');

   // fetch sheet by id
   var worksheet = workbook.getWorksheet(1);
  });

// // pipe from stream
// var workbook = new Excel.Workbook();
// stream.pipe(workbook.xlsx.createInputStream());

// // load from buffer
// var workbook = new Excel.Workbook();
// workbook.xlsx.load(data)
//   .then(function () {
//     // use workbook
//   });
