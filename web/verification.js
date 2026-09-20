// Pruebas del motor REAL de la web, sin copiar sus implementaciones.
// Solo se omite el arranque de botones/dibujo; no requiere dependencias.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
const context = vm.createContext({document: {getElementById: () => ({getContext: () => ({})})}});
vm.runInContext(source.split('document.getElementById("startBtn").addEventListener')[0] +
  '\nglobalThis.engine={state,PARAMS,cfg,mulberry32,poleForce,poleDistanceMembership,jdjFromFrequencyTable,eventAmp,maybeEvents,detectClusters,step};', context);
const e = context.engine;
for (const p of e.PARAMS) e.state.controls.set(p.id, {input: {value: String(p.value)}});
const defaults = e.cfg();
const near = (a,b) => assert.ok(Math.abs(a-b)<1e-12, `${a} != ${b}`);
let passed = 0;
function test(name, run) { run(); passed++; console.log(`OK ${name}`); }
function agent(x,y,extra={}) {
  return {x,y,anchorX:x,anchorY:y,eps0:0.5,mu:1,alpha:0,lambda:0,...extra};
}
function setup(agents, overrides={}) {
  e.state.rng=e.mulberry32(123);
  e.state.model={cfg:{...defaults,poleA:[1,0],poleB:[0,1],noise:0,eventFrequency:0,
    poleStrength:0,clusterStrength:0,clusterSelfAttraction:0,clusterPoleCoupling:0,
    massToleranceLoss:0,radicalToleranceLoss:0,centerRebound:0,...overrides},
    agents,clusters:[],events:[],t:0,nextEventAt:0,highPolCount:0,
    historyPol:[],historyEvent:[],historyForces:[]};
  return e.state.model;
}
test('JDJ: polos opuestos, todos los pares',()=>{
  setup([agent(1,0),agent(0,1)]);
  near(e.jdjFromFrequencyTable(e.state.model.agents),1);
});
test('JDJ: centro y población vacía',()=>{
  setup([agent(.5,.5)]); near(e.jdjFromFrequencyTable(e.state.model.agents),.5);
  near(e.jdjFromFrequencyTable([]),0);
});
test('JDJ: ejemplo (0.2,0.4), sin redondeo',()=>{
  setup([agent(.2,.4)]);
  const m=e.poleDistanceMembership(e.state.model.agents[0]);
  near(m.a,1-Math.sqrt(.8)/Math.sqrt(2)); near(m.b,1-Math.sqrt(.4)/Math.sqrt(2));
  near(e.jdjFromFrequencyTable(e.state.model.agents),2*m.a*m.b);
});
test('JDJ: puntos fuera del eje, suma directa independiente',()=>{
  const points=[agent(0,0),agent(1,1),agent(.2,.4),agent(.2,.4),agent(.7,.9)];
  setup(points);
  const memberships=points.map(p=>[1-Math.hypot(p.x-1,p.y)/Math.sqrt(2),1-Math.hypot(p.x,p.y-1)/Math.sqrt(2)]);
  let sum=0;
  for(const a of memberships) for(const b of memberships) sum+=Math.max(a[0]*b[1],a[1]*b[0]);
  near(e.jdjFromFrequencyTable(points),2*sum/points.length**2);
  near(e.jdjFromFrequencyTable([agent(0,0)]),2*(1-1/Math.sqrt(2))**2);
});
test('Polos: softmax estable con radio mínimo',()=>{
  const c={...defaults,poleRadius:.02};
  const p=e.poleForce(agent(.2,.2),c);
  near(p.wA,.5); near(p.wB,.5); near(p.targetX,.5); near(p.targetY,.5);
  near(p.x,.0735); near(p.y,.0735);
  const extreme=e.poleForce(agent(0,1),c); near(extreme.wA+extreme.wB,1);
  assert.ok(Number.isFinite(extreme.x));
});
test('JDJ no se recorta con polos coincidentes',()=>{
  setup([agent(.5,.5)],{poleA:[.5,.5],poleB:[.5,.5]});
  near(e.jdjFromFrequencyTable(e.state.model.agents),2);
});
test('Movimiento documentado: (0.4,0.5) → (0.40855,0.5)',()=>{
  const m=setup([agent(.4,.5,{anchorX:.3,lambda:.1,mu:.6,alpha:.1}),agent(.6,.5)]);
  e.step(); near(m.agents[0].x,.40855); near(m.agents[0].y,.5);
});
test('Actualización síncrona: invertir orden no cambia posiciones',()=>{
  const points=[[.2,.5],[.4,.5],[.6,.5]];
  const m=setup(points.map(p=>agent(...p))); e.step();
  const forward=m.agents.map(a=>a.x);
  const reverse=setup(points.slice().reverse().map(p=>agent(...p))); e.step();
  reverse.agents.slice().reverse().forEach((a,i)=>near(a.x,forward[i]));
  near(forward[0],.2225); near(forward[1],.4); near(forward[2],.5775);
});
test('Inmovilidad: fuerza menor al umbral no mueve sin ruido',()=>{
  const m=setup([agent(.4,.5,{alpha:.3}),agent(.6,.5)]); e.step(); near(m.agents[0].x,.4);
});
test('Tolerancia adaptativa: ejemplo ε=0.24 sin masa',()=>{
  const m=setup([agent(.75,.75,{eps0:.3})],{radicalToleranceLoss:.4}); e.step();
  near(m.agents[0].eps,.24);
});
test('Decaimiento: ventanas y vida media',()=>{
  const event={start:3,duration:400,decay:0};
  near(e.eventAmp(event,2),0); near(e.eventAmp(event,3),1);
  near(e.eventAmp(event,303),.5); near(e.eventAmp(event,403),0);
});
test('Eventos: contraevento reflejado, retraso y reproducibilidad',()=>{
  const config={eventFrequency:1,counterEvent:1,eventDuration:92};
  const m=setup([],config); e.maybeEvents(); assert.equal(m.events.length,2);
  const [a,b]=m.events; near(a.x+b.x,1); near(a.y+b.y,1);
  assert.equal(b.start,a.start+3); assert.equal(b.duration,60); near(b.strength,.55*a.strength);
  const snapshot=JSON.stringify(m.events);
  setup([],config); e.maybeEvents(); assert.equal(JSON.stringify(e.state.model.events),snapshot);
});
test('Clusters: centroide y masa',()=>{
  const m=setup([agent(.4,.5),agent(.42,.5),agent(.9,.9)],{clusterMinSize:2,clusterDetectRadius:.05,clusterMassExponent:1});
  e.detectClusters(); assert.equal(m.clusters.length,1); near(m.clusters[0].x,.41); near(m.clusters[0].mass,2/3);
});
test('Auditor: paciencia y fuerza de retorno',()=>{
  const m=setup([agent(.8,.2)],{auditThreshold:0,auditBalanceThreshold:0,auditPatience:2,centerRebound:.5});
  e.step(); near(m.agents[0].x,.8); e.step(); near(m.agents[0].x,.78875);
});
test('Límites: desplazamiento máximo y cuadrado',()=>{
  const m=setup([agent(.01,.01,{anchorX:10,anchorY:10,lambda:100})]); e.step();
  near(Math.hypot(m.agents[0].x-.01,m.agents[0].y-.01),.05);
  const edge=setup([agent(.99,.99,{anchorX:10,anchorY:10,lambda:100})]); e.step();
  near(edge.agents[0].x,1); near(edge.agents[0].y,1);
});
test('Ruido reproducible incluso con inmovilidad',()=>{
  const run=()=>{const m=setup([agent(.5,.5,{alpha:1})],{noise:1});e.step();return [m.agents[0].x,m.agents[0].y];};
  const first=run(); assert.deepEqual(run(),first); assert.notEqual(first[0],.5);
});
console.log(`${passed} pruebas del motor web superadas.`);
