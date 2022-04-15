import rimraf from 'rimraf';
import typescript from '@rollup/plugin-typescript';
import copyPlugin from './lib/copy-plugin.js';

import { readFileSync } from 'fs';
import serve from 'rollup-plugin-serve';

const isProduction = process.env.BUILD === 'production';
const isTest = process.env.BUILD === 'test';

const LOCATION_TO_KEY = 'C:/Server/bin/Apache24/conf/';

function production(name = 'main') {
  return {
    input: 'src/idb.ts',
    output: {
      dir: 'dist/',
      format: 'esm',
      plugins: [],
      sourcemap: isProduction ? false : true,
    },
    plugins: [typescript()],
  };
}

function test(name = 'main') {
  return {
    input: 'src/idb.test.ts',
    output: {
      dir: 'dist/',
      format: 'esm',
      plugins: [],
      sourcemap: true,
    },
    plugins: [
      copyPlugin([{ from: './test/', to: './dist/' }]),
      typescript(),
      serve({
        contentBase: 'dist',
        host: 'localhost',
        port: 50001,
        https: {
          key: readFileSync(LOCATION_TO_KEY + 'localhost-key.pem'),
          cert: readFileSync(LOCATION_TO_KEY + 'localhost.pem'),
          ca: readFileSync(LOCATION_TO_KEY + 'rootCA.pem'),
        },
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }),
    ],
  };
}

const build = () => (isTest ? test() : production());

rimraf.sync('dist/');

export default build();
