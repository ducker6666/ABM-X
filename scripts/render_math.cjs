// Genera MathML estático desde LaTeX: la web no carga librerías ni necesita red.
// Editar equations.cjs, ejecutar npm ci && npm run math y revisar el resultado.
const fs = require('node:fs');
const path = require('node:path');
const katex = require('katex');
const equations = require('../web/equations.cjs');
const file = path.join(__dirname, '../web/formula.html');
let html = fs.readFileSync(file, 'utf8');
const blocks = Object.entries(equations).map(([id, tex]) => {
  const math = katex.renderToString(tex, {output:'mathml', displayMode:true, throwOnError:true});
  return `<!-- equation:${id} --><div class="equation" tabindex="0" aria-label="Fórmula ${id}">${math}</div><!-- /equation -->`;
});
// Primera conversión de los bloques de texto; siguientes compilaciones actualizan
// solo los bloques marcados, sin tocar explicaciones ni ejemplos.
const pattern = html.includes('<!-- equation:') ? /<!-- equation:[\s\S]*?<!-- \/equation -->/g : /<pre>[\s\S]*?<\/pre>/g;
let count=0;
html=html.replace(pattern,()=>blocks[count++]);
if(count!==blocks.length) throw new Error(`Esperaba ${blocks.length} ecuaciones, encontré ${count}`);
if (process.argv.includes('--check')) {
  if (html !== fs.readFileSync(file,'utf8')) throw new Error('MathML desactualizado: npm run math');
} else fs.writeFileSync(file,html);
console.log(`${count} ecuaciones LaTeX verificadas y renderizadas sin CDN.`);
