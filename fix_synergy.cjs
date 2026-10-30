const fs = require('fs');

let html = fs.readFileSync('about-us/index.html', 'utf8');
html = html.replace(
  'rel="noopener noreferrer">grupo</a>',
  'rel="noopener noreferrer">Grupo RALCA</a>'
);
fs.writeFileSync('about-us/index.html', html, 'utf8');

let i18n = fs.readFileSync('js/about-i18n.js', 'utf8');
console.log('--- i18n synergy check ---');
const match = i18n.match(/synergy:\s*\{[\s\S]*?\}/g);
if (match) match.forEach(m => console.log(m));

