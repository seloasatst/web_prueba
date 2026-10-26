const { execSync } = require('child_process');
const path = require('path');

const browserPath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const outFile = path.resolve('scratch_recs.png');
const cmd = `"${browserPath}" --headless=new --screenshot="${outFile}" --window-size=1280,1000 --virtual-time-budget=3000 "http://127.0.0.1:8085/blog/articulo.html?id=noticia-telemetria"`;
execSync(cmd);
console.log('Saved:', outFile);
