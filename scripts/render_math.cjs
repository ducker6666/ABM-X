// Genera MathML estático desde LaTeX: la web no carga librerías ni necesita red.
// Editar equations.cjs, ejecutar npm ci && npm run math y revisar el resultado.
const fs = require('node:fs');
const path = require('node:path');
const katex = require('katex');
const equations = require('../web/equations.cjs');
const notes = require('../web/equation_notes.cjs');
const file = path.join(__dirname, '../web/formula.html');
let html = fs.readFileSync(file, 'utf8');
const escape = text => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
if (Object.keys(notes).join() !== Object.keys(equations).join()) throw new Error('Cada ecuación necesita una ficha explicativa, en el mismo orden.');
html = html.replace(/<!-- notes:[\s\S]*?<!-- \/notes -->/g, '');
const blocks = Object.entries(equations).map(([id, tex]) => {
  const math = katex.renderToString(tex, {output:'mathml', displayMode:true, throwOnError:true});
  const n = notes[id];
  for (const field of ['symbols', 'example', 'reason', 'source']) {
    if (!n[field]?.length) throw new Error(`Falta ${field} en ${id}`);
  }
  const explanation = `<div class="equation-notes" aria-label="Explicación de ${id}"><h3>Qué significa cada símbolo</h3><dl>${n.symbols.map(([symbol, meaning]) => `<dt>${escape(symbol)}</dt><dd>${escape(meaning)}</dd>`).join('')}</dl><div class="example"><h3>Lee los números paso a paso</h3><p>${escape(n.example)}</p></div><h3>Por qué tiene esta forma</h3><p>${escape(n.reason)}</p><p class="source-note"><b>Origen y alcance:</b> ${escape(n.source).replace(/\[(\d+)\]/g, '<a href="#ref$1">[$1]</a>')}</p></div>`;
  return `<!-- equation:${id} --><div class="equation" tabindex="0" aria-label="Fórmula ${id}">${math}</div><!-- /equation --><!-- notes:${id} -->${explanation}<!-- /notes -->`;
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
