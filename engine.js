/* Thira engine: one rendering-free model of Thira's mind, shared by every look in mind.html.
   - FlyWire v783 wiring: 78 neuropils as FitzHugh–Nagumo units, coupled only through the 600 real region links (log synapse weight, neurotransmitter sign).
   - Decisions: a leaky competing accumulator race between the mushroom body (recall), the central complex (explore) and the lateral horn (react).
   - Global workspace ignition, and a self-model that predicts its own activity (prediction error, awareness).
   Equations: physics.md §15 (wiring, decisions) and §16 (engine and self-model). Data credit: FlyWire (flywire.ai), Dorkenwald et al. 2024; Schlegel et al. 2024; CC-BY 4.0. */
export const REG=[['practice','practice','#1c19b5'],['sacred','sacred geometry','#6b4fd8'],['kerala','kerala','#0b7a5c'],['nature','nature','#3f8f2f'],['bim','BIM precision','#0099ff'],['story','storytelling','#b5341c']];
// Themes → real neuropil groups (a design mapping; physics.md §15)
export const THEME_GROUPS={practice:['LAL','VES','SPS','IPS','GNG','EPA','GOR','CAN','FLA','PRW','SAD'],sacred:['FB','EB','PB','NO','BU','GA'],kerala:['LH','SLP','SIP','SMP','CRE'],nature:['ME','LO','LOP','LA','AME','AL','AMMC','WED'],bim:['MB_CA','MB_PED','MB_VL','MB_ML'],story:['AVLP','PVLP','PLP','AOTU','SCL','ICL','IB','ATL','OCG']};
export const CREDIT='Connectome data: FlyWire (flywire.ai), Dorkenwald et al. 2024; Schlegel et al. 2024; CC-BY 4.0.';
const gauss=()=>{let u=0;while(!u)u=Math.random();return Math.sqrt(-2*Math.log(u))*Math.cos(6.2832*Math.random());},sig=x=>1/(1+Math.exp(-x));
const nbase=n=>n.replace(/_(L|R)$/,''),themeOf=n=>REG.findIndex(r=>THEME_GROUPS[r[0]].includes(nbase(n)));
const SITE2T={practice:0,home:1,about:2,services:3,bim360:4,projects:5};
export const MODES=['recall','explore','react'],GNAME=['mushroom body','central complex','lateral horn'];
export function createEngine(){
 const S={t:0,G:0,Ad:0,Sin:0,voice:0,vext:0,ptr:0,ptrSide:'L',ign:false,ignN:0,lastIgn:-99,C:0,err:0,aware:0,r:0,Sx:0,siteT:-1,focusT:-1};
 const DEC={F:[0,0,0],X:[0,0,0],ev:[0,0,0],last:-9,mode:'—',log:[],n:0,target:-1,winner:-1};
 const E={ready:false,RG:[],LINKS:[],GRP:[[],[],[]],S,DEC,trate:new Float32Array(6),tn:new Float32Array(6),tsync:new Float32Array(6),cov:new Float32Array(6),events:[],meta:null,TH:.41};
 const L_=[],Rsched=[];E.on=f=>L_.push(f);
 function emit(kind,data){const ev={kind,t:+S.t.toFixed(1),G:+S.G.toFixed(2),...data};E.events.push(ev);if(E.events.length>80)E.events.shift();L_.forEach(f=>f(ev));}
 E.load=async url=>{const r=await fetch(url);if(!r.ok)throw new Error('data '+r.status);const FW=await r.json();E.meta=FW.meta;
  const C=FW.regions.filter(r=>r.centroid_nm),m=[0,0,0],sd=[0,0,0];C.forEach(r=>{for(let k=0;k<3;k++)m[k]+=r.centroid_nm[k]/C.length;});C.forEach(r=>{for(let k=0;k<3;k++)sd[k]+=(r.centroid_nm[k]-m[k])**2/C.length;});
  let ext=0;C.forEach(r=>ext=Math.max(ext,Math.abs(r.centroid_nm[0]-m[0])));
  E.RG=C.map(r=>{const c=r.centroid_nm,p=[(c[0]-m[0])/ext,-(c[1]-m[1])/ext,(c[2]-m[2])/ext],d=[(c[0]-m[0])/Math.sqrt(sd[0]),-(c[1]-m[1])/Math.sqrt(sd[1]),(c[2]-m[2])/Math.sqrt(sd[2])],dl=Math.hypot(...d)||1;
   return {name:r.name,syn:r.synapses,vol:r.mesh_volume_um3,p,dir:d.map(x=>x/dl),side:/_L$/.test(r.name)?'L':/_R$/.test(r.name)?'R':'M',theme:themeOf(r.name),v:-1.2,w:-.6,Is:0,tr:0,act:0,rate:0,inp:0,visits:0,ls:undefined,isi:2,ph:0,nE:0,nI:0,sgn:1,out:[],inn:[],m:0,dm:0,pred:0,err:0};});
  const RI={};E.RG.forEach((r,i)=>RI[r.name]=i);E.RI=RI;
  for(const n of FW.neurons){const i=RI[n.np];if(i===undefined)continue;if(n.nt==='acetylcholine'||n.nt==='glutamate')E.RG[i].nE++;else if(n.nt==='gaba')E.RG[i].nI++;}
  E.RG.forEach(r=>{if(r.theme>=0)E.tn[r.theme]++;});E.RG.forEach(r=>r.sgn=(r.nE+r.nI)?(r.nE-r.nI)/(r.nE+r.nI):1);
  const lw=FW.region_edges.map(e=>Math.log10(e[2])),lo=Math.min(...lw),hi=Math.max(...lw);
  FW.region_edges.forEach((e,k)=>{const a=RI[e[0]],b=RI[e[1]];if(a===undefined||b===undefined)return;const A=E.RG[a].p,B=E.RG[b].p,len=2.6*Math.hypot(A[0]-B[0],A[1]-B[1],A[2]-B[2]);
   E.LINKS.push({a,b,w:e[2],wn:.2+.8*(lw[k]-lo)/(hi-lo),W:1,len:Math.max(.2,len)});E.RG[a].out.push(E.LINKS.length-1);E.RG[b].inn.push(E.LINKS.length-1);});
  E.RG.forEach((r,i)=>{if(/^MB_/.test(r.name))E.GRP[0].push(i);else if(['FB','EB','PB','NO'].includes(r.name))E.GRP[1].push(i);else if(/^LH_/.test(r.name))E.GRP[2].push(i);});
  E.neurons=FW.neurons;E.ready=true;return E;};
 const add=(n,v)=>{const i=E.RI[n];if(i!==undefined)E.RG[i].inp+=v;};
 function sensory(){E.RG.forEach(r=>r.inp=0);add('ME_L',.25);add('ME_R',.25);                        // ambient light (model constant)
  for(const n of ['ME_','LO_','LOP_'])add(n+S.ptrSide,.5*S.ptr);                                        // pointer → optic lobes on that side
  const a=.4*Math.tanh(S.Sin)+.6*S.voice;add('AL_L',a);add('AL_R',a);                                  // voice / site section → antennal lobes
  if(DEC.target>=0){const R=E.RG[DEC.target];R.inp+=.12;add('ME_'+(R.p[0]<0?'L':'R'),.1);}             // attention
  const th=S.focusT>=0?S.focusT:S.siteT;if(th>=0)E.RG.forEach(r=>{if(r.theme===th)r.inp+=.06;});}
 function rspike(i,t){const r=E.RG[i];if(r.ls!==undefined)r.isi+=(Math.min(6,t-r.ls)-r.isi)*.3;r.ls=t;r.tr+=1;r.act=1;r.rate+=1;
  for(const k of r.out){const L=E.LINKS[k];Rsched.push([t+L.len/2.5+.03,L.b,2.0*L.wn*L.W*r.sgn]);}
  for(const k of r.inn){const L=E.LINKS[k];L.W=Math.min(3,L.W+.04*E.RG[L.a].tr);}
  emitSpike&&emitSpike(i,t);}
 let emitSpike=null;E.onSpike=f=>emitSpike=f;
 function ignite(t){S.C=0;S.ign=true;S.ignN++;S.lastIgn=t;emit('ignite',{});}
 function decide(h,t){const RG=E.RG,all=RG.reduce((s,r)=>s+r.rate,0)/RG.length;for(let k=0;k<3;k++)DEC.F[k]*=Math.exp(-h/6);
  const ev=E.GRP.map((g,k)=>Math.min(3,(g.length?g.reduce((s,i)=>s+RG[i].rate,0)/g.length:0)/(all+.05))*(1-Math.min(.8,DEC.F[k])));DEC.ev=ev;
  const X=DEC.X,sum=X[0]+X[1]+X[2];for(let k=0;k<3;k++)X[k]=Math.max(0,X[k]+(.6*ev[k]-X[k]-.5*(sum-X[k]))*h+.18*Math.sqrt(h)*gauss());
  let k=0;for(let q=1;q<3;q++)if(X[q]>X[k])k=q;if(X[k]>.5&&t-DEC.last>2.5)commit(k,t);}
 function commit(k,t){const RG=E.RG,LINKS=E.LINKS,G=E.GRP,ev=DEC.ev.map(v=>+v.toFixed(2)),Xs=DEC.X.map(v=>+v.toFixed(2));let tgt=-1,reason='',L0=null;
  if(k===0){let bs=-1;for(const g of G[0])for(const q of RG[g].out){const L=LINKS[q];if(G[0].includes(L.b))continue;const s=L.wn*L.W*(.5+RG[L.b].rate);if(s>bs){bs=s;tgt=L.b;L0=L;}}
   if(L0)reason=`strongest learned mushroom-body link ${RG[L0.a].name}→${RG[L0.b].name} (${L0.w.toLocaleString()} synapses, Hebbian W ${L0.W.toFixed(2)})`;}
  else if(k===1){let bs=-1;RG.forEach((r,i)=>{if(r.theme<0)return;const s=(1-E.cov[r.theme])+1/(1+r.visits)+.1*Math.log10(r.syn);if(s>bs){bs=s;tgt=i;}});
   if(tgt>=0)reason=`least-attended region: ${RG[tgt].name} (${RG[tgt].visits} visits, ${REG[RG[tgt].theme][1]} coverage ${Math.round(E.cov[RG[tgt].theme]*100)}%)`;}
  else{let bs=-1;for(const g of G[2])for(const q of RG[g].out){const L=LINKS[q];const s=RG[L.b].rate*L.wn;if(s>bs){bs=s;tgt=L.b;L0=L;}}
   if(L0)reason=`innate output ${RG[L0.a].name}→${RG[L0.b].name}, the most active target (rate ${RG[L0.b].rate.toFixed(2)}/s, ${L0.w.toLocaleString()} synapses)`;}
  DEC.X=DEC.X.map(v=>v*.2);DEC.last=t;DEC.F[k]+=.5;if(tgt<0)return;
  for(const g of G[k])for(const q of RG[g].out){const L=LINKS[q];if(L.b===tgt)L.W=Math.min(3,L.W+.15);}   // reinforcement changes future choices
  const prev=DEC.target;DEC.target=tgt;DEC.winner=k;DEC.mode=MODES[k];DEC.n++;const R=RG[tgt];R.visits++;if(R.theme>=0)E.cov[R.theme]=Math.min(1,E.cov[R.theme]+.08);
  const e={mode:MODES[k],winner:GNAME[k],target:R.name,targetIdx:tgt,prevIdx:prev,region:R.theme>=0?REG[R.theme][0]:null,reason,evidence:{MB:ev[0],CX:ev[1],LH:ev[2]},accum:{MB:Xs[0],CX:Xs[1],LH:Xs[2]}};
  DEC.log.unshift({t:+S.t.toFixed(1),...e});if(DEC.log.length>30)DEC.log.pop();emit('decide',e);}
 // one fixed step (h = 1/120 s)
 E.step=h=>{if(!E.ready)return;const t=S.t,tau=5,eps=.08,RG=E.RG;S.ptr*=Math.exp(-h*2);S.vext*=Math.exp(-h*6);
  if((E.k=(E.k||0)+1)%4===0)sensory();
  let w=0;for(let q=0;q<Rsched.length;q++){const e=Rsched[q];if(e[0]<=t)RG[e[1]].Is+=e[2];else Rsched[w++]=e;}Rsched.length=w;
  const sr=new Float32Array(6),si=new Float32Array(6),cnt=new Float32Array(6),rt=new Float32Array(6);let gx=0,gy=0,gw=0;
  RG.forEach((r,i)=>{const I=.24+r.inp+r.Is+gauss()*.05,v=r.v,dv=tau*(v-v*v*v/3-r.w+I);r.v+=dv*h;r.w+=tau*eps*(v+.7-.8*r.w)*h;
   if(v<1&&r.v>=1)rspike(i,t);r.Is*=Math.exp(-h/.12);r.tr*=Math.exp(-h/.4);r.act*=Math.exp(-h*2.5);r.rate*=Math.exp(-h);
   r.ph=r.ls===undefined?0:6.2832*(((t-r.ls)/r.isi)%1);const wq=Math.min(1,r.rate);gx+=wq*Math.cos(r.ph);gy+=wq*Math.sin(r.ph);gw+=wq;   // spike phase: time since last spike over the mean inter-spike interval
   // self-model: forecast of own activity = low-pass mean + trend·horizon; error = what actually happens − forecast
   const m0=r.m;r.m+=(r.act-r.m)*h/.6;r.dm+=((r.m-m0)/h-r.dm)*h/.4;const f=r.pred;r.err+=(Math.abs(r.act-f)-r.err)*h/.5;r.pred=Math.max(0,r.m+.3*r.dm);
   if(r.theme>=0){sr[r.theme]+=wq*Math.cos(r.ph);si[r.theme]+=wq*Math.sin(r.ph);cnt[r.theme]+=wq;rt[r.theme]+=r.rate;}});
  S.r=gw>.5?Math.hypot(gx,gy)/gw:0;   // rate-weighted Kuramoto order of spike phases
  for(const L of E.LINKS)L.W+=(1-L.W)*h/90;for(let k=0;k<6;k++)E.cov[k]*=Math.exp(-h/90);
  let Sx=0,nr=0,ma=0;for(let k=0;k<6;k++)if(cnt[k]>.05){E.tsync[k]=Math.hypot(sr[k],si[k])/cnt[k];E.trate[k]=rt[k]/E.tn[k];Sx+=E.tsync[k]*Math.min(1,E.trate[k]/1.2);nr++;}
  RG.forEach(r=>ma+=r.rate/RG.length);S.err=RG.reduce((s,r)=>s+r.err,0)/RG.length;
  S.C+=h/20*Math.min(1.5,Math.max(.5,ma/.3));                                                          // slow charge between ignitions
  Sx=(nr?Sx/nr:0)+.35*S.C+.35*Math.tanh(S.Sin)+S.voice*.4;S.Sx=Sx;
  S.G+=(-S.G+sig(10*(Sx+.9*S.G-2*S.Ad-E.TH)))*h/.35;S.Ad+=(S.G-S.Ad)*h/3;S.Sin*=Math.exp(-h/1.5);
  if(!S.ign&&S.G>.6&&t-S.lastIgn>10)ignite(t);if(S.ign&&S.G<.25){S.ign=false;emit('release',{});}
  S.aware+=((S.G*.6+.4*S.r)*(1-Math.min(1,S.err/.05))-S.aware)*h/1.2;                                 // awareness: workspace + coherence, discounted by self-prediction error
  decide(h,t);S.t+=h;};
 E.input=(o)=>{if(o.voice!==undefined)S.voice+=(o.voice-S.voice)*.1;if(o.ptr)S.ptr=Math.min(1.5,S.ptr+o.ptr);if(o.side)S.ptrSide=o.side;if(o.bump)S.Sin+=o.bump;};
 E.section=name=>{const k=String(name||'').toLowerCase().replace(/^\/+|\/+$/g,'')||'home';if(k==='contact'){S.Sin+=.5;return;}const t=SITE2T[k];if(t===undefined)return;S.siteT=t;S.Sin+=.2;};
 E.snapshot=()=>({t:+S.t.toFixed(1),G:+S.G.toFixed(3),ignitions:S.ignN,aware:+S.aware.toFixed(3),predErr:+S.err.toFixed(3),sync:+S.r.toFixed(3),mode:DEC.mode,decisions:DEC.n,race:{MB:+DEC.X[0].toFixed(3),CX:+DEC.X[1].toFixed(3),LH:+DEC.X[2].toFixed(3)},
  attention:DEC.target>=0?E.RG[DEC.target].name:null,themes:REG.map((r,k)=>({id:r[0],rate:+E.trate[k].toFixed(3),sync:+E.tsync[k].toFixed(3)}))});
 return E;}
