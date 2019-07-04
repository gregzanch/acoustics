import { ETCFile, FFTFile, IRFile, RTAFile } from '../audiotools/parsers';
import { wav } from './readers/wav';
import { json } from './readers/json';
import { csv } from './readers/csv';
import { tsv } from './readers/tsv';
import { DelimitedFileReader } from './readers/delimited';

export {
  wav,
  ETCFile,
  FFTFile,
  IRFile,
  RTAFile,
  json,
  DelimitedFileReader,
  csv,
  tsv,
};