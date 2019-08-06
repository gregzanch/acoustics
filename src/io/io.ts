const AudioRecorder = require('node-audiorecorder');
import * as fs from 'fs';
import { spawn } from 'child_process';

/*
			program: `rec`,				// Which program to use, either `arecord`, `rec`, and `sox`.
			device: null,				// Recording device to use.

			bits: 16,					// Sample size. (only for `rec` and `sox`)
			channels: 1,				// Channel count.
			encoding: `signed-integer`,	// Encoding type. (only for `rec` and `sox`)
			format: `S16_LE`,			// Format type. (only for `arecord`)
			rate: 16000,				// Sample rate.
			type: `wav`,				// File type.

			// Following options only available when using `rec` or `sox`.



*/

export interface RecordingOptions {
  /**
   * Which program to use, either `arecord`, `rec`, and `sox`.
   *  @default "rec"
   */
  program: string;

  /**
   * Recording device to use.
   */
  device: string;

  /**
   * Sample size. (only for `rec` and `sox`)
   * @default 16
   */
  bits: number;

  /**
   * Channel count.
   *  @default 1
   */
  channels: number;

  /**
   * encoding type. (only for `arecord`)
   *  @default 'signed-integer'
   */
  encoding: number;

  /**
   * Format type. (only for `arecord`)
   * @default 'S16_LE'
   */
  format: string;

  /**
   * Sample rate.
   * @default 48000
   */
  rate: number;

  /**
   * File type.
   * @default 'wav'
   */
  type: string;

  /**
   * Duration of silence in seconds before it stops recording. only available when using `rec` or `sox`
   * @default 0
   */
  silence: number;

  /**
   * Silence threshold to start recording. only available when using `rec` or `sox`
   * @default 5
   */
  thresholdStart: number;

  /**
   * Silence threshold to stop recording. only available when using `rec` or `sox`
   * @default 5
   */
  thresholdStop: number;

  /**
   * Keep the silence in the recording. only available when using `rec` or `sox`
   * @default true
   */
  keepSilence: boolean;
}

export function makeMeasurement(
  infile: string,
  outfile: string,
  after: number,
  before: number,
  recordingOptions: RecordingOptions
) {
  const audioRecorder = new AudioRecorder(
    Object.assign(
      {
        program: process.platform === `win32` ? `sox` : `rec`,
        silence: 0,
        rate: 48000,
      },
      recordingOptions
    )
  );

  setTimeout(() => {
    audioRecorder
      .start()
      .stream()
      .pipe(fileStream);
    const play = spawn('play', [infile]);

    audioRecorder.stream().on(`close`, function(code: number) {
      console.warn(`Recording closed. Exit code: `, code);
    });
    audioRecorder.stream().on(`end`, function() {
      console.warn(`Recording ended.`);
    });
    audioRecorder.stream().on(`error`, function() {
      console.warn(`Recording error.`);
    });

    play.stdout.on('data', data => {
      console.log(`stdout: ${data}`);
    });

    play.stderr.on('data', data => {
      console.log(`stderr: ${data}`);
    });

    play.on('close', (code: number) => {
      console.log(code);
      setTimeout(() => {
        audioRecorder.stop();
      }, after * 1000);
    });
  }, before * 1000);

  const fileStream = fs.createWriteStream(outfile, {
    encoding: `binary`,
  });
}

