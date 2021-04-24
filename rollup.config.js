import rimraf from 'rimraf';

const isProduction = process.env.BUILD === 'production';

function build(name = 'main') {
  return {
    input: 'src/idb.js',
    output: {
      dir: 'dist/',
      format: 'esm',
      plugins: [],
      sourcemap: isProduction ? false : true,
    },
  };
}

console.log('process.env.BUILD', process.env.BUILD);
rimraf.sync('dist/');

export default build();
