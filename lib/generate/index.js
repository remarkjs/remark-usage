import trough from 'trough'
import {config} from './config.js'
import {findPackage} from './find-package.js'
import {findExample} from './find-example.js'
import {generate as generate_} from './generate.js'
import {instrument} from './instrument.js'
import {run} from './run.js'
import {tokenize} from './tokenize.js'
import {write} from './write.js'

export const generate = trough()
  .use(findPackage)
  .use(config)
  .use(findExample)
  .use(instrument)
  .use(write)
  .use(run)
  .use(tokenize)
  .use(generate_)
