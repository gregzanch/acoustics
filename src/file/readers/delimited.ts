import * as EventEmitter from 'events';
import * as readline from 'readline';
import * as fs from 'fs';
import { Stream } from 'stream';

/**
 * A simple class for reading a delimited text file and output-ing each record as an object.
 * With the constructor the user can specify:
 * <ol>
 *     <li>The column delimiter.</li>
 *     <li>The name of the fields to be applied to each column in the returned object.</li>
 *     <li>A starting character to be interpreted as a comment.</li>
 * </ol>
 * This class is an emitter. The following events are emitted:
 * <ul>
 *      <li>close - File reading is complete and all records have been emitted.</li>
 *      <li>comment - A comment was encountered. The entire line is returned.</li>
 *      <li>data - Contains an object representing the record.</li>
 *      <li>error - Contains the error message.</li>
 *      <li>invalid - A record was encountered with the wrong number of fields. The line is returned</li>
 *
 * </ul>
 *
 * @class
 * @extends EventEmitter
 */
export class DelimitedFileReader extends EventEmitter {
  delimiter: RegExp;
  fields: never[];
  commentChar: string;
  numberOfValidRecords: number;
  numberOfInvalidRecords: number;
  numberOfComments: number;

  /**
   * Constructor. Sets the delimiter, column names and comment character
   * @param {
   * @param [delimiter=/[,]/] Regex delimiter used to separate fields
   * @param {string[]} [fields=[]] Array of Field names to apply to the fields
   * @param {string} [commentChar='#'] Character to indicate a comment, when found in first position
   */
  constructor(delimiter = /[,]/, fields = [], commentChar = '#') {
    super();
    // If an array is passed to the constructor store it

    this.delimiter = delimiter;
    this.fields = Array.isArray(fields) ? fields : [];
    this.commentChar = commentChar;
    this.numberOfValidRecords = 0;
    this.numberOfInvalidRecords = 0;
    this.numberOfComments = 0;
  }

  /**
   * Parse the given filename. Prior to this call the user has subscribed to
   * the various events. If the promise is resolved, the reading will begin.
   * @param {string | Stream} filenameOrStream - String filename or readable stream
   * @returns {Promise} Resolves and returns the stream if everything is OK.
   */
  parse(filenameOrStream: string | Stream): any {
    return new Promise((resolve, reject) => {
      let rl = null;
      Promise.resolve()
        .then(() => {
          // If we are passed a string, attempt to open the filename
          if (typeof filenameOrStream === 'string') {
            return this.getStreamFromFile(filenameOrStream, true);
          }
          // If it's a readable stream then simply pass it
          else if (
            typeof filenameOrStream === 'object' &&
            'readable' in filenameOrStream
          ) {
            return Promise.resolve(filenameOrStream);
          }
          // It's neither a string or stream, so reject
          else {
            return Promise.reject(
              'Expected string filename or readable stream'
            );
          }
        })
        .then(stream => {
          // Create the readline interface
          const input: any = stream;
          rl = readline.createInterface({
            input,
          });

          // Call our function for each line
          rl.on('line', (line: string) => {
            this.processLine(line);
          });

          // After the last line is read, emit a close event with some stats
          rl.on('close', () => {
            let statsObject = {
              records: this.numberOfValidRecords,
              comments: this.numberOfComments,
              errors: this.numberOfInvalidRecords,
            };
            this['emit']('close', statsObject);
          });

          rl.on('error', (err: any) => {
            this['emit']('error', err);
          });

          return resolve(stream);
        })
        .catch(err => {
          return reject(err);
        });
    });
  }

  /**
   * @private
   * Opens the given file and returns a read or write stream
   * @param {string} filename - File to open
   * @param {boolean} isRead - True if generated a read stream, false for a write stream
   * @param {{}} streamOptions - Stream options object. See the nodejs doc for more details
   * @returns {Promise}
   */
  getStreamFromFile(filename: string, isRead?: boolean, streamOptions?: any) {
    isRead = isRead || true;
    return new Promise((resolve, reject) => {
      let stream: fs.ReadStream | fs.WriteStream = isRead
        ? fs.createReadStream(filename, streamOptions)
        : fs.createWriteStream(filename, streamOptions);

      stream.on('error', err => {
        return reject(err.toString());
      });

      stream.on('open', () => {
        return resolve(stream);
      });
    });
  }

  /**
   * @private
   * Given the line from the file, turn it into an object emit the proper event
   * @param {string} line - The line from the text file
   */
  processLine(line: string) {
    // Send a comment event if it's a comment
    if (line.charAt(0) === this.commentChar) {
      this.numberOfComments++;
      this['emit']('comment', line);
      return;
    }

    let returnObject: any = {};

    let splitArray = line.split(this.delimiter);
    // If the fields have been defined but we don't have the correct number
    if (this.fields.length > 0) {
      if (this.fields.length !== splitArray.length) {
        this.numberOfInvalidRecords++;
        this['emit']('invalid', line, splitArray);
      } else {
        this.fields.forEach((fieldName, index) => {
          returnObject[fieldName] = splitArray[index];
        });
        this.numberOfValidRecords++;
        this['emit']('data', returnObject);
      }
    } else {
      // we have to generate field names
      splitArray.forEach((_, index) => {
        returnObject[`field_${index}`] = splitArray[index];
      });
      this.numberOfValidRecords++;
      this['emit']('data', returnObject);
    }
  }
}
