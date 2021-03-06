import fse from 'fs-extra';
import { resolve } from 'path';
//import chalk from 'chalk';

const filesCollection = new Map();
const exclude = []; // dir or file

function copyChangedFile(file = {}) {
  try {
    fse.copySync(file.origin, file.dest);
    //console.log(chalk.red(`copy-plugin: copied ${file.origin} to ${file.dest}`));
  } catch (err) {
    console.error(err);
  }
}

function readDirectorySync(copy) {
  const currentDirPath = resolve(copy.from);
  const currentDir = fse.readdirSync(currentDirPath, 'utf8');
  for (const item of currentDir) {
    const skip = exclude.includes(item);
    const currentItemPath = resolve(copy.from + '/' + item);
    if (!skip && fse.statSync(currentItemPath).isFile()) {
      filesCollection.set(copy.from + item, copy.to + item);
    } else if (!skip) {
      const directoryPath = { from: copy.from + item + '/', to: copy.to + item + '/' };
      readDirectorySync(directoryPath);
    }
  }
}
function copyDirectories(list) {
  for (const copy of list) {
    try {
      fse.copySync(copy.from, copy.to);
      readDirectorySync(copy);
    } catch (err) {
      console.log('copy-plugin copyDirectories:37', err.message);
    }
  }
}

export default function copyPlugin(copyDir) {
  return {
    name: 'copy-plugin',
    buildStart() {
      //console.log(options); // if buildStart(options) {}
      copyDirectories(copyDir);
      for (const [origin, dest] of filesCollection) {
        this.addWatchFile(origin);
      }
    },
    watchChange(id) {
      const normalizePath = id.replace(/\\/g, '/');
      const fileName = './' + normalizePath; // ./src/php/index.php
      if (filesCollection.has(fileName)) {
        //console.log(chalk.yellow(`copy-plugin: file has changed: ${fileName}`));
        copyChangedFile({ origin: fileName, dest: filesCollection.get(fileName) });
      }
    },
  };
}
