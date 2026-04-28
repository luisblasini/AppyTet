import fs from 'fs';
import path from 'path';

const csvPath = path.resolve('data_source/CSV utfTabla de productos 140426.csv');
const content = fs.readFileSync(csvPath, 'latin1');
const firstLine = content.split('\n')[0];
console.log("Headers:", firstLine);
const parts = firstLine.split(',');
parts.forEach((p, i) => console.log(`${i}: ${p.trim()}`));
