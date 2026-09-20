// Diagnóstico local (no validación social): mismo motor y misma semilla por par.
// Ejecutar: node experiments/web_sensitivity.cjs
const fs=require('node:fs'), vm=require('node:vm'), path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../web/app.js'),'utf8');
const context=vm.createContext({document:{getElementById:()=>({getContext:()=>({})})}});
vm.runInContext(source.split('document.getElementById("startBtn").addEventListener')[0]+
  '\ndraw=()=>{}; globalThis.engine={state,PARAMS,resetModel,step,polarizationStats};',context);
const e=context.engine;
const parameters=['poleStrength','epsilonMean','mu','noise','radicalToleranceLoss','clusterStrength'];
const seeds=[11,22,33,44,55,66];
function run(seed, parameter, delta=0){
  for(const p of e.PARAMS) e.state.controls.set(p.id,{input:{value:String(p.value)}});
  for(const [key,value] of Object.entries({seed,nAgents:80,steps:120})) e.state.controls.get(key).input.value=String(value);
  if(parameter) { const input=e.state.controls.get(parameter).input;input.value=String(Math.max(0,Math.min(1,Number(input.value)+delta))); }
  e.resetModel();for(let t=0;t<120;t++) e.step();
  const result=e.polarizationStats();
  if(e.state.model.agents.some(a=>!Number.isFinite(a.x+a.y)||a.x<0||a.x>1||a.y<0||a.y>1)) throw new Error('Estado fuera del dominio');
  return {jdj:result.jdj,separation:result.separation,clusters:e.state.model.clusters.length,
    effectiveParameter:parameter?Number(e.state.controls.get(parameter).input.value):null};
}
const baseline=seeds.map(seed=>run(seed));
const results=[];
for(const parameter of parameters) for(const delta of [-.01,.01]){
  const runs=seeds.map((seed,i)=>({seed,...run(seed,parameter,delta),baselineJdj:baseline[i].jdj}));
  const differences=runs.map(r=>r.jdj-r.baselineJdj);
  results.push({parameter,delta,meanJdjChange:differences.reduce((a,b)=>a+b,0)/seeds.length,
    minChange:Math.min(...differences),maxChange:Math.max(...differences),runs});
}
const report={version:'Revisión de fundamento 2026-09-21',purpose:'Diagnóstico local exploratorio, no validación empírica ni sensibilidad global. Se recortan controles a [0,1]: delta negativo en cero no cambia el parámetro.',
  agents:80,rounds:120,seeds,baseline,results};
const output=path.join(__dirname,'../docs/web_sensitivity_review.json');
fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');
console.table(results.map(({parameter,delta,meanJdjChange,minChange,maxChange})=>({parameter,delta,meanJdjChange,minChange,maxChange})));
console.log('78 ejecuciones; resultados y semillas en docs/web_sensitivity_review.json (no sobrescribe histórico)');
