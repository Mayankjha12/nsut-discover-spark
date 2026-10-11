// Keep this workflow's run history: each successful push needs a higher Android versionCode.
const fs = require('node:fs');
const path = require('node:path');
const run = Number(process.env.GITHUB_RUN_NUMBER);
const code = 1000 + run;
if (!Number.isSafeInteger(run) || run < 1 || code > 2_100_000_000) throw new Error('Invalid CI run number');
const file = path.resolve(__dirname, '../app.json');
const app = JSON.parse(fs.readFileSync(file, 'utf8'));
if (!app.expo?.android?.package) throw new Error('Android package must stay stable for updates');
app.expo.android.versionCode = code;
fs.writeFileSync(file, JSON.stringify(app, null, 2) + '\n');
if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `code=${code}\n`);
console.log(`Android versionCode: ${code}`);
