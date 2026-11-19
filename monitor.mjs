import fs from 'fs';
const S={be:+(process.env.BE||1)};
const KEY=process.env.TD_KEY,TOK=process.env.TG_TOKEN,CHAT=process.env.TG_CHAT,TF=process.env.TF||'1h',MINSC=+(process.env.MIN_SCORE||30);
const PAIRS=(process.env.PAIRS||'EUR/USD,GBP/USD,USD/JPY,USD/CHF,AUD/USD,USD/CAD,NZD/USD,EUR/JPY,GBP/JPY,EUR/GBP').split(',').map(x=>x.trim());
const MS={'15min':9e5,'30min':18e5,'1h':36e5,'4h':144e5}[TF];
const fp=x=>x.toFixed(x>=20?3:5);
const ft=t=>new Date(t).toLocaleString('es-CO',{timeZone:'America/Bogota',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false});
let st={};try{st=JSON.parse(fs.readFileSync('state.json','utf8'))}catch{}
async function send(text){const r=await fetch(`https://api.telegram.org/bot${TOK}/sendMessage`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({chat_id:CHAT,text})});if(!r.ok)console.log('Telegram:',await r.text())}
function ema(a,n){const o=Array(a.length).fill(NaN);let s=0;for(let i=0;i<a.length;i++){if(i<n-1){s+=a[i];continue}if(i===n-1){s+=a[i];o[i]=s/n}else o[i]=o[i-1]+(a[i]-o[i-1])*2/(n+1)}return o}
function atr(c,n=14){const o=Array(c.length).fill(NaN);let s=0;for(let i=0;i<c.length;i++){const tr=i?Math.max(c[i].h-c[i].l,Math.abs(c[i].h-c[i-1].c),Math.abs(c[i].l-c[i-1].c)):c[i].h-c[i].l;if(i<n-1){s+=tr;continue}if(i===n-1){s+=tr;o[i]=s/n}else o[i]=(o[i-1]*(n-1)+tr)/n}return o}
const MAJ='EURUSD,USDJPY,GBPUSD,AUDUSD,USDCAD,USDCHF,NZDUSD',MIN='EURGBP,EURJPY,GBPJPY,EURCHF,EURAUD,EURCAD,EURNZD,GBPCHF,GBPAUD,GBPCAD,GBPNZD,AUDJPY,CADJPY,CHFJPY,NZDJPY,AUDCAD,AUDCHF,AUDNZD,CADCHF,NZDCAD,NZDCHF';
const pipOf=s=>s.replace('/','').toUpperCase().includes('JPY')?.01:.0001;
function cost(sym,px){const k=sym.replace('/','').toUpperCase(),pip=pipOf(sym);return MAJ.includes(k)?1.5*pip:MIN.includes(k)?2.5*pip:px*.00015}

/* ---------- Lógica del script + break even ---------- */
function analyze(c,sym,ms,minSc){
 const n=c.length,E1=ema(c.map(x=>x.c),30),E2=ema(c.map(x=>x.c),50),E3=ema(c.map(x=>x.c),100),A=atr(c),L=5;
 let SH=NaN,SLw=NaN,shB=true,slB=true,tr=0,bO=NaN,bE=NaN,bC=false,sO=NaN,sE=NaN,sC=false,lU=-1e9,lD=-1e9,T=null,scL=0,scS=0;const out=[];
 for(let i=0;i<n;i++){
  const x=c[i],p=c[i-1]||x,q=c[i-2]||x,a=A[i],e1=E1[i],e2=E2[i],e3=E3[i];
  if(i>=2*L){let ph=c[i-L].h,pl=c[i-L].l,H1=true,L1=true;for(let k=i-2*L;k<=i;k++){if(k===i-L)continue;if(c[k].h>ph)H1=false;if(c[k].l<pl)L1=false}
   if(H1){SH=ph;shB=false}if(L1){SLw=pl;slB=false}}
  const bull=!isNaN(SH)&&!shB&&x.c>SH,bear=!isNaN(SLw)&&!slB&&x.c<SLw;
  if(bull){bC=tr===-1;tr=1;shB=true;bO=SLw;bE=x.h}
  if(bear){sC=tr===1;tr=-1;slB=true;sO=SH;sE=x.l}
  if(tr===1)bE=Math.max(isNaN(bE)?x.h:bE,x.h);
  if(tr===-1)sE=Math.min(isNaN(sE)?x.l:sE,x.l);
  const dL=!isNaN(bE)&&!isNaN(bO)&&x.c<(bE+bO)/2,dS=!isNaN(sE)&&!isNaN(sO)&&x.c>(sE+sO)/2;
  if(i>=2){if(x.l>q.h&&x.l-q.h>a*.1)lU=i;if(x.h<q.l&&q.l-x.h>a*.1)lD=i}
  const rU=i-lU<=10,rD=i-lD<=10;
  const rg=x.h-x.l,bd=Math.abs(x.c-x.o),lw=Math.min(x.o,x.c)-x.l,uw=x.h-Math.max(x.o,x.c);
  const eL=x.c>x.o&&p.c<p.o&&x.c>=p.o&&x.o<=p.c,eS=x.c<x.o&&p.c>p.o&&x.c<=p.o&&x.o>=p.c;
  const jL=rg>0&&lw>=1.5*bd&&lw>=.4*rg&&x.c>=x.l+.6*rg,jS=rg>0&&uw>=1.5*bd&&uw>=.4*rg&&x.c<=x.h-.6*rg;
  let vm=0;if(i>=19){for(let k=i-19;k<=i;k++)vm+=c[k].v;vm/=20}
  const vOk=x.v>vm*1.2,bOk=bd>a*.5;
  const bUp=x.l<=e1+.1*a&&x.c>x.o&&x.c>e1+.1*a,bDn=x.h>=e1-.1*a&&x.c<x.o&&x.c<e1-.1*a;
  const fBu=e1>e2&&e2>e3,fBe=e1<e2&&e2<e3;
  const rawL=(fBu?15:(e1>e2&&x.c>e3)?8:0)+(tr===1?15:0)+(tr===1&&bC?5:0)+(rU?15:0)+(eL?8:jL?6:0)+(dL?8:0)+(bOk?4:0)+(vOk?3:0);
  const rawS=(fBe?15:(e1<e2&&x.c<e3)?8:0)+(tr===-1?15:0)+(tr===-1&&sC?5:0)+(rD?15:0)+(eS?8:jS?6:0)+(dS?8:0)+(bOk?4:0)+(vOk?3:0);
  scL=rawL*100/73;scS=rawS*100/73;
  if(T&&T.st==='open'&&i>T.i){
   const hs=T.dir===1?x.l<=T.sl:x.h>=T.sl,ht=T.dir===1?x.h>=T.tp:x.l<=T.tp;
   if(hs||ht){const win=ht&&!hs;T.st=win?'tp':T.be?'be':'sl';T.ct=x.t+ms;T.x=i;T.r=win?T.rr-T.cr:T.be?-T.cr:-(1+T.cr)}
   else if(!T.be&&(T.dir===1?x.h>=T.ent+S.be*T.rsk:x.l<=T.ent-S.be*T.rsk)){T.be=true;T.sl=T.ent} /* sube el stop a la entrada */
  }
  const okB=bUp&&fBu&&scL>=minSc,okS=bDn&&fBe&&scS>=minSc;let sd=0;
  if(!T||T.st!=='open'){if(okB&&okS)sd=scL>=scS?1:-1;else if(okB)sd=1;else if(okS)sd=-1}
  if(sd){
   const raw=sd===1?Math.min(x.l,p.l)-a*.2:Math.max(x.h,p.h)+a*.2,rsk=Math.max(Math.abs(x.c-raw),a*.3);
   if(rsk<=a*4){const cs=cost(sym,x.c),cr=cs/rsk,rr=Math.ceil((2*(1+cr)+cr)*20)/20;
    let ex=2;for(let j=0;j<3;j++){if(cs/(rsk*Math.sqrt([60,300,900][j]/(ms/1000)))<=.15){ex=j;break}}
    T={k:sym+'|'+x.t,s:sym,dir:sd,ent:x.c,sl:x.c-sd*rsk,sl0:x.c-sd*rsk,tp:x.c+sd*rsk*rr,rsk,rr,cr,pp:cs/pipOf(sym),t:x.t+ms,i,st:'open',be:false,ex:['1m','5m','15m'][ex],sc:Math.round(sd===1?scL:scS)};
    out.push(T)}
  }
 }
 out.forEach(t=>{const a=Math.max(0,t.i-25),b=t.st==='open'?n-1:Math.min(n-1,t.x+6);
  t.cs=c.slice(a,b+1).map(z=>[z.o,z.h,z.l,z.c].map(v=>+v.toFixed(5)));t.e=t.i-a;t.xi=t.st==='open'?-1:t.x-a});
 const l=out[out.length-1];
 return{trades:out,last:l?l.k:null,ago:l?n-1-l.i:-1,px:c[n-1].c,scL,scS};
}


if(process.env.TEST==='si')await send('✅ Conexión OK: el robot de señales puede escribirte.');
for(const [i,s] of PAIRS.entries()){
 try{
  const j=await (await fetch(`https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(s)}&interval=${TF}&outputsize=500&timezone=UTC&order=asc&apikey=${KEY}`)).json();
  if(!j.values)throw new Error(j.message||'sin datos');
  const c=j.values.map(v=>({t:Date.parse(v.datetime.replace(' ','T')+'Z'),o:+v.open,h:+v.high,l:+v.low,c:+v.close,v:+(v.volume||0)})).filter(x=>x.t+MS<=Date.now());
  const r=analyze(c,s,MS,MINSC),t=r.trades.find(x=>x.k===r.last);
  if(t&&t.st==='open'&&r.ago<=1&&st[s]!==t.k){
   st[s]=t.k;
   await send(`★ NUEVA SEÑAL\n${t.dir>0?'▲ COMPRA':'▼ VENTA'} ${s}\nEjecutar en ${t.ex}\nEntrada ${fp(t.ent)}\nSL ${fp(t.sl0)}\nTP ${fp(t.tp)}\nRatio 1:${t.rr.toFixed(2)} · Score ${t.sc}\nSpread ${t.pp.toFixed(1)} pips\nVela cerrada ${ft(t.t)} (Colombia)`);
  }
 }catch(e){console.log(s,e.message)}
 if(i<PAIRS.length-1)await new Promise(r=>setTimeout(r,7600));
}
fs.writeFileSync('state.json',JSON.stringify(st));
