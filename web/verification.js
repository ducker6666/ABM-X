// Pruebas del motor REAL de la web, sin copiar sus implementaciones.
// Solo se omite el arranque de botones/dibujo; no requiere dependencias.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
const context = vm.createContext({document: {getElementById: () => ({getContext: () => ({})})}});
vm.runInContext(source.split('document.getElementById("startBtn").addEventListener')[0] +
  '\nglobalThis.engine={state,PARAMS,cfg,mulberry32,poleForce,poleDistanceMembership,jdjFromFrequencyTable,eventAmp,maybeEvents,detectClusters,step,historyStart,drawLineChart,renderMovementExplanation};', context);
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
test('Sensibilidad suave: μ=0.60 → 0.61 cambia el movimiento exacto',()=>{
  const run=mu=>{const m=setup([agent(.4,.5,{mu}),agent(.6,.5)]);e.step();return m.agents[0].x-.4;};
  near(run(.6),.009); near(run(.61),.00915);
});
test('Umbral estricto: igualdad no activa movimiento',()=>{
  const m=setup([agent(.25,.5,{alpha:.25}),agent(.5,.5)]);e.step();near(m.agents[0].x,.25);
});
test('Tolerancia: salto por entrada de vecino, no suavizado oculto',()=>{
  const run=eps=>{const m=setup([agent(.25,.5,{eps0:eps}),agent(.5,.5)]);e.step();return m.agents[0].x;};
  near(run(.249),.25);near(run(.25),.26875);
});
test('Ruido: misma semilla y doble amplitud, doble perturbación',()=>{
  const run=noise=>{const m=setup([agent(.5,.5)],{noise});e.step();return m.agents[0].x-.5;};
  near(run(.2),2*run(.1));
});
test('Polos: barrido de fuerza y radio contra ecuación independiente',()=>{
  for (const strength of [0,.01,.49,.5,.51,1]) for (const radius of [.02,.3,.31,1]) {
    const c={...defaults,poleStrength:strength,poleRadius:radius};
    const a=agent(.35,.55), actual=e.poleForce(a,c);
    const dA=(a.x-c.poleA[0])**2+(a.y-c.poleA[1])**2;
    const dB=(a.x-c.poleB[0])**2+(a.y-c.poleB[1])**2;
    const wA=1/(1+Math.exp((1+6*strength)*(dA-dB)/(2*radius**2)));
    const gain=strength*(.35+.65*Math.abs(2*wA-1));
    near(actual.wA,wA);near(actual.x,gain*(wA*c.poleA[0]+(1-wA)*c.poleB[0]-a.x));
  }
});
test('Evento: fuerza neta del ejemplo de reactancia',()=>{
  const m=setup([agent(.4,.5)]);
  m.events=[{x:.6,y:.5,start:0,duration:50,strength:.8,radius:.4,reactance:.2,decay:0}];
  e.step();
  const net=(.8*.2-.2)*Math.exp(-.2*.2/(2*.4*.4));
  near(m.agents[0].x,.4+.075*net);
});
test('Masa: fuerza externa y autoatracción se ejecutan como documentadas',()=>{
  // Dos agentes coincidentes forman un grupo de masa 2/3; el tercero es externo.
  const m=setup([agent(.6,.5,{eps0:.01}),agent(.6,.5,{eps0:.01}),agent(.4,.5,{eps0:.01})],
    {clusterMinSize:2,clusterDetectRadius:.02,clusterMassExponent:1,clusterStrength:.1,clusterGravityRadius:.6});
  e.step();
  const force=.1*(2/3)*Math.exp(-.2*.2/(2*.6*.6))*.2/(.2*.2+.128*.128);
  near(m.agents[2].x,.4+.075*force); near(m.agents[0].x,.6);
});
test('Tolerancia con masa: ε=ε0(1-cr*r)(1-cm*M)',()=>{
  const m=setup([agent(.75,.75,{eps0:.3}),agent(.75,.75,{eps0:.3})],
    {clusterMinSize:2,clusterDetectRadius:.02,clusterMassExponent:1,radicalToleranceLoss:.4,massToleranceLoss:.2});
  e.step();near(m.agents[0].eps,.3*.8*.8);
});
test('Eje temporal: ventana real de 900 muestras',()=>{
  assert.equal(e.historyStart(0,1),0);assert.equal(e.historyStart(899,900),0);
  assert.equal(e.historyStart(1000,900),101);
});
test('Suma completa: vecinos + polos + masa + evento + centro + anclaje',()=>{
  const m=setup([agent(.6,.5,{anchorX:.55,lambda:.1,mu:.6}),agent(.62,.5)],
    {poleStrength:.2,poleRadius:.5,clusterStrength:.1,clusterSelfAttraction:.4,clusterPoleCoupling:.3,
      clusterMinSize:2,clusterDetectRadius:.05,clusterMassExponent:1,clusterGravityRadius:.6,
      auditThreshold:0,auditBalanceThreshold:0,auditPatience:1,centerRebound:.1});
  m.events=[{x:.3,y:.5,start:0,duration:10,strength:.1,radius:.4,reactance:.02,decay:0}];
  // Evaluación independiente de las ecuaciones publicadas en la página.
  const pole=(x,y)=>{
    const w=1/(1+Math.exp(2.2*(((x-1)**2+y*y)-(x*x+(y-1)**2))/(2*.5**2)));
    const gain=.2*(.35+.65*Math.abs(2*w-1));return [gain*(w-x),gain*(1-w-y)];
  };
  const p=pole(.6,.5), pc=pole(.61,.5);
  const mass=.4*.1*Math.exp(-(.01**2)/(2*.6**2))*.01/(.01**2+.128**2);
  const event=Math.exp(-(.3**2)/(2*.4**2))*(-.1*.3+.02);
  const fx=.02+p[0]+.3*pc[0]+mass+event-.01-.005;
  const fy=p[1]+.3*pc[1];
  e.step(); near(m.agents[0].x,.6+.075*.6*fx);near(m.agents[0].y,.5+.075*.6*fy);
});
test('Gráfico JDJ: valores mayores que 1 no se recortan al dibujar',()=>{
  const labels=[];
  const canvas=new Proxy({canvas:{width:620,height:300},fillText:(t)=>labels.push(t)},
    {get:(o,k)=>k in o?o[k]:()=>{}});
  setup([]);e.drawLineChart(canvas,[2,2,2],'t','JDJ','#000',{autoZoom:true});
  assert.ok(labels.includes('2.00'));
});
test('Inspector: vecinos, suma y ejemplo numérico real',()=>{
  const m=setup([agent(.4,.5,{anchorX:.3,lambda:.1,mu:.6,alpha:.1}),agent(.6,.5)]);
  e.step(); const r=m.movement;
  assert.equal(r.agent,1); assert.equal(r.t,0);
  assert.equal(JSON.stringify(r.neighbors),'[2]');
  near(r.total[0],.19); near(r.directed[0],.00855);
  near(r.to[0],.40855); near(r.to[0],m.agents[0].x);
  for(let k=0;k<2;k++) near(r.forces.reduce((s,row)=>s+row[k+1],0),r.total[k]);
});
test('Inspector: ruido bajo umbral, límite y borde se explican por separado',()=>{
  let m=setup([agent(.5,.5,{alpha:1})],{noise:.7});
  e.step(); let r=m.movement;
  near(r.directed[0],0); near(r.to[0],r.from[0]+r.noise[0]);
  m=setup([agent(.99,.5,{anchorX:10,lambda:1})]);
  e.step(); r=m.movement;
  assert.ok(r.factor<1); near(r.limited[0],.05);
  near(r.beforeClip[0],1.04); near(r.to[0],1);
});
test('Inspector: captura inmutable y selección sin efectos sobre los sorteos',()=>{
  const run=highlighted=>{
    const m=setup([agent(.4,.5),agent(.6,.5)],{noise:.8,poleStrength:.7});
    m.highlighted=highlighted;e.step();const snapshot=JSON.stringify(m.movement);
    const old=m.movement;e.step();assert.equal(JSON.stringify(old),snapshot);
    return {positions:m.agents.map(a=>[a.x,a.y]),nextRandom:e.state.rng(),trace:m.movement};
  };
  const a=run(0),b=run(1),none=run(-1);
  assert.equal(JSON.stringify(a.positions),JSON.stringify(b.positions));
  assert.equal(JSON.stringify(a.positions),JSON.stringify(none.positions));
  assert.equal(a.nextRandom,b.nextRandom);assert.equal(a.nextRandom,none.nextRandom);
  assert.equal(b.trace.agent,2);assert.equal(none.trace,undefined);
});
test('Inspector: no muestra el cálculo de otra persona ni tras reiniciar',()=>{
  const box={};context.document.getElementById=()=>box;
  const m=setup([agent(.4,.5),agent(.6,.5)]);
  e.step();e.renderMovementExplanation();
  assert.ok(box.innerHTML.includes('Agente 1 · ronda 0 → 1'));
  m.highlighted=1;e.renderMovementExplanation();
  assert.ok(box.textContent.includes('Agente 2 seleccionado'));
  setup([agent(.5,.5)]);e.renderMovementExplanation();
  assert.ok(box.textContent.includes('Agente 1 seleccionado'));
});
console.log(`${passed} pruebas del motor web superadas.`);
