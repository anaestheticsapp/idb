import { readFileSync } from 'fs';
import { parse, extname } from 'path';
import glob from 'glob';

//import chalk from 'chalk';

import { marked } from 'marked';
import matter from 'gray-matter';
import hljs from 'highlight.js';

import config from './markdown-plugin/config.js';

const getFiles = (bundle) => {
  const files = Object.values(bundle).filter(
    (file) => file.isEntry || (typeof file.type === 'string' ? file.type === 'asset' : file.isAsset)
  );
  const result = {};
  for (const file of files) {
    const { fileName } = file;
    const extension = extname(fileName).substring(1);
    result[extension] = (result[extension] || []).concat(file);
  }
  return result;
};

const fileCollection = new Map();

// better than html-plugin readDirectorySync()
function getDirectoryFiles(inputPath) {
  const files = glob.sync(`${inputPath}**/*`).filter((file) => file.endsWith('.md'));

  for (const file of files) {
    let outputPath = file.replace(inputPath, '');
    fileCollection.set(file, parse(outputPath));
  }
}
function getFileContent(filePath) {
  const source = readFileSync(filePath);
  const { content, data } = matter(source);
  return [
    marked(content, {
      highlight: (code, language) => {
        const validLanguage = hljs.getLanguage(language) ? language : 'plaintext';
        return hljs.highlight(code, { language: 'javascript' }).value;
      },
    }),
    data,
  ];
}


export default function markdownPlugin(inputPath = './src/markdown/', opts = {}) {
  return {
    name: 'markdownPlugin',
    buildStart() {
      getDirectoryFiles(inputPath);
      for (const [origin, parsedPath] of fileCollection) {
        this.addWatchFile(origin);
        //console.warn(chalk.red.bold('markdown-plugin'), '\n', origin, '\n', parsedPath, '\n');
      }
    },
    async generateBundle(output, bundle) {
      for (const [origin, parsedPath] of fileCollection) {
        const { title, attributes, meta, publicPath, template, routes } = Object.assign(
          {},
          config,
          opts
        );

        // note: no absolute or relative paths allowed in rollup
        const fileName = parsedPath.dir
        ? parsedPath.dir + '/' + parsedPath.name + '.html'
        : parsedPath.name + '.html';
        //console.warn(chalk.red.bold('markdown-plugin'), '\n', fileName);

        const files = getFiles(bundle);
        const [markdown, metadata] = getFileContent(origin);
        //console.warn(chalk.red.bold('markdown-plugin'), '\n', markdown, '\n', metadata);

        this.emitFile({
          fileName,
          source: await template({ attributes, files, origin, meta, publicPath, title, routes, markdown, metadata }),
          type: 'asset',
        });
      }
    },
  };
}
