import { readFileSync } from 'fs';
import styles from './styles.js';

// for injecting into head tag
const LEADING_SPACE = '  ';
const NEW_LINE = '\n  ';

const makeHtmlAttributes = (attributes) => {
  if (!attributes) return '';

  const keys = Object.keys(attributes);
  // eslint-disable-next-line no-param-reassign
  return keys.reduce((result, key) => (result += ` ${key}="${attributes[key]}"`), '');
};

const removeHash = (str) => str.replace(/\.[a-z0-9]+\./, '.');
const insertAt = (text, source, pos) => source.slice(0, pos) + text + source.slice(pos);
const findIn = (str, html) => html.indexOf(str);

function addHashToFileNames(fileName, html) {
  const originalName = removeHash(fileName);
  const index = html.indexOf(originalName);
  if (index === -1) {
    console.error(`html-plugin/template: Not found "${originalName}" in html`);
    return html;
  }
  return html.replace(originalName, fileName);
}

function insertAfter(insertStr, findStr, source) {
  const pos = findIn(findStr, source);
  return insertAt(insertStr, source, pos + findStr.length)
}

function injectMetaTags(metaTags, html) {
  const meta = '\n' + metaTags
    .map((input) => `${LEADING_SPACE}<meta${makeHtmlAttributes(input)}>`)
    .join('\n');

  return insertAfter(meta, '<head>', html);
}

function injectTitle(title, html) {
  return insertAfter(NEW_LINE + `<title>${title}</title>`, '<head>', html);
}

function injectGlobalStyles(html) {
  return insertAfter(styles, '<style>', html);
}

function injectMarkdown(markdown, html) {
  return insertAfter(markdown, '<main>', html);
}

export default async function template({ files, meta, markdown, metadata }) {
  meta.push({ name: 'description', content: metadata.description });
  meta.push({ name: 'keywords', content: metadata.tags });

  let html = readFileSync('./lib/markdown-plugin/index.html').toString();

  for (const { fileName } of files.js || []) {
    //if (fileName.includes('worker')) return;
    html = addHashToFileNames(fileName, html);
  }
  // note onload in css causes CSP error
  for (const { fileName } of files.css || []) {
    //if (fileName.includes('worker')) return;
    html = addHashToFileNames(fileName, html);
  }

  html = injectMetaTags(meta, html);
  html = injectTitle(metadata.title, html);
  html = injectGlobalStyles(html);
  html = injectMarkdown(markdown, html);

  return html;
};
