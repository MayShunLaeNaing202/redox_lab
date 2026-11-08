(function(){
"use strict";
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
/* bilingual helpers: content is our own, so HTML in it is trusted */
const T=(en,my)=>'<span class="en">'+en+'</span><span class="my">'+my+'</span>';
const L=x=>Array.isArray(x)?T(x[0],x[1]):x;
const TS=(en,my)=>'<tspan class="en">'+en+'</tspan><tspan class="my">'+my+'</tspan>';
function chem(s){
  let h=esc(s);
  h=h.replace(/\^(\d*[+\-])/g,(m,c)=>'<sup>'+c.replace('-','−')+'</sup>');
  h=h.replace(/([A-Za-z\)\]])(\d+)/g,'$1<sub>$2</sub>');
  return h;
}
function renderChem(root){
  root=root||document;
  $$('.c',root).forEach(el=>{ if(el.dataset.done) return; el.innerHTML=chem(el.textContent); el.dataset.done='1'; });
  $$('.ox',root).forEach(el=>{ if(el.dataset.done) return; el.innerHTML='<span class="ox-n">'+esc(el.dataset.n)+'</span><span>'+chem(el.textContent)+'</span>'; el.dataset.done='1'; });
}
const store={
  get(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } },
  set(k,v){ try{ localStorage.setItem(k,v); }catch(e){} }
};
function shuffle(a){ a=a.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
function fmt(v){
  if(Math.abs(v)<1e-9) return '0';
  const sign=v>0?'+':'−', a=Math.abs(v);
  if(Math.abs(a-Math.round(a))<1e-9) return sign+Math.round(a);
  for(let d=2; d<=12; d++){ const n=a*d; if(Math.abs(n-Math.round(n))<1e-9) return sign+Math.round(n)+'/'+d; }
  return sign+a.toFixed(2);
}

/* ---------- Language ---------- */
function curLang(){ return document.documentElement.dataset.lang==='my'?'my':'en'; }
function setLang(l){
  document.documentElement.dataset.lang=l; document.documentElement.lang=(l==='my'?'my':'en');
  store.set('redox-lang',l); updateTitle();
}
$$('.lang-toggle').forEach(b=>b.addEventListener('click',()=>setLang(curLang()==='my'?'en':'my')));

/* ---------- Theme ---------- */
const themeBtns=$$('.theme-toggle');
function currentDark(){ const t=document.documentElement.dataset.theme; if(t) return t==='dark'; return window.matchMedia('(prefers-color-scheme: dark)').matches; }
function syncThemeBtn(){
  const d=currentDark();
  themeBtns.forEach(b=>{
    const short=b.closest('.topbar');
    b.innerHTML=short?(d?'☀':'☾'):(d?'☀ '+T('Light mode','အလင်း'):'☾ '+T('Dark mode','အမှောင်'));
    b.setAttribute('aria-label',d?'Switch to light mode':'Switch to dark mode');
  });
}
const savedTheme=store.get('redox-theme'); if(savedTheme) document.documentElement.dataset.theme=savedTheme;
syncThemeBtn();
themeBtns.forEach(b=>b.addEventListener('click',()=>{ const t=currentDark()?'light':'dark'; document.documentElement.dataset.theme=t; store.set('redox-theme',t); syncThemeBtn(); }));
try{ window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change',()=>{ if(!document.documentElement.dataset.theme) syncThemeBtn(); }); }catch(e){}

/* ---------- Nav / routing ---------- */
const side=$('#side'), menuBtn=$('#menuBtn');
function closeNav(){ side.classList.remove('open'); menuBtn.setAttribute('aria-expanded','false'); }
menuBtn.addEventListener('click',()=>{ const o=side.classList.toggle('open'); menuBtn.setAttribute('aria-expanded',o?'true':'false'); });
document.addEventListener('click',e=>{ if(side.classList.contains('open') && !side.contains(e.target) && !menuBtn.contains(e.target)) closeNav(); });
const views=$$('.view').map(v=>v.dataset.view);
const titles={home:['Overview','မိတ်ဆက်'],'oxidation-numbers':['Oxidation numbers','Oxidation number များ'],concepts:['Oxidation and reduction','Oxidation နှင့် reduction'],redox:['Redox reactions','Redox ဓာတ်ပြုမှုများ'],agents:['Oxidising and reducing agents','Oxidising နှင့် reducing agent'],balancing:['Balancing redox equations','ညီမျှခြင်း ချိန်ညှိခြင်း'],practice:['Practice quiz','လေ့ကျင့်ရန် Quiz'],'chapter-test':['Chapter end test','အခန်းဆုံး စာမေးပွဲ']};
let curView='home';
function updateTitle(){ document.title='Redox Lab: '+titles[curView][curLang()==='my'?1:0]; }
function route(){
  let h=location.hash.slice(1); if(!views.includes(h)) h='home'; curView=h;
  $$('.view').forEach(v=>{ v.hidden=v.dataset.view!==h; });
  $$('.nav a').forEach(a=>{ if(a.getAttribute('href')==='#'+h) a.setAttribute('aria-current','page'); else a.removeAttribute('aria-current'); });
  updateTitle(); closeNav(); window.scrollTo(0,0);
}
window.addEventListener('hashchange',route);

/* ---------- Oxidation number scale ---------- */
let scaleId=0;
function scaleSVG(points,opt){
  opt=opt||{}; const min=opt.min??-4, max=opt.max??8, W=760, H=212, px=40, axisY=128;
  const x=v=>px+(Math.max(min,Math.min(max,v))-min)/(max-min)*(W-2*px);
  const id='s'+(scaleId++);
  let s='<svg class="scale'+(opt.play?' play':'')+'" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="'+esc(opt.label||'Oxidation number scale')+'">';
  s+='<defs><marker id="'+id+'o" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="var(--ox)"/></marker><marker id="'+id+'r" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="var(--rd)"/></marker></defs>';
  s+='<text class="s-t-o" x="'+x(min)+'" y="16">'+TS('Oxidation: oxidation number goes up','Oxidation: oxidation number တိုးလာသည်')+'</text>';
  s+='<line class="s-arrow-o" x1="'+x(min)+'" y1="26" x2="'+(x(max)-2)+'" y2="26" marker-end="url(#'+id+'o)"/>';
  s+='<line class="s-axis" x1="'+(px-14)+'" y1="'+axisY+'" x2="'+(W-px+14)+'" y2="'+axisY+'"/>';
  for(let v=min; v<=max; v++){
    s+='<line class="s-tick" x1="'+x(v)+'" y1="'+(axisY-6)+'" x2="'+x(v)+'" y2="'+(axisY+6)+'"/>';
    s+='<text class="s-num'+(v===0?' s-zero':'')+'" x="'+x(v)+'" y="'+(axisY+24)+'">'+(v>0?'+'+v:(v<0?'−'+(-v):'0'))+'</text>';
  }
  s+='<line class="s-arrow-r" x1="'+x(max)+'" y1="'+(H-30)+'" x2="'+(x(min)+2)+'" y2="'+(H-30)+'" marker-end="url(#'+id+'r)"/>';
  s+='<text class="s-t-r" x="'+x(max)+'" y="'+(H-10)+'" text-anchor="end">'+TS('Reduction: oxidation number goes down','Reduction: oxidation number လျော့သွားသည်')+'</text>';
  const rows=[98,76,54], ends=[-1e9,-1e9,-1e9];
  const sorted=points.map((p,i)=>Object.assign({i},p)).sort((a,b)=>a.v-b.v);
  sorted.forEach((p,k)=>{
    const lab=Array.isArray(p.label)?p.label:[p.label,p.label];
    const cx=x(p.v), w=Math.max(lab[0].length,lab[1].length*0.85)*7.4+10;
    let r=rows.findIndex((_,ri)=>ends[ri] < cx-w/2); if(r<0) r=ends.indexOf(Math.min(...ends));
    ends[r]=cx+w/2;
    const col=p.v>0?'var(--ox)':(p.v<0?'var(--rd)':'var(--ink)');
    s+='<g class="s-pt" style="animation-delay:'+(k*90+150)+'ms">';
    s+='<line class="s-lead" x1="'+cx+'" y1="'+(rows[r]+5)+'" x2="'+cx+'" y2="'+(axisY-9)+'"/>';
    s+='<text class="s-lab" x="'+cx+'" y="'+rows[r]+'">'+(lab[0]===lab[1]?esc(lab[0]):TS(esc(lab[0]),esc(lab[1])))+'</text>';
    s+='<circle class="s-dot" cx="'+cx+'" cy="'+axisY+'" r="8.5" fill="'+col+'"/></g>';
  });
  return s+'</svg>';
}
$('#heroScale').innerHTML=scaleSVG([
  {v:-3,label:['N in NH₄⁺','NH₄⁺ ထဲက N']},{v:-1,label:['Cl in NaCl','NaCl ထဲက Cl']},{v:0,label:'Cl₂'},{v:2,label:['Cu in CuO','CuO ထဲက Cu']},
  {v:4,label:['C in CO₂','CO₂ ထဲက C']},{v:6,label:['S in H₂SO₄','H₂SO₄ ထဲက S']},{v:7,label:['Mn in MnO₄⁻','MnO₄⁻ ထဲက Mn']}
],{min:-3,max:7,play:true,label:'Oxidation numbers from minus 3 to plus 7 with examples'});

/* ---------- Formula parser + oxidation number solver ---------- */
const ELEMENTS=new Set('H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn Ga Ge As Se Br Kr Rb Sr Y Zr Nb Mo Tc Ru Rh Pd Ag Cd In Sn Sb Te I Xe Cs Ba La Ce Pr Nd Pm Sm Eu Gd Tb Dy Ho Er Tm Yb Lu Hf Ta W Re Os Ir Pt Au Hg Tl Pb Bi Po At Rn Fr Ra Ac Th Pa U Np Pu'.split(' '));
const NONMETALS=new Set('H He B C N O F Ne Si P S Cl Ar As Se Br Kr Te I Xe At Rn'.split(' '));
const G1=new Set('Li Na K Rb Cs Fr'.split(' ')), G2=new Set('Be Mg Ca Sr Ba Ra'.split(' '));
function parseFormula(str){
  const s=str.replace(/\s+/g,''); let pos=0;
  const readNum=()=>{ let n=''; while(pos<s.length && /\d/.test(s[pos])) n+=s[pos++]; return n?parseInt(n,10):1; };
  const notClosed=['A bracket is not closed.','ကွင်း မပိတ်ရသေးပါ။'];
  function group(depth){
    const m=new Map(); const add=(e,n)=>m.set(e,(m.get(e)||0)+n);
    while(pos<s.length){
      const ch=s[pos];
      if(ch==='('||ch==='['){ pos++; const inner=group(depth+1); if(s[pos]!==')'&&s[pos]!==']') throw notClosed; pos++; const n=readNum(); inner.forEach((c,e)=>add(e,c*n)); }
      else if(ch===')'||ch===']'){ if(depth===0) throw ['There is a closing bracket without an opening one.','အဖွင့်ကွင်း မရှိဘဲ အပိတ်ကွင်း ရှိနေပါတယ်။']; return m; }
      else if(/[A-Z]/.test(ch)){
        let sym=ch; pos++;
        if(pos<s.length && /[a-z]/.test(s[pos])){ sym+=s[pos]; pos++; }
        if(!ELEMENTS.has(sym)) throw ['“'+esc(sym)+'” is not an element symbol. Check capital and small letters.','“'+esc(sym)+'” က element သင်္ကေတ မဟုတ်ပါ။ စာလုံး အကြီးအသေးကို စစ်ပါ။'];
        add(sym,readNum());
      }
      else if(/\d/.test(ch) && pos===0) throw ['Leave out the number in front (the coefficient). Type just the formula.','ရှေ့က ဂဏန်း (coefficient) ကို ဖြုတ်ပြီး formula ကိုသာ ရိုက်ပါ။'];
      else throw ['The character “'+esc(ch)+'” cannot be used in a formula.','“'+esc(ch)+'” စာလုံးကို formula ထဲမှာ သုံးလို့ မရပါ။'];
    }
    if(depth>0) throw notClosed;
    return m;
  }
  const m=group(0); if(m.size===0) throw ['Type a formula first, for example H2SO4.','Formula ကို အရင် ရိုက်ထည့်ပါ၊ ဥပမာ H2SO4။']; return m;
}
function oxCompute(map,charge){
  const els=[...map.keys()], val=new Map(), why=new Map(), has=e=>map.has(e);
  let peroxide=false;
  if(els.length===1){
    const e=els[0]; val.set(e,charge/map.get(e));
    why.set(e, charge===0?['An element on its own (free state) is always 0.','Element တစ်မျိုးတည်း သီးသန့် (free state) ဆိုရင် အမြဲ 0 ဖြစ်ပါတယ်။']:['A single-element ion: oxidation number = charge ÷ number of atoms.','Element တစ်မျိုးတည်း ion: oxidation number = charge ÷ atom အရေအတွက်။']);
    return {val,why,unknown:null,single:true};
  }
  els.forEach(e=>{
    if(e==='F'){ val.set(e,-1); why.set(e,['Fluorine is always −1 in compounds.','Compound တွေမှာ fluorine က အမြဲ −1 ဖြစ်ပါတယ်။']); }
    else if(G1.has(e)){ val.set(e,1); why.set(e,['Alkali metal (Group 1): +1.','Alkali metal (Group 1): +1။']); }
    else if(G2.has(e)){ val.set(e,2); why.set(e,['Alkaline earth metal (Group 2): +2.','Alkaline earth metal (Group 2): +2။']); }
    else if(e==='Al'){ val.set(e,3); why.set(e,['Aluminium is +3 in its compounds.','Compound တွေမှာ aluminium က +3 ဖြစ်ပါတယ်။']); }
  });
  if(has('H') && !val.has('H')){
    const hydride=els.filter(e=>e!=='H').every(e=>!NONMETALS.has(e)||e==='B'||e==='Si');
    val.set('H',hydride?-1:1); why.set('H',hydride?['Hydrogen with a metal (a hydride): −1.','သတ္တုနဲ့ ပေါင်းထားတဲ့ hydrogen (hydride): −1။']:['Hydrogen: +1.','Hydrogen: +1။']);
  }
  if(has('O') && !val.has('O') && !has('F')){ val.set('O',-2); why.set('O',['Oxygen: −2.','Oxygen: −2။']); }
  const unknowns=()=>els.filter(e=>!val.has(e));
  if(unknowns().length>1){
    for(const h of ['Cl','Br','I']){ if(unknowns().includes(h)){ val.set(h,-1); why.set(h,['Halogen with a less electronegative partner: −1.','Electronegativity နည်းတဲ့ atom နဲ့ ပေါင်းထားတဲ့ halogen: −1။']); break; } }
  }
  if(unknowns().length>1 && !has('O')){
    const nm=unknowns().filter(e=>NONMETALS.has(e)); const typical={S:-2,Se:-2,N:-3,P:-3};
    if(nm.length===1 && typical[nm[0]]!==undefined){ const e=nm[0], t=fmt(typical[e]); val.set(e,typical[e]); why.set(e,[e+' joined to a metal takes its usual negative value: '+t+'.',e+' က သတ္တုနဲ့ ပေါင်းထားလို့ ပုံမှန် အနုတ်တန်ဖိုး '+t+' ကို ယူပါတယ်။']); }
  }
  const sumKnown=()=>els.reduce((a,e)=>a+(val.has(e)?val.get(e)*map.get(e):0),0);
  let u=unknowns();
  if(u.length===0){
    if(Math.abs(sumKnown()-charge)<1e-9) return {val,why,unknown:null};
    if(has('O') && !has('F')){ val.delete('O'); why.set('O',['Oxygen cannot be −2 here (for example a peroxide), so solve for it.','ဒီမှာ oxygen က −2 မဖြစ်နိုင်ပါ (ဥပမာ peroxide)၊ ဒါကြောင့် တွက်ရှာပါ။']); peroxide=true; u=['O']; }
    else return {error:['The usual rules give a total that does not match the charge. Check the formula and the charge.','ပုံမှန် စည်းမျဉ်းတွေနဲ့ တွက်တဲ့ စုစုပေါင်းက charge နဲ့ မကိုက်ပါ။ Formula နဲ့ charge ကို စစ်ပါ။']};
  }
  if(u.length>1){ const list=u.join(', '); return {error:['There is more than one unknown ('+list+'), so the rules alone cannot decide. Try the polyatomic ion on its own first. For CuSO4, find S in SO4 with charge 2−, then use SO4 = −2 to get Cu.','မသိကိန်း တစ်ခုထက် ပိုရှိနေပါတယ် ('+list+')၊ ဒါကြောင့် စည်းမျဉ်းတွေနဲ့တင် ဆုံးဖြတ်လို့ မရပါ။ Polyatomic ion ကို အရင် သီးသန့် တွက်ပါ။ CuSO4 အတွက် SO4 (charge 2−) ထဲက S ကို အရင်ရှာပြီး SO4 = −2 ကို သုံးကာ Cu ကို ရှာပါ။']}; }
  const e=u[0]; val.set(e,(charge-sumKnown())/map.get(e)); if(!why.has(e)) why.set(e,['Unknown: solved so the total equals the charge.','မသိကိန်း: စုစုပေါင်းက charge နဲ့ ညီအောင် တွက်ရှာထားပါတယ်။']);
  return {val,why,unknown:e,peroxide};
}
const calcInput=$('#calc-input'), calcCharge=$('#calc-charge'), calcOut=$('#calc-out');
function setCharge(c){ if(![...calcCharge.options].some(o=>+o.value===c)){ const o=document.createElement('option'); o.value=c; o.textContent=Math.abs(c)+(c>0?'+':'−'); calcCharge.appendChild(o);} calcCharge.value=String(c); }
function runCalc(){
  let raw=calcInput.value.trim(), charge=parseInt(calcCharge.value,10);
  const m=raw.match(/\^(\d*)([+\-])$/);
  if(m){ charge=(m[2]==='-'?-1:1)*(m[1]?parseInt(m[1],10):1); raw=raw.slice(0,m.index); setCharge(charge); }
  let map; try{ map=parseFormula(raw); }catch(err){ calcOut.innerHTML='<div class="msg">'+L(err)+'</div>'; return; }
  const r=oxCompute(map,charge);
  if(r.error){ calcOut.innerHTML='<div class="msg">'+L(r.error)+'</div>'; return; }
  const els=[...map.keys()];
  const chargeTxt=charge===0?'':'<sup>'+(Math.abs(charge)===1?'':Math.abs(charge))+(charge>0?'+':'−')+'</sup>';
  let f='<div class="calc-formula" aria-label="Formula with oxidation numbers">';
  els.forEach(e=>{ const v=r.val.get(e), n=map.get(e); f+='<span class="ox"><span class="ox-n '+(v>0?'pos':(v<0?'neg':''))+'">'+fmt(v)+'</span><span>'+e+(n>1?'<sub>'+n+'</sub>':'')+'</span></span>'; });
  f+='<span>'+chargeTxt+'</span></div>';
  let st='<ol class="steps">';
  if(r.single){
    const e=els[0];
    st+='<li>'+L(r.why.get(e))+'</li><li>'+map.get(e)+' × '+e+' = '+(charge===0?'0':fmt(charge))+'</li><li>'+e+' = <b>'+fmt(r.val.get(e))+'</b></li>';
  } else {
    const U=r.unknown;
    st+='<li>'+T('Known values:','သိပြီးသား တန်ဖိုးများ:')+'<ul>'+els.filter(e=>e!==U).map(e=>'<li><b>'+e+'</b>: '+fmt(r.val.get(e))+'. '+L(r.why.get(e))+'</li>').join('')+(U?'<li><b>'+U+'</b>: '+T('unknown, call it '+U+'.','မသိကိန်း၊ '+U+' လို့ ခေါ်ပါမယ်။')+' '+(r.peroxide?L(r.why.get(U)):'')+'</li>':'')+'</ul></li>';
    st+='<li>'+T('Multiply by the number of atoms:','Atom အရေအတွက်နဲ့ မြှောက်ပါ:')+'<ul>'+els.map(e=>'<li>'+map.get(e)+' '+e+': '+(e===U?(map.get(e)>1?map.get(e)+U:U):map.get(e)+' × ('+fmt(r.val.get(e))+') = '+fmt(r.val.get(e)*map.get(e)))+'</li>').join('')+'</ul></li>';
    const terms=els.map(e=>e===U?(map.get(e)>1?map.get(e)+U:U):'('+fmt(r.val.get(e)*map.get(e))+')').join(' + ');
    const target=charge===0?'0':fmt(charge)+' '+T('(the charge on the ion)','(ion ရဲ့ charge)');
    let tail;
    if(U){ const v=r.val.get(U), avg=Math.abs(v-Math.round(v))>1e-9; tail='<br>'+T('So ','ဒါကြောင့် ')+U+' = <b class="'+(v>=0?'o':'r')+'">'+fmt(v)+'</b>'+(avg?' '+T('(an average over all the '+U+' atoms)','('+U+' atom အားလုံးရဲ့ ပျမ်းမျှ)'):''); }
    else tail='<br>'+T('Every value came from the rules and the total checks out.','တန်ဖိုးအားလုံး စည်းမျဉ်းတွေကနေ ရပြီး စုစုပေါင်းလည်း မှန်ကန်ပါတယ်။');
    st+='<li>'+T('Add them up:','ပေါင်းပါ:')+' '+terms+' = '+target+tail+'</li>';
  }
  st+='</ol>';
  const pts=els.map(e=>({v:r.val.get(e),label:e+' '+fmt(r.val.get(e))}));
  calcOut.innerHTML=f+st+'<div class="scale-wrap" style="margin-top:6px">'+scaleSVG(pts,{min:-4,max:8,label:'Oxidation numbers of each element'})+'</div>';
}
$('#calc-go').addEventListener('click',runCalc);
calcInput.addEventListener('keydown',e=>{ if(e.key==='Enter') runCalc(); });
const examples=[['KClO4',0],['CaCl2',0],['ClF3',0],['Cl2',0],['CrO3',0],['Cr2O3',0],['Cr2O7',-2],['SO4',-2],['H2S',0],['FeCl3',0],['NO3',-1],['NH4',1],['H2O2',0],['NaBH4',0],['AlH3',0]];
$('#calc-chips').innerHTML=examples.map(([f,c],i)=>'<button class="chip" data-i="'+i+'">'+chem(f)+(c?'<sup>'+(Math.abs(c)>1?Math.abs(c):'')+(c>0?'+':'−')+'</sup>':'')+'</button>').join('');
$('#calc-chips').addEventListener('click',e=>{ const b=e.target.closest('button'); if(!b) return; const [f,c]=examples[+b.dataset.i]; calcInput.value=f; setCharge(c); runCalc(); });
runCalc();

/* ---------- Tabs ---------- */
const tabs=$$('.tab');
function selectTab(t){ tabs.forEach(x=>{ const on=x===t; x.setAttribute('aria-selected',on); x.tabIndex=on?0:-1; $('#'+x.getAttribute('aria-controls')).hidden=!on; }); }
tabs.forEach((t,i)=>{
  t.addEventListener('click',()=>selectTab(t));
  t.addEventListener('keydown',e=>{ let j=null; if(e.key==='ArrowRight') j=(i+1)%tabs.length; if(e.key==='ArrowLeft') j=(i-1+tabs.length)%tabs.length; if(j!==null){ tabs[j].focus(); selectTab(tabs[j]); } });
});

/* ---------- Electron animations ---------- */
const BTN_GO=T('Transfer the electrons','Electron များကို လွှဲပြောင်းရန်'), BTN_RESET=T('Reset','ပြန်စရန်');
function tween(dur,fn,done){
  if(reduceMotion){ fn(1); if(done) done(); return; }
  const t0=performance.now();
  (function step(t){ const p=Math.min(1,(t-t0)/dur); const e=p<.5?2*p*p:1-Math.pow(-2*p+2,2)/2; fn(e); if(p<1) requestAnimationFrame(step); else if(done) done(); })(t0);
}
function move(g,from,to,lift,dur,done){ tween(dur,e=>{ const x=from[0]+(to[0]-from[0])*e, y=from[1]+(to[1]-from[1])*e-Math.sin(Math.PI*e)*lift; g.setAttribute('transform','translate('+x.toFixed(1)+' '+y.toFixed(1)+')'); },done); }
const elG=(id,x,y)=>'<g class="a-el" id="'+id+'" transform="translate('+x+' '+y+')"><circle r="10"/><text>e⁻</text></g>';
const setSvgText=(id,en,my)=>{ $('#'+id).innerHTML=(en===my?en:TS(en,my)); };

(function znCu(){
  const host=$('#znCu'); const A=[[192,96],[192,146]], B=[[372,96],[372,146]];
  host.innerHTML='<svg class="anim" viewBox="0 0 560 230" role="img" aria-label="Zinc atom gives two electrons to a copper two plus ion">'+
    '<path class="a-path" d="M200 70 Q280 20 362 70"/><text class="a-pt" x="280" y="34">2e⁻</text>'+
    '<circle class="a-zn" cx="140" cy="121" r="44"/><text class="a-nt" id="znT" x="140" y="121">Zn</text>'+
    '<circle class="a-cu" cx="420" cy="121" r="44"/><text class="a-nt" id="cuT" x="420" y="121">Cu²⁺</text>'+
    elG('ze1',A[0][0],A[0][1])+elG('ze2',A[1][0],A[1][1])+
    '<text class="a-cap strong" x="140" y="196" id="znC1"></text><text class="a-cap" x="140" y="216" id="znC2"></text>'+
    '<text class="a-cap strong" x="420" y="196" id="cuC1"></text><text class="a-cap" x="420" y="216" id="cuC2"></text></svg>';
  const btn=$('#znCuBtn'); let state=0;
  const before=()=>{ $('#znT').textContent='Zn'; $('#cuT').textContent='Cu²⁺'; setSvgText('znC1','Zn atom','Zn atom'); setSvgText('znC2','will be oxidised','oxidise ဖြစ်မည်'); setSvgText('cuC1','Cu²⁺ ion','Cu²⁺ ion'); setSvgText('cuC2','will be reduced','reduce ဖြစ်မည်'); btn.innerHTML=BTN_GO; };
  before();
  btn.addEventListener('click',()=>{
    if(state===1) return;
    if(state===2){ $('#ze1').setAttribute('transform','translate('+A[0]+')'); $('#ze2').setAttribute('transform','translate('+A[1]+')'); before(); state=0; return; }
    state=1; btn.disabled=true;
    move($('#ze1'),A[0],B[0],60,1100);
    setTimeout(()=>move($('#ze2'),A[1],B[1],60,1100,()=>{
      $('#znT').textContent='Zn²⁺'; $('#cuT').textContent='Cu';
      setSvgText('znC1','Zn²⁺ ion','Zn²⁺ ion'); setSvgText('znC2','oxidised: lost 2e⁻','oxidise ဖြစ်: 2e⁻ ဆုံး'); setSvgText('cuC1','Cu atom','Cu atom'); setSvgText('cuC2','reduced: gained 2e⁻','reduce ဖြစ်: 2e⁻ ရ');
      btn.innerHTML=BTN_RESET; btn.disabled=false; state=2;
    }), reduceMotion?0:250);
  });
})();

(function mgO(){
  const host=$('#mgO'); const MG=[150,112], O=[450,112];
  const pos=(c,r,deg)=>[+(c[0]+r*Math.cos(deg*Math.PI/180)).toFixed(1), +(c[1]+r*Math.sin(deg*Math.PI/180)).toFixed(1)];
  const dot=(p,cls)=>'<circle class="'+cls+'" cx="'+p[0]+'" cy="'+p[1]+'" r="5"/>';
  let s='<svg class="anim" viewBox="0 0 600 250" role="img" aria-label="Magnesium atom gives two outer electrons to an oxygen atom">';
  s+='<circle class="a-shell" cx="'+MG[0]+'" cy="'+MG[1]+'" r="22"/><circle class="a-shell" cx="'+MG[0]+'" cy="'+MG[1]+'" r="42"/><circle class="a-shell" id="mgOuter" cx="'+MG[0]+'" cy="'+MG[1]+'" r="64"/>';
  s+='<circle class="a-shell" cx="'+O[0]+'" cy="'+O[1]+'" r="22"/><circle class="a-shell" cx="'+O[0]+'" cy="'+O[1]+'" r="44"/>';
  [90,270].forEach(a=>{ s+=dot(pos(MG,22,a),'a-eo'); s+=dot(pos(O,22,a),'a-er'); });
  for(let k=0;k<8;k++) s+=dot(pos(MG,42,k*45),'a-eo');
  [22.5,67.5,112.5,247.5,292.5,337.5].forEach(a=>{ s+=dot(pos(O,44,a),'a-er'); });
  s+='<circle class="a-nuc" cx="'+MG[0]+'" cy="'+MG[1]+'" r="15"/><text class="a-nt" id="mgT" x="'+MG[0]+'" y="'+MG[1]+'" style="font-size:12px">Mg</text>';
  s+='<circle class="a-nuc" cx="'+O[0]+'" cy="'+O[1]+'" r="15"/><text class="a-nt" id="oT" x="'+O[0]+'" y="'+O[1]+'" style="font-size:12px">O</text>';
  s+='<text class="a-plus" x="300" y="112">+</text>';
  const from=[pos(MG,64,-25),pos(MG,64,25)], to=[pos(O,44,202.5),pos(O,44,157.5)];
  s+='<g id="mgE1" transform="translate('+from[0]+')"><circle class="a-eo" r="6"/></g><g id="mgE2" transform="translate('+from[1]+')"><circle class="a-eo" r="6"/></g>';
  s+='<text class="a-cap strong" x="'+MG[0]+'" y="212" id="mgC1"></text><text class="a-cap" x="'+MG[0]+'" y="232" id="mgC2"></text>';
  s+='<text class="a-cap strong" x="'+O[0]+'" y="212" id="oC1"></text><text class="a-cap" x="'+O[0]+'" y="232" id="oC2"></text></svg>';
  host.innerHTML=s;
  const btn=$('#mgOBtn'); let state=0;
  const before=()=>{ $('#mgOuter').classList.remove('gone'); $('#mgT').textContent='Mg'; $('#oT').textContent='O'; setSvgText('mgC1','Mg (2.8.2)','Mg (2.8.2)'); setSvgText('mgC2','to be oxidised','oxidise ဖြစ်မည်'); setSvgText('oC1','O (2.6)','O (2.6)'); setSvgText('oC2','to be reduced','reduce ဖြစ်မည်'); btn.innerHTML=BTN_GO; };
  before();
  btn.addEventListener('click',()=>{
    if(state===1) return;
    if(state===2){ $('#mgE1').setAttribute('transform','translate('+from[0]+')'); $('#mgE2').setAttribute('transform','translate('+from[1]+')'); before(); state=0; return; }
    state=1; btn.disabled=true;
    move($('#mgE1'),from[0],to[0],70,1200);
    setTimeout(()=>move($('#mgE2'),from[1],to[1],40,1200,()=>{
      $('#mgOuter').classList.add('gone'); $('#mgT').textContent='Mg²⁺'; $('#oT').textContent='O²⁻';
      setSvgText('mgC1','Mg²⁺ (2.8)','Mg²⁺ (2.8)'); setSvgText('mgC2','oxidised: lost 2e⁻','oxidise ဖြစ်: 2e⁻ ဆုံး'); setSvgText('oC1','O²⁻ (2.8)','O²⁻ (2.8)'); setSvgText('oC2','reduced: gained 2e⁻','reduce ဖြစ်: 2e⁻ ရ');
      btn.innerHTML=BTN_RESET; btn.disabled=false; state=2;
    }), reduceMotion?0:250);
  });
})();

/* ---------- Is it redox? ---------- */
const OK=T('Correct.','မှန်ပါတယ်။'), NO=T('Not quite.','မမှန်ပါ။');
const scoreTxt=(r,d)=>T(r+' of '+d+' correct',d+' ခုမှာ '+r+' ခု မှန်');
const redoxItems=[
  {eq:'NH3 (g) + H2O (l) → NH4^+ (aq) + OH^- (aq)',a:false,e:['No change: N stays −3, H stays +1, O stays −2. This is an acid–base reaction.','ပြောင်းလဲမှု မရှိပါ: N က −3၊ H က +1၊ O က −2 အတိုင်း ရှိနေပါတယ်။ ဒါက acid–base ဓာတ်ပြုမှု ဖြစ်ပါတယ်။']},
  {eq:'2H2O2 (l) → 2H2O (l) + O2 (g)',a:true,e:['Oxygen goes from −1 to −2 (reduced) and from −1 to 0 (oxidised).','Oxygen က −1 ကနေ −2 (reduce) နဲ့ −1 ကနေ 0 (oxidise) ဖြစ်ပါတယ်။']},
  {eq:'Ba^2+ (aq) + SO4^2- (aq) → BaSO4 (s)',a:false,e:['No change: Ba stays +2 and S stays +6. This is precipitation.','ပြောင်းလဲမှု မရှိပါ: Ba က +2 နဲ့ S က +6 အတိုင်း ရှိပါတယ်။ ဒါက precipitation (အနည်ထိုင်ခြင်း) ဖြစ်ပါတယ်။']},
  {eq:'CuO (s) + H2 (g) → Cu (s) + H2O (l)',a:true,e:['Cu goes from +2 to 0 (reduced) and H from 0 to +1 (oxidised).','Cu က +2 ကနေ 0 (reduce) နဲ့ H က 0 ကနေ +1 (oxidise) ဖြစ်ပါတယ်။']},
  {eq:'BaCl2 (aq) + H2SO4 (aq) → BaSO4 (s) + 2HCl (aq)',a:false,e:['No oxidation number changes. Ions just swap partners.','Oxidation number တစ်ခုမှ မပြောင်းပါ။ Ion တွေ နေရာချင်း လဲရုံပါပဲ။']},
  {eq:'2Na (s) + 2H2O (l) → 2NaOH (aq) + H2 (g)',a:true,e:['Na goes from 0 to +1 (oxidised) and H from +1 to 0 (reduced).','Na က 0 ကနေ +1 (oxidise) နဲ့ H က +1 ကနေ 0 (reduce) ဖြစ်ပါတယ်။']},
  {eq:'MgO (s) + H2CO3 (aq) → MgCO3 (s) + H2O (l)',a:false,e:['Mg stays +2, C stays +4, O stays −2. Not redox.','Mg က +2၊ C က +4၊ O က −2 အတိုင်း ရှိပါတယ်။ Redox မဟုတ်ပါ။']},
  {eq:'Fe2O3 (s) + 3CO (g) → 2Fe (s) + 3CO2 (g)',a:true,e:['Fe goes from +3 to 0 (reduced) and C from +2 to +4 (oxidised).','Fe က +3 ကနေ 0 (reduce) နဲ့ C က +2 ကနေ +4 (oxidise) ဖြစ်ပါတယ်။']}
];
(function buildChecks(){
  const host=$('#redoxChecks'), scoreEl=$('#redoxScore'); let done=0, right=0;
  host.innerHTML=redoxItems.map((it,i)=>'<li data-i="'+i+'"><span class="eqx c">'+esc(it.eq)+'</span><span class="row"><button class="mini" data-v="1">Redox</button><button class="mini" data-v="0">'+T('Not redox','Redox မဟုတ်')+'</button></span><div class="fb"></div></li>').join('');
  renderChem(host);
  host.addEventListener('click',e=>{
    const b=e.target.closest('button.mini'); if(!b) return; const li=b.closest('li'); if(li.dataset.answered) return;
    const it=redoxItems[+li.dataset.i], ok=(b.dataset.v==='1')===it.a; li.dataset.answered='1'; done++; if(ok) right++;
    b.classList.add(ok?'sel-ok':'sel-no'); $$('button.mini',li).forEach(x=>x.disabled=true);
    const fb=$('.fb',li); fb.className='fb show '+(ok?'ok':'no'); fb.innerHTML='<b>'+(ok?OK:NO)+'</b> '+L(it.e);
    scoreEl.innerHTML=scoreTxt(right,done)+(done===redoxItems.length&&right===done?' '+T('Perfect!','အကုန်မှန်ပါတယ်!'):'');
  });
})();

/* ---------- Sort game ---------- */
const sortItems=[
  ['Oxygen, O₂','ox',['Oxygen accepts electrons and is reduced to O²⁻.','Oxygen က electron လက်ခံပြီး O²⁻ အဖြစ် reduce ဖြစ်ပါတယ်။']],
  ['Chlorine, Cl₂','ox',['Halogens accept electrons and become halide ions.','Halogen တွေက electron လက်ခံပြီး halide ion ဖြစ်လာပါတယ်။']],
  ['Carbon, C','red',['Carbon takes oxygen from metal oxides, so it is oxidised.','Carbon က metal oxide တွေဆီက oxygen ကို ယူလို့ oxidise ဖြစ်ပါတယ်။']],
  ['Potassium permanganate, KMnO₄','ox',['Mn is +7, a high oxidation state, so it accepts electrons.','Mn က +7 ဖြစ်ပြီး oxidation state မြင့်လို့ electron လက်ခံပါတယ်။']],
  ['Carbon monoxide, CO','red',['C is +2 and is oxidised to +4 in CO₂.','C က +2 ကနေ CO₂ မှာ +4 အဖြစ် oxidise ဖြစ်ပါတယ်။']],
  ['Concentrated nitric acid, HNO₃','ox',['N is +5, its highest state, so it is reduced.','N က +5 ဖြစ်ပြီး အမြင့်ဆုံး state ဖြစ်လို့ reduce ဖြစ်ပါတယ်။']],
  ['Hydrogen, H₂','red',['Hydrogen is oxidised from 0 to +1.','Hydrogen က 0 ကနေ +1 အဖြစ် oxidise ဖြစ်ပါတယ်။']],
  ['Potassium dichromate, K₂Cr₂O₇','ox',['Cr is +6 and is reduced to Cr³⁺.','Cr က +6 ဖြစ်ပြီး Cr³⁺ အဖြစ် reduce ဖြစ်ပါတယ်။']],
  ['Magnesium, Mg','red',['Metals donate electrons and are oxidised.','သတ္တုတွေက electron ပေးပြီး oxidise ဖြစ်ပါတယ်။']],
  ['Hydrogen peroxide, H₂O₂','ox',['Listed in the textbook as an oxidising agent: O goes from −1 to −2.','Textbook မှာ oxidising agent အဖြစ် ဖော်ပြထားပါတယ်: O က −1 ကနေ −2 ဖြစ်ပါတယ်။']],
  ['Hydrogen sulphide, H₂S','red',['S is −2, its lowest state, so it can only be oxidised.','S က −2 ဖြစ်ပြီး အနိမ့်ဆုံး state ဖြစ်လို့ oxidise ပဲ ဖြစ်နိုင်ပါတယ်။']],
  ['Copper(II) oxide, CuO','ox',['Metal oxides give up oxygen and are reduced.','Metal oxide တွေက oxygen ပေးလိုက်ပြီး reduce ဖြစ်ပါတယ်။']],
  ['Sulphur dioxide, SO₂','red',['Listed in the textbook as a reducing agent: S goes from +4 to +6.','Textbook မှာ reducing agent အဖြစ် ဖော်ပြထားပါတယ်: S က +4 ကနေ +6 ဖြစ်ပါတယ်။']],
  ['Aluminium, Al','red',['Metals donate electrons and are oxidised.','သတ္တုတွေက electron ပေးပြီး oxidise ဖြစ်ပါတယ်။']]
];
function buildSort(){
  let done=0,right=0; const host=$('#sortList'), items=shuffle(sortItems);
  host.innerHTML=items.map((it,i)=>'<div class="sort-item" data-i="'+i+'"><span class="nm">'+esc(it[0])+'</span><span class="act"><button class="mini" data-v="ox">Oxidising agent</button><button class="mini" data-v="red">Reducing agent</button></span><div class="fb" style="flex-basis:100%;display:none"></div></div>').join('');
  const sc=$('#sortScore'); sc.innerHTML='';
  host.onclick=e=>{
    const b=e.target.closest('button.mini'); if(!b) return; const row=b.closest('.sort-item'); if(row.dataset.answered) return;
    const it=items[+row.dataset.i], ok=b.dataset.v===it[1]; row.dataset.answered='1'; done++; if(ok) right++;
    b.classList.add(ok?'sel-ok':'sel-no'); $$('button.mini',row).forEach(x=>x.disabled=true);
    const fb=$('.fb',row); fb.style.display='block'; fb.className='fb '+(ok?'ok':'no'); fb.style.padding='8px 12px'; fb.style.borderRadius='8px'; fb.style.fontSize='.94rem';
    const isOx=it[1]==='ox';
    fb.innerHTML='<b>'+(ok?OK:(isOx?T('It is an oxidising agent.','Oxidising agent ဖြစ်ပါတယ်။'):T('It is a reducing agent.','Reducing agent ဖြစ်ပါတယ်။')))+'</b> '+L(it[2]);
    sc.innerHTML=scoreTxt(right,done)+(done===items.length?' '+T('All done.','အားလုံး ပြီးပါပြီ။'):'');
  };
}
buildSort(); $('#sortReset').addEventListener('click',buildSort);

/* ---------- Identify agents ---------- */
const idItems=[
  ['2Sr (s) + O2 (g) → 2SrO (s)','Oxidising agent: <b class="r">O₂</b> (O: 0 → −2). Reducing agent: <b class="o">Sr</b> (0 → +2).'],
  ['3Mg (s) + N2 (g) → Mg3N2 (s)','Oxidising agent: <b class="r">N₂</b> (N: 0 → −3). Reducing agent: <b class="o">Mg</b> (0 → +2).'],
  ['Cl2 (g) + 2NaBr (aq) → 2NaCl (aq) + Br2 (aq)','Oxidising agent: <b class="r">Cl₂</b> (Cl: 0 → −1). Reducing agent: <b class="o">NaBr</b> (Br: −1 → 0).'],
  ['2Na (s) + 2H2O (l) → 2NaOH (aq) + H2 (g)','Oxidising agent: <b class="r">H₂O</b> (H: +1 → 0). Reducing agent: <b class="o">Na</b> (0 → +1).'],
  ['4Fe (s) + 3O2 (g) → 2Fe2O3 (s)','Oxidising agent: <b class="r">O₂</b> (O: 0 → −2). Reducing agent: <b class="o">Fe</b> (0 → +3).'],
  ['PbS (s) + 4H2O2 (l) → PbSO4 (s) + 4H2O (l)','Oxidising agent: <b class="r">H₂O₂</b> (O: −1 → −2). Reducing agent: <b class="o">PbS</b> (S: −2 → +6).'],
  ['3HCl (aq) + HNO3 (aq) → Cl2 (g) + NOCl (g) + 2H2O (l)','Oxidising agent: <b class="r">HNO₃</b> (N: +5 → +3). Reducing agent: <b class="o">HCl</b> (Cl: −1 → 0).']
];
$('#identify').innerHTML=idItems.map(it=>'<details class="reveal"><summary><span class="c">'+esc(it[0])+'</span></summary><div>'+it[1]+'</div></details>').join('');

/* ---------- Step player ---------- */
const ox=(f,n)=>'<span class="ox" data-n="'+n+'">'+esc(f)+'</span>';
const c=s=>'<span class="c">'+esc(s)+'</span>';
const eq=(...lines)=>lines.map(l=>'<div class="eq'+(l.includes('class="ox"')?' tall':'')+'">'+l+'</div>').join('');
const S_WRITE=['Write the unbalanced ionic equation.','ချိန်ညှိရသေးသော ionic ညီမျှခြင်းကို ရေးပါ။'], S_SPLIT=['Separate it into two half-reactions.','Half-reaction ၂ ခုအဖြစ် ခွဲပါ။'], S_OTHER=['Balance atoms other than O and H.','O နဲ့ H မဟုတ်တဲ့ atom တွေကို ချိန်ညှိပါ။'], S_O=['Balance oxygen by adding water.','ရေ ထည့်ပြီး oxygen ကို ချိန်ညှိပါ။'], S_H=['Balance hydrogen by adding H⁺ ions.','H⁺ ion ထည့်ပြီး hydrogen ကို ချိန်ညှိပါ။'], S_E=['Balance the charge with electrons.','Electron နဲ့ charge ကို ချိန်ညှိပါ။'], S_EQ=['Make the electrons equal.','Electron အရေအတွက် ညီအောင် လုပ်ပါ။'];
const EXAMPLES=[
 {title:['Oxidation number method: iron(III) oxide and carbon monoxide','Oxidation number နည်း: iron(III) oxide နှင့် carbon monoxide'],steps:[
  [['Write the unbalanced equation.','ချိန်ညှိရသေးသော ညီမျှခြင်းကို ရေးပါ။'],'',eq(c('Fe2O3 (s) + CO (g) → Fe (s) + CO2 (g)'))],
  [['Assign oxidation numbers to every atom.','Atom တိုင်းကို oxidation number သတ်မှတ်ပါ။'],['Fe changes from +3 to 0 and C changes from +2 to +4. Oxygen stays −2.','Fe က +3 ကနေ 0၊ C က +2 ကနေ +4 ပြောင်းပါတယ်။ Oxygen က −2 အတိုင်း ရှိပါတယ်။'],eq(ox('Fe2O3','+3 −2')+' + '+ox('CO','+2 −2')+' → '+ox('Fe','0')+' + '+ox('CO2','+4 −2'))],
  [['Find the change for each atom and balance the atoms that change.','Atom တစ်ခုချင်းရဲ့ ပြောင်းလဲမှုကို ရှာပြီး ပြောင်းလဲတဲ့ atom တွေကို ချိန်ညှိပါ။'],['Fe: +3 → 0 is −3 per atom. There are two Fe atoms, so put 2 in front of Fe: 2 × (−3) = <span class="r">−6 (reduced)</span>. C: +2 → +4 is <span class="o">+2 (oxidised)</span>.','Fe: +3 → 0 က atom တစ်လုံးကို −3 ဖြစ်ပါတယ်။ Fe atom ၂ လုံး ရှိလို့ Fe ရှေ့မှာ 2 ထည့်ပါ: 2 × (−3) = <span class="r">−6 (reduce)</span>။ C: +2 → +4 က <span class="o">+2 (oxidise)</span>။'],eq(ox('Fe2O3','+3')+' + '+ox('CO','+2')+' → '+ox('2Fe','0')+' + '+ox('CO2','+4'))],
  [['Make the total increase equal the total decrease.','တိုးတာ စုစုပေါင်းနဲ့ လျော့တာ စုစုပေါင်း ညီအောင် လုပ်ပါ။'],['The decrease is 6, so the increase must also be 6. Multiply CO and CO₂ by 3: 3 × (+2) = <span class="o">+6</span>.','လျော့တာက 6 ဖြစ်လို့ တိုးတာလည်း 6 ဖြစ်ရပါမယ်။ CO နဲ့ CO₂ ကို 3 နဲ့ မြှောက်ပါ: 3 × (+2) = <span class="o">+6</span>။'],eq(c('Fe2O3 + 3CO → 2Fe + 3CO2'))],
  [['Check the atoms and write the final equation.','Atom တွေကို စစ်ပြီး နောက်ဆုံး ညီမျှခြင်းကို ရေးပါ။'],['Fe: 2 = 2. C: 3 = 3. O: 3 + 3 = 6 on the left and 6 on the right.','Fe: 2 = 2။ C: 3 = 3။ O: ဘယ်ဘက် 3 + 3 = 6 နဲ့ ညာဘက် 6။'],eq(c('Fe2O3 (s) + 3CO (g) → 2Fe (s) + 3CO2 (g)'))]
 ]},
 {title:['Half-equations in acidic solution: dichromate and nitrous acid','Acidic solution တွင် half-equation နည်း: dichromate နှင့် nitrous acid'],steps:[
  [S_WRITE,'',eq(c('Cr2O7^2- (aq) + HNO2 (aq) → Cr^3+ (aq) + NO3^- (aq)'))],
  [S_SPLIT,'',eq(c('Cr2O7^2- → Cr^3+'),c('HNO2 → NO3^-'))],
  [S_OTHER,['Only chromium needs balancing.','Chromium တစ်ခုတည်းကိုသာ ချိန်ညှိဖို့ လိုပါတယ်။'],eq(c('Cr2O7^2- → 2Cr^3+'),c('HNO2 → NO3^-'))],
  [S_O,['The dichromate side has 7 O, so add 7H₂O on the right. The nitrous acid side needs one more O on the left.','Dichromate ဘက်မှာ O 7 လုံး ရှိလို့ ညာဘက်ကို 7H₂O ထည့်ပါ။ Nitrous acid ဘက်မှာ ဘယ်ဘက်ကို O တစ်လုံး ထပ်လိုပါတယ်။'],eq(c('Cr2O7^2- → 2Cr^3+ + 7H2O'),c('HNO2 + H2O → NO3^-'))],
  [S_H,'',eq(c('14H^+ + Cr2O7^2- → 2Cr^3+ + 7H2O'),c('HNO2 + H2O → 3H^+ + NO3^-'))],
  [S_E,['First: left is (+14) + (−2) = +12, right is 2 × (+3) = +6, so add 6e⁻ on the left. Second: left is 0, right is (+3) + (−1) = +2, so add 2e⁻ on the right.','ပထမ: ဘယ်ဘက် (+14) + (−2) = +12၊ ညာဘက် 2 × (+3) = +6 ဖြစ်လို့ ဘယ်ဘက်ကို 6e⁻ ထည့်ပါ။ ဒုတိယ: ဘယ်ဘက် 0၊ ညာဘက် (+3) + (−1) = +2 ဖြစ်လို့ ညာဘက်ကို 2e⁻ ထည့်ပါ။'],eq(c('6e^- + 14H^+ + Cr2O7^2- → 2Cr^3+ + 7H2O'),c('HNO2 + H2O → 3H^+ + NO3^- + 2e^-'))],
  [S_EQ,['The first has 6e⁻ and the second has 2e⁻, so multiply the second by 3.','ပထမမှာ 6e⁻ နဲ့ ဒုတိယမှာ 2e⁻ ရှိလို့ ဒုတိယကို 3 နဲ့ မြှောက်ပါ။'],eq(c('6e^- + 14H^+ + Cr2O7^2- → 2Cr^3+ + 7H2O'),c('3HNO2 + 3H2O → 9H^+ + 3NO3^- + 6e^-'))],
  [['Add the half-equations and cancel common terms.','Half-equation တွေကို ပေါင်းပြီး တူညီတဲ့ အရာတွေကို ချေဖျက်ပါ။'],['6e⁻ cancel. 14H⁺ − 9H⁺ leaves 5H⁺ on the left. 7H₂O − 3H₂O leaves 4H₂O on the right. Check the charge: left (+5) + (−2) = +3, right (−3) + (+6) = +3.','6e⁻ ချေဖျက်ပါ။ 14H⁺ − 9H⁺ ကြောင့် ဘယ်ဘက်မှာ 5H⁺ ကျန်ပါတယ်။ 7H₂O − 3H₂O ကြောင့် ညာဘက်မှာ 4H₂O ကျန်ပါတယ်။ Charge စစ်ပါ: ဘယ်ဘက် (+5) + (−2) = +3၊ ညာဘက် (−3) + (+6) = +3။'],eq(c('3HNO2 (aq) + 5H^+ (aq) + Cr2O7^2- (aq) → 3NO3^- (aq) + 2Cr^3+ (aq) + 4H2O (l)'))]
 ]},
 {title:['Half-equations in alkaline solution: silver and zinc ions','Alkaline solution တွင် half-equation နည်း: silver နှင့် zinc ion'],steps:[
  [S_WRITE,'',eq(c('Ag (s) + Zn^2+ (aq) → Ag2O (s) + Zn (s)'))],
  [S_SPLIT,'',eq(c('Ag → Ag2O'),c('Zn^2+ → Zn'))],
  [S_OTHER,'',eq(c('2Ag → Ag2O'),c('Zn^2+ → Zn'))],
  [S_O,'',eq(c('H2O + 2Ag → Ag2O'),c('Zn^2+ → Zn'))],
  [S_H,'',eq(c('H2O + 2Ag → Ag2O + 2H^+'),c('Zn^2+ → Zn'))],
  [S_E,'',eq(c('H2O + 2Ag → Ag2O + 2H^+ + 2e^-'),c('Zn^2+ + 2e^- → Zn'))],
  [S_EQ,['Both half-equations already have 2e⁻.','Half-equation နှစ်ခုလုံးမှာ 2e⁻ စီ ရှိပြီးသားပါ။'],eq(c('H2O + 2Ag → Ag2O + 2H^+ + 2e^-'),c('Zn^2+ + 2e^- → Zn'))],
  [['Add the half-equations and cancel the electrons.','Half-equation တွေကို ပေါင်းပြီး electron တွေကို ချေဖျက်ပါ။'],'',eq(c('H2O + 2Ag + Zn^2+ → Zn + Ag2O + 2H^+'))],
  [['Alkaline step: add OH⁻ to both sides.','Alkaline အဆင့်: OH⁻ ကို နှစ်ဖက်လုံး ထည့်ပါ။'],['There are 2H⁺ on the right, so add 2OH⁻ to both sides.','ညာဘက်မှာ 2H⁺ ရှိလို့ 2OH⁻ ကို နှစ်ဖက်လုံး ထည့်ပါ။'],eq(c('H2O + 2Ag + Zn^2+ + 2OH^- → Zn + Ag2O + 2H^+ + 2OH^-'))],
  [['Turn H⁺ + OH⁻ into water and cancel.','H⁺ + OH⁻ ကို ရေ အဖြစ် ပြောင်းပြီး ချေဖျက်ပါ။'],['2H⁺ + 2OH⁻ → 2H₂O. One H₂O cancels from each side. Check the charge: left (+2) + (−2) = 0, right 0.','2H⁺ + 2OH⁻ → 2H₂O။ ဘက်တစ်ဖက်စီကနေ H₂O တစ်ခု ချေဖျက်ပါ။ Charge စစ်ပါ: ဘယ်ဘက် (+2) + (−2) = 0၊ ညာဘက် 0။'],eq(c('H2O + 2Ag + Zn^2+ + 2OH^- → Zn + Ag2O + 2H2O'),c('2Ag (s) + Zn^2+ (aq) + 2OH^- (aq) → Zn (s) + Ag2O (s) + H2O (l)'))]
 ]}
];
let exI=0, stepI=0;
function drawPlayer(){
  const ex=EXAMPLES[exI], n=ex.steps.length;
  $('#playerTitle').innerHTML=L(ex.title);
  $('#playerSteps').innerHTML=ex.steps.slice(0,stepI+1).map((s,i)=>'<li class="'+(i===stepI?'cur':'done')+'"><h4><span>'+T('Step '+(i+1),'အဆင့် '+(i+1))+'</span>'+L(s[0])+'</h4>'+(s[1]?'<p>'+L(s[1])+'</p>':'')+s[2]+'</li>').join('');
  renderChem($('#playerSteps'));
  $('#playerProg').innerHTML=T('Step '+(stepI+1)+' of '+n,'အဆင့် '+n+' ဆင့်အနက် '+(stepI+1));
  $('#pPrev').disabled=stepI===0; $('#pNext').disabled=stepI===n-1; $('#pAll').disabled=stepI===n-1;
}
$('#pNext').addEventListener('click',()=>{ stepI=Math.min(stepI+1,EXAMPLES[exI].steps.length-1); drawPlayer(); const cur=$('#playerSteps li.cur'); if(cur && cur.scrollIntoView) cur.scrollIntoView({block:'nearest',behavior:reduceMotion?'auto':'smooth'}); });
$('#pPrev').addEventListener('click',()=>{ stepI=Math.max(stepI-1,0); drawPlayer(); });
$('#pAll').addEventListener('click',()=>{ stepI=EXAMPLES[exI].steps.length-1; drawPlayer(); });
$('#exChips').addEventListener('click',e=>{ const b=e.target.closest('button'); if(!b) return; exI=+b.dataset.ex; stepI=0; $$('#exChips button').forEach(x=>x.setAttribute('aria-pressed',x===b)); drawPlayer(); });
drawPlayer();

/* ---------- Question bank ---------- */
const TOPICS={on:['3.1 Oxidation numbers','3.1 Oxidation number များ'],concepts:['3.2 Oxidation and reduction','3.2 Oxidation နှင့် reduction'],redox:['3.3 Redox reactions','3.3 Redox ဓာတ်ပြုမှုများ'],agents:['3.4 Oxidising and reducing agents','3.4 Oxidising နှင့် reducing agent'],balancing:['3.5 Balancing equations','3.5 ညီမျှခြင်း ချိန်ညှိခြင်း']};
const ON=(f,el)=>['What is the oxidation number of '+el+' in '+f+'?',f+' ထဲက '+el+' ရဲ့ oxidation number က ဘာလဲ?'];
const Q=[
 {t:'on',q:ON('KClO₄','chlorine'),o:['+7','+5','+1','−1'],e:['K is +1 and 4 O give 4 × (−2) = −8. So +1 + Cl − 8 = 0, and Cl = +7.','K က +1၊ O ၄ လုံးက 4 × (−2) = −8။ ဒါကြောင့် +1 + Cl − 8 = 0 ဖြစ်ပြီး Cl = +7။']},
 {t:'on',q:ON('ClF₃','chlorine'),o:['+3','−3','−1','+1'],e:['Fluorine is always −1. 3 × (−1) = −3, so Cl = +3.','Fluorine က အမြဲ −1။ 3 × (−1) = −3 ဖြစ်လို့ Cl = +3။']},
 {t:'on',q:ON('Cr₂O₇²⁻','chromium'),o:['+6','+7','+12','+3'],e:['2Cr + 7(−2) = −2, so 2Cr = +12 and Cr = +6.','2Cr + 7(−2) = −2 ဖြစ်လို့ 2Cr = +12 နဲ့ Cr = +6။']},
 {t:'on',q:ON('Cr₂O₃','chromium'),o:['+3','+6','+2','+1.5'],e:['2Cr + 3(−2) = 0, so 2Cr = +6 and Cr = +3.','2Cr + 3(−2) = 0 ဖြစ်လို့ 2Cr = +6 နဲ့ Cr = +3။']},
 {t:'on',q:ON('SO₄²⁻','sulphur'),o:['+6','+4','−2','+8'],e:['S + 4(−2) = −2, so S = +6.','S + 4(−2) = −2 ဖြစ်လို့ S = +6။']},
 {t:'on',q:ON('NH₄⁺','nitrogen'),o:['−3','+3','−4','+5'],e:['N + 4(+1) = +1, so N = −3.','N + 4(+1) = +1 ဖြစ်လို့ N = −3။']},
 {t:'on',q:ON('CaH₂','hydrogen'),o:['−1','+1','0','+2'],e:['CaH₂ is a metal hydride. Ca is +2, so each H is −1.','CaH₂ က metal hydride ဖြစ်ပါတယ်။ Ca က +2 ဖြစ်လို့ H တစ်လုံးချင်းက −1။']},
 {t:'on',q:ON('H₂O₂','oxygen'),o:['−1','−2','0','+1'],e:['H₂O₂ is a peroxide. 2(+1) + 2O = 0, so O = −1.','H₂O₂ က peroxide ဖြစ်ပါတယ်။ 2(+1) + 2O = 0 ဖြစ်လို့ O = −1။']},
 {t:'on',q:ON('OF₂','oxygen'),o:['+2','−2','−1','+1'],e:['Fluorine is more electronegative and is −1. O + 2(−1) = 0, so O = +2.','Fluorine က electronegativity ပိုများပြီး −1 ဖြစ်ပါတယ်။ O + 2(−1) = 0 ဖြစ်လို့ O = +2။']},
 {t:'on',q:['The sum of the oxidation numbers of all atoms in MnO₄⁻ is:','MnO₄⁻ ထဲက atom အားလုံးရဲ့ oxidation number ပေါင်းလဒ်က:'],o:['−1','0','+7','−8'],e:['In a polyatomic ion the sum equals the charge on the ion, which is −1.','Polyatomic ion မှာ ပေါင်းလဒ်ဟာ ion ရဲ့ charge ဖြစ်တဲ့ −1 နဲ့ ညီပါတယ်။']},
 {t:'on',q:['What is the oxidation number of an element in its free state, such as Na or O₂?','Na (သို့) O₂ လို free state ရှိ element ရဲ့ oxidation number က ဘာလဲ?'],o:['0','+1','−2',['It depends on the number of atoms','Atom အရေအတွက်ပေါ် မူတည်သည်']],e:['All uncombined elements have oxidation number 0, whether monoatomic, diatomic or triatomic.','ပေါင်းစပ်မထားတဲ့ element အားလုံးဟာ monoatomic၊ diatomic၊ triatomic ဘယ်လိုပဲ ဖြစ်ဖြစ် oxidation number 0 ဖြစ်ပါတယ်။']},
 {t:'on',q:ON('C₂H₆','carbon'),o:['−3','+3','−6','+4'],e:['2C + 6(+1) = 0, so 2C = −6 and C = −3.','2C + 6(+1) = 0 ဖြစ်လို့ 2C = −6 နဲ့ C = −3။']},
 {t:'on',q:ON('KBrO₃','bromine'),o:['+5','−1','+3','+7'],e:['+1 + Br + 3(−2) = 0, so Br = +5.','+1 + Br + 3(−2) = 0 ဖြစ်လို့ Br = +5။']},
 {t:'on',q:ON('PbSO₄','lead'),o:['+2','+4','+6','0'],e:['The sulphate ion SO₄ has a charge of −2, so Pb = +2.','Sulphate ion SO₄ ရဲ့ charge က −2 ဖြစ်လို့ Pb = +2။']},
 {t:'on',q:['Alkaline earth metals (Group 2) in their compounds have an oxidation number of:','Compound ထဲက alkaline earth metal (Group 2) တွေရဲ့ oxidation number က:'],o:['+2','+1','−2','0'],e:['Group 1 metals are +1 and Group 2 metals are +2 in their compounds.','Group 1 သတ္တုတွေက +1 နဲ့ Group 2 သတ္တုတွေက +2 ဖြစ်ပါတယ်။']},
 {t:'concepts',q:['In terms of oxygen, oxidation is:','Oxygen အပေါ် အခြေခံရင် oxidation ဆိုတာ:'],o:[['Addition of oxygen','Oxygen ထပ်ပေါင်းခြင်း'],['Removal of oxygen','Oxygen ဖယ်ရှားခြင်း'],['Addition of hydrogen','Hydrogen ထပ်ပေါင်းခြင်း'],['Gain of electrons','Electron ရခြင်း']],e:['A substance that gains oxygen is oxidised.','Oxygen ရတဲ့ substance က oxidise ဖြစ်ပါတယ်။']},
 {t:'concepts',q:['In terms of hydrogen, oxidation is:','Hydrogen အပေါ် အခြေခံရင် oxidation ဆိုတာ:'],o:[['Removal of hydrogen','Hydrogen ဖယ်ရှားခြင်း'],['Addition of hydrogen','Hydrogen ထပ်ပေါင်းခြင်း'],['Addition of an electropositive element','Electropositive element ထပ်ပေါင်းခြင်း'],['Gain of electrons','Electron ရခြင်း']],e:['Losing hydrogen (an electropositive element) is oxidation.','Hydrogen (electropositive element) ဆုံးခြင်းဟာ oxidation ဖြစ်ပါတယ်။']},
 {t:'concepts',q:['In terms of electrons, reduction is:','Electron အပေါ် အခြေခံရင် reduction ဆိုတာ:'],o:[['Gain of electrons','Electron ရခြင်း'],['Loss of electrons','Electron ဆုံးခြင်း'],['Loss of protons','Proton ဆုံးခြင်း'],['Sharing of electrons','Electron မျှဝေခြင်း']],e:['OIL RIG: Reduction Is Gain of electrons.','OIL RIG: Reduction Is Gain (electron ရခြင်း)။']},
 {t:'concepts',q:['An element whose oxidation number decreases during a reaction is:','ဓာတ်ပြုမှုအတွင်း oxidation number လျော့သွားတဲ့ element က:'],o:[['Reduced','Reduce ဖြစ်သည်'],['Oxidised','Oxidise ဖြစ်သည်'],['Neutralised','Neutralise ဖြစ်သည်'],['Unchanged','မပြောင်းလဲပါ']],e:['A decrease in oxidation number means reduction.','Oxidation number လျော့ခြင်းဟာ reduction ဖြစ်ပါတယ်။']},
 {t:'concepts',q:['In Cl₂ + H₂S → S + 2HCl, what happens to H₂S?','Cl₂ + H₂S → S + 2HCl မှာ H₂S ဘာဖြစ်သလဲ?'],o:[['It is oxidised because it loses hydrogen','Hydrogen ဆုံးလို့ oxidise ဖြစ်သည်'],['It is reduced because it loses hydrogen','Hydrogen ဆုံးလို့ reduce ဖြစ်သည်'],['It is reduced because it gains chlorine','Chlorine ရလို့ reduce ဖြစ်သည်'],['It is neither oxidised nor reduced','Oxidise ရော reduce ပါ မဖြစ်ပါ']],e:['H₂S loses hydrogen to become S. Losing hydrogen is oxidation (S goes from −2 to 0).','H₂S က hydrogen ဆုံးပြီး S ဖြစ်သွားပါတယ်။ Hydrogen ဆုံးခြင်းဟာ oxidation ဖြစ်ပါတယ် (S က −2 ကနေ 0)။']},
 {t:'concepts',q:['The half-equation Zn → Zn²⁺ + 2e⁻ shows:','Zn → Zn²⁺ + 2e⁻ half-equation က ဘာကို ပြသလဲ?'],o:['Oxidation','Reduction','Neutralisation','Precipitation'],e:['Zinc loses two electrons, which is oxidation.','Zinc က electron ၂ လုံး ဆုံးလို့ oxidation ဖြစ်ပါတယ်။']},
 {t:'concepts',q:['In 2CuO + C → 2Cu + CO₂, copper(II) oxide is:','2CuO + C → 2Cu + CO₂ မှာ copper(II) oxide က:'],o:[['Reduced, because it loses oxygen','Oxygen ဆုံးလို့ reduce ဖြစ်သည်'],['Oxidised, because it loses oxygen','Oxygen ဆုံးလို့ oxidise ဖြစ်သည်'],['Reduced, because it gains carbon','Carbon ရလို့ reduce ဖြစ်သည်'],['Oxidised, because it gains electrons','Electron ရလို့ oxidise ဖြစ်သည်']],e:['CuO loses oxygen to form Cu, which is reduction. Cu goes from +2 to 0.','CuO က oxygen ဆုံးပြီး Cu ဖြစ်သွားလို့ reduction ဖြစ်ပါတယ်။ Cu က +2 ကနေ 0 ဖြစ်ပါတယ်။']},
 {t:'concepts',q:['The memory aid OIL RIG stands for:','OIL RIG မှတ်နည်းရဲ့ အဓိပ္ပာယ်က:'],o:['Oxidation Is Loss, Reduction Is Gain of electrons','Oxygen Is Lost, Reduction Is Gained','Oxidation Is Light, Reduction Is Gas','Oxidising Ion Loses, Reducing Ion Gains protons'],e:['Oxidation Is Loss of electrons, Reduction Is Gain of electrons.','Oxidation Is Loss (electron ဆုံးခြင်း)၊ Reduction Is Gain (electron ရခြင်း)။']},
 {t:'redox',q:['Which reaction involves both oxidation and reduction?','ဘယ်ဓာတ်ပြုမှုမှာ oxidation ရော reduction ပါ ပါဝင်သလဲ?'],o:['2H₂O₂ → 2H₂O + O₂','NH₃ + H₂O → NH₄⁺ + OH⁻','Ba²⁺ + SO₄²⁻ → BaSO₄','MgO + H₂CO₃ → MgCO₃ + H₂O'],e:['In H₂O₂, O is −1. It becomes −2 in H₂O (reduced) and 0 in O₂ (oxidised).','H₂O₂ ထဲမှာ O က −1 ဖြစ်ပါတယ်။ H₂O မှာ −2 (reduce) နဲ့ O₂ မှာ 0 (oxidise) ဖြစ်သွားပါတယ်။']},
 {t:'redox',q:['Which of these is NOT a redox reaction?','ဒီထဲက ဘယ်ဟာက redox ဓာတ်ပြုမှု မဟုတ်သလဲ?'],o:['BaCl₂ + H₂SO₄ → BaSO₄ + 2HCl','CuO + H₂ → Cu + H₂O','Fe₂O₃ + 3CO → 2Fe + 3CO₂','2Na + 2H₂O → 2NaOH + H₂'],e:['In BaCl₂ + H₂SO₄ no oxidation number changes; the ions only swap partners.','BaCl₂ + H₂SO₄ မှာ oxidation number တစ်ခုမှ မပြောင်းပါဘူး။ Ion တွေ နေရာချင်း လဲရုံပါပဲ။']},
 {t:'redox',q:['Why is 2Mg + O₂ → 2MgO a redox reaction?','2Mg + O₂ → 2MgO က ဘာကြောင့် redox ဓာတ်ပြုမှု ဖြစ်သလဲ?'],o:[['Mg goes from 0 to +2 and O goes from 0 to −2','Mg က 0 မှ +2 နှင့် O က 0 မှ −2 ဖြစ်သည်'],['Mg goes from +2 to 0 and O from −2 to 0','Mg က +2 မှ 0 နှင့် O က −2 မှ 0 ဖြစ်သည်'],['Only magnesium changes oxidation number','Magnesium တစ်ခုတည်းသာ oxidation number ပြောင်းသည်'],['No electrons are transferred','Electron လွှဲပြောင်းမှု မရှိပါ']],e:['Magnesium loses electrons (oxidised) and oxygen gains them (reduced) at the same time.','Magnesium က electron ဆုံး (oxidise) ပြီး oxygen က တစ်ချိန်တည်းမှာ ရ (reduce) ပါတယ်။']},
 {t:'redox',q:['In 2Br⁻ + Cl₂ → 2Cl⁻ + Br₂, what is oxidised?','2Br⁻ + Cl₂ → 2Cl⁻ + Br₂ မှာ ဘာက oxidise ဖြစ်သလဲ?'],o:['Br⁻','Cl₂','Cl⁻','Br₂'],e:['Br goes from −1 in Br⁻ to 0 in Br₂, an increase, so Br⁻ is oxidised.','Br က Br⁻ မှာ −1 ကနေ Br₂ မှာ 0 ဖြစ်သွားလို့ တိုးလာပါတယ်။ ဒါကြောင့် Br⁻ က oxidise ဖြစ်ပါတယ်။']},
 {t:'redox',q:['In 2Sb + 2HNO₃ → Sb₂O₃ + 2NO + H₂O, which element is reduced?','2Sb + 2HNO₃ → Sb₂O₃ + 2NO + H₂O မှာ ဘယ် element က reduce ဖြစ်သလဲ?'],o:[['Nitrogen, from +5 to +2','Nitrogen၊ +5 မှ +2'],['Antimony, from 0 to +3','Antimony၊ 0 မှ +3'],['Oxygen, from −2 to 0','Oxygen၊ −2 မှ 0'],['Hydrogen, from +1 to 0','Hydrogen၊ +1 မှ 0']],e:['N is +5 in HNO₃ and +2 in NO, a decrease, so nitrogen is reduced. Sb is oxidised from 0 to +3.','N က HNO₃ မှာ +5 နဲ့ NO မှာ +2 ဖြစ်လို့ လျော့သွားပါတယ်။ ဒါကြောင့် nitrogen က reduce ဖြစ်ပါတယ်။ Sb က 0 ကနေ +3 ဖြစ်လို့ oxidise ဖြစ်ပါတယ်။']},
 {t:'redox',q:['2KBrO₃ → 2KBr + 3O₂ is a redox reaction because:','2KBrO₃ → 2KBr + 3O₂ က redox ဓာတ်ပြုမှု ဖြစ်တာက ဘာကြောင့်လဲ?'],o:[['Br goes from +5 to −1 and O goes from −2 to 0','Br က +5 မှ −1 နှင့် O က −2 မှ 0 ဖြစ်သည်'],['K goes from +1 to 0','K က +1 မှ 0 ဖြစ်သည်'],['Br goes from −1 to +5','Br က −1 မှ +5 ဖြစ်သည်'],['Only oxygen changes oxidation number','Oxygen တစ်ခုတည်းသာ oxidation number ပြောင်းသည်']],e:['Bromine is reduced (+5 → −1) and oxygen is oxidised (−2 → 0).','Bromine က reduce (+5 → −1) ဖြစ်ပြီး oxygen က oxidise (−2 → 0) ဖြစ်ပါတယ်။']},
 {t:'redox',q:['The separate oxidation and reduction parts of a redox reaction are called:','Redox ဓာတ်ပြုမှုရဲ့ oxidation နဲ့ reduction အပိုင်း သီးခြားစီကို ဘာလို့ ခေါ်သလဲ?'],o:['Half-reactions','Side reactions','Reversible reactions','Neutralisations'],e:['Chemists write oxidation and reduction as two half-reactions.','ဓာတုဗေဒပညာရှင်တွေက oxidation နဲ့ reduction ကို half-reaction ၂ ခုအဖြစ် ရေးပါတယ်။']},
 {t:'agents',q:['An oxidising agent is:','Oxidising agent ဆိုတာ:'],o:[['An electron acceptor that is itself reduced','Electron လက်ခံပြီး ကိုယ်တိုင် reduce ဖြစ်သောအရာ'],['An electron donor that is itself oxidised','Electron ပေးပြီး ကိုယ်တိုင် oxidise ဖြစ်သောအရာ'],['An electron acceptor that is itself oxidised','Electron လက်ခံပြီး ကိုယ်တိုင် oxidise ဖြစ်သောအရာ'],['An electron donor that is itself reduced','Electron ပေးပြီး ကိုယ်တိုင် reduce ဖြစ်သောအရာ']],e:['The oxidising agent takes electrons from the other substance, so it is reduced.','Oxidising agent က တခြား substance ဆီက electron ယူလို့ သူကိုယ်တိုင် reduce ဖြစ်ပါတယ်။']},
 {t:'agents',q:['A reducing agent is:','Reducing agent ဆိုတာ:'],o:[['An electron donor that is itself oxidised','Electron ပေးပြီး ကိုယ်တိုင် oxidise ဖြစ်သောအရာ'],['An electron acceptor that is itself reduced','Electron လက်ခံပြီး ကိုယ်တိုင် reduce ဖြစ်သောအရာ'],['A substance that always contains hydrogen','Hydrogen အမြဲ ပါဝင်သော substance'],['A substance that gains oxygen and is reduced','Oxygen ရပြီး reduce ဖြစ်သော substance']],e:['The reducing agent gives away electrons, so it is oxidised.','Reducing agent က electron ပေးလိုက်လို့ သူကိုယ်တိုင် oxidise ဖြစ်ပါတယ်။']},
 {t:'agents',q:['In Mg + CuO → Cu + MgO, the reducing agent is:','Mg + CuO → Cu + MgO မှာ reducing agent က:'],o:['Mg','CuO','Cu','MgO'],e:['Mg loses electrons (0 → +2) and causes CuO to be reduced.','Mg က electron ဆုံး (0 → +2) ပြီး CuO ကို reduce ဖြစ်စေပါတယ်။']},
 {t:'agents',q:['In Cl₂ + 2NaBr → 2NaCl + Br₂, the oxidising agent is:','Cl₂ + 2NaBr → 2NaCl + Br₂ မှာ oxidising agent က:'],o:['Cl₂','NaBr','NaCl','Br₂'],e:['Cl₂ gains electrons (0 → −1) and oxidises Br⁻ to Br₂.','Cl₂ က electron ရ (0 → −1) ပြီး Br⁻ ကို Br₂ အဖြစ် oxidise လုပ်ပါတယ်။']},
 {t:'agents',q:['In 3Mg + N₂ → Mg₃N₂, the oxidising agent is:','3Mg + N₂ → Mg₃N₂ မှာ oxidising agent က:'],o:['N₂','Mg','Mg₃N₂',['There is none','မရှိပါ']],e:['N goes from 0 to −3 (reduced), so N₂ is the oxidising agent.','N က 0 ကနေ −3 (reduce) ဖြစ်လို့ N₂ က oxidising agent ဖြစ်ပါတယ်။']},
 {t:'agents',q:['In Ag₂O + H₂O₂ → 2Ag + H₂O + O₂, hydrogen peroxide acts as:','Ag₂O + H₂O₂ → 2Ag + H₂O + O₂ မှာ hydrogen peroxide က ဘာအဖြစ် ဆောင်ရွက်သလဲ?'],o:[['A reducing agent','Reducing agent'],['An oxidising agent','Oxidising agent'],['A catalyst only','Catalyst သာ'],['An acid','Acid']],e:['Some O in H₂O₂ goes from −1 to 0 in O₂ (oxidised), while Ag goes from +1 to 0. H₂O₂ reduces Ag₂O.','H₂O₂ ထဲက O တချို့ဟာ −1 ကနေ O₂ မှာ 0 (oxidise) ဖြစ်ပြီး Ag က +1 ကနေ 0 ဖြစ်ပါတယ်။ H₂O₂ က Ag₂O ကို reduce လုပ်ပါတယ်။']},
 {t:'agents',q:['Which of these is usually a reducing agent?','ဒီထဲက ဘယ်ဟာက များသောအားဖြင့် reducing agent ဖြစ်သလဲ?'],o:['Carbon monoxide','Potassium permanganate','Potassium dichromate','Concentrated nitric acid'],e:['CO is oxidised to CO₂. The other three are strong oxidising agents.','CO က CO₂ အဖြစ် oxidise ဖြစ်ပါတယ်။ ကျန် ၃ ခုက အားကောင်းတဲ့ oxidising agent တွေ ဖြစ်ပါတယ်။']},
 {t:'agents',q:['In PbS + 4H₂O₂ → PbSO₄ + 4H₂O, the oxidising agent is:','PbS + 4H₂O₂ → PbSO₄ + 4H₂O မှာ oxidising agent က:'],o:['H₂O₂','PbS','PbSO₄','H₂O'],e:['O in H₂O₂ goes from −1 to −2 (reduced), so H₂O₂ is the oxidising agent. S is oxidised from −2 to +6.','H₂O₂ ထဲက O က −1 ကနေ −2 (reduce) ဖြစ်လို့ H₂O₂ က oxidising agent ဖြစ်ပါတယ်။ S က −2 ကနေ +6 အဖြစ် oxidise ဖြစ်ပါတယ်။']},
 {t:'balancing',q:['Fe₂O₃ + ? CO → 2Fe + ? CO₂. What coefficient balances CO?','Fe₂O₃ + ? CO → 2Fe + ? CO₂။ CO ကို ချိန်ညှိဖို့ ဘယ် coefficient လိုသလဲ?'],o:['3','2','1','6'],e:['Two Fe atoms drop by 3 each (−6). Each C rises by 2, so 3 CO are needed (+6).','Fe atom ၂ လုံးက တစ်လုံးကို 3 စီ လျော့ (−6)။ C တစ်လုံးကို 2 စီ တိုးလို့ CO ၃ ခု လိုပါတယ် (+6)။']},
 {t:'balancing',q:['In the half-equation method, oxygen atoms are balanced by adding:','Half-equation နည်းမှာ oxygen atom တွေကို ဘာထည့်ပြီး ချိန်ညှိသလဲ?'],o:['H₂O','O₂','H⁺','OH⁻'],e:['Add water molecules to the side that needs oxygen.','Oxygen လိုတဲ့ဘက်ကို ရေ molecule တွေ ထည့်ပါ။']},
 {t:'balancing',q:['In acidic solution, hydrogen atoms are balanced by adding:','Acidic solution မှာ hydrogen atom တွေကို ဘာထည့်ပြီး ချိန်ညှိသလဲ?'],o:[['H⁺ ions','H⁺ ion များ'],['H₂ gas','H₂ ဓာတ်ငွေ့'],['OH⁻ ions','OH⁻ ion များ'],['Electrons','Electron များ']],e:['After balancing O with water, balance H with H⁺ ions.','O ကို ရေနဲ့ ချိန်ညှိပြီးနောက် H ကို H⁺ ion နဲ့ ချိန်ညှိပါ။']},
 {t:'balancing',q:['How many electrons are needed to balance Cr₂O₇²⁻ + 14H⁺ → 2Cr³⁺ + 7H₂O?','Cr₂O₇²⁻ + 14H⁺ → 2Cr³⁺ + 7H₂O ကို ချိန်ညှိဖို့ electron ဘယ်နှစ်လုံး လိုသလဲ?'],o:[['6, added on the left','6 လုံး၊ ဘယ်ဘက်တွင် ထည့်'],['3, added on the left','3 လုံး၊ ဘယ်ဘက်တွင် ထည့်'],['6, added on the right','6 လုံး၊ ညာဘက်တွင် ထည့်'],['12, added on the left','12 လုံး၊ ဘယ်ဘက်တွင် ထည့်']],e:['Left charge +12, right charge +6. Add 6e⁻ to the left. Each Cr goes from +6 to +3.','ဘယ်ဘက် charge +12၊ ညာဘက် charge +6။ ဘယ်ဘက်ကို 6e⁻ ထည့်ပါ။ Cr တစ်လုံးချင်း +6 ကနေ +3 ဖြစ်ပါတယ်။']},
 {t:'balancing',q:['What is the extra step when balancing in alkaline solution?','Alkaline solution မှာ ချိန်ညှိတဲ့အခါ ထပ်လုပ်ရတဲ့ အဆင့်က ဘာလဲ?'],o:[['Add OH⁻ to both sides to turn H⁺ into water','H⁺ ကို ရေဖြစ်စေရန် OH⁻ ကို နှစ်ဖက်လုံး ထည့်ခြင်း'],['Add H⁺ to both sides','H⁺ ကို နှစ်ဖက်လုံး ထည့်ခြင်း'],['Remove all the water','ရေ အားလုံး ဖယ်ရှားခြင်း'],['Double every coefficient','Coefficient အားလုံးကို နှစ်ဆ မြှောက်ခြင်း']],e:['Add as many OH⁻ as there are H⁺ to both sides, then combine H⁺ + OH⁻ into H₂O.','H⁺ အရေအတွက်နဲ့ တူတဲ့ OH⁻ ကို နှစ်ဖက်လုံး ထည့်ပြီး H⁺ + OH⁻ ကို H₂O အဖြစ် ပေါင်းပါ။']},
 {t:'balancing',q:['In the oxidation number method, coefficients are chosen so that:','Oxidation number နည်းမှာ coefficient တွေကို ဘယ်လို ရွေးသလဲ?'],o:[['The total increase equals the total decrease in oxidation number','Oxidation number တိုးတာ စုစုပေါင်းနဲ့ လျော့တာ စုစုပေါင်း ညီအောင်'],['The number of molecules is the same on both sides','နှစ်ဖက်လုံးမှာ molecule အရေအတွက် တူအောင်'],['The oxidation numbers are all zero','Oxidation number အားလုံး သုည ဖြစ်အောင်'],['The charges on both sides are doubled','နှစ်ဖက်လုံးရဲ့ charge နှစ်ဆ ဖြစ်အောင်']],e:['Electrons lost must equal electrons gained, so total increase = total decrease.','ဆုံးတဲ့ electron နဲ့ ရတဲ့ electron ညီရမှာ ဖြစ်လို့ တိုးတာ စုစုပေါင်း = လျော့တာ စုစုပေါင်း ဖြစ်ရပါမယ်။']},
 {t:'balancing',q:['For 3HNO₂ + 5H⁺ + Cr₂O₇²⁻ → 3NO₃⁻ + 2Cr³⁺ + 4H₂O, what is the total charge on each side?','3HNO₂ + 5H⁺ + Cr₂O₇²⁻ → 3NO₃⁻ + 2Cr³⁺ + 4H₂O မှာ ဘက်တစ်ဖက်စီရဲ့ charge စုစုပေါင်းက ဘာလဲ?'],o:['+3','0','+5','−3'],e:['Left: +5 − 2 = +3. Right: −3 + 6 = +3. Equal charges confirm the balance.','ဘယ်ဘက်: +5 − 2 = +3။ ညာဘက်: −3 + 6 = +3။ Charge ညီလို့ ချိန်ညှိမှု မှန်ကန်ပါတယ်။']},
 {t:'balancing',q:['How many electrons are gained when MnO₄⁻ is reduced to Mn²⁺?','MnO₄⁻ က Mn²⁺ အဖြစ် reduce ဖြစ်တဲ့အခါ electron ဘယ်နှစ်လုံး ရသလဲ?'],o:['5','7','2','3'],e:['Mn goes from +7 to +2, a change of 5, so 5 electrons are gained.','Mn က +7 ကနေ +2 ဖြစ်လို့ ပြောင်းလဲမှု 5 ဖြစ်ပြီး electron ၅ လုံး ရပါတယ်။']}
];
const makeQ=q=>{ const order=shuffle([0,1,2,3]); return {t:q.t,q:q.q,e:q.e,o:order.map(i=>q.o[i]),a:order.indexOf(0)}; };

/* ---------- Practice quiz ---------- */
const tc=$('#topicChips'); let practiceTopic='all';
tc.innerHTML='<button class="chip" data-t="all" aria-pressed="true">'+T('All sections','အခန်းခွဲ အားလုံး')+'</button>'+Object.keys(TOPICS).map(k=>'<button class="chip" data-t="'+k+'" aria-pressed="false">'+L(TOPICS[k])+'</button>').join('');
tc.addEventListener('click',e=>{ const b=e.target.closest('button'); if(!b) return; practiceTopic=b.dataset.t; $$('button',tc).forEach(x=>x.setAttribute('aria-pressed',x===b)); startPractice(); });
let P=null;
function startPractice(){
  const pool=Q.filter(q=>practiceTopic==='all'||q.t===practiceTopic);
  P={qs:shuffle(pool).slice(0,practiceTopic==='all'?10:8).map(makeQ),i:0,score:0,answered:false}; drawPractice();
}
const optsHTML=(q,sel)=>q.o.map((o,i)=>'<button class="opt'+(sel===i?' chosen':'')+'" data-i="'+i+'"><span class="k">'+'ABCD'[i]+'</span><span>'+L(o)+'</span></button>').join('');
function drawPractice(){
  const area=$('#practiceArea');
  if(P.i>=P.qs.length){
    const pct=Math.round(P.score/P.qs.length*100);
    const msg=pct>=80?T('Excellent work. Ready for the chapter test.','အရမ်းတော်ပါတယ်။ အခန်းဆုံး စာမေးပွဲ ဖြေဖို့ အသင့်ဖြစ်ပါပြီ။'):pct>=50?T('Good effort. Review the explanations, then try again.','ကြိုးစားမှု ကောင်းပါတယ်။ ရှင်းလင်းချက်တွေ ပြန်ဖတ်ပြီး ထပ်ကြိုးစားပါ။'):T('Keep practising. Read the section again and retry.','ဆက်လေ့ကျင့်ပါ။ အခန်းခွဲကို ပြန်ဖတ်ပြီး ထပ်ဖြေကြည့်ပါ။');
    area.innerHTML='<div class="q-card"><div class="big-score">'+P.score+'<small> / '+P.qs.length+'</small></div><p style="margin-top:10px">'+msg+'</p><div class="row"><button class="btn" id="pAgain">'+T('Try new questions','မေးခွန်းအသစ် ဖြေရန်')+'</button><a class="btn ghost" href="#chapter-test">'+T('Take the chapter test','အခန်းဆုံး စာမေးပွဲ ဖြေရန်')+'</a></div></div>';
    $('#pAgain').addEventListener('click',startPractice); return;
  }
  const q=P.qs[P.i];
  area.innerHTML='<div class="q-card"><div class="progress"><span style="width:'+(P.i/P.qs.length*100)+'%"></span></div><div class="q-meta"><span>'+T('Question ','မေးခွန်း ')+(P.i+1)+' / '+P.qs.length+'</span><span>'+L(TOPICS[q.t])+'</span><span>'+T('Score: ','ရမှတ်: ')+P.score+'</span></div><p class="q-text">'+L(q.q)+'</p><div class="opts">'+optsHTML(q,null)+'</div><div id="pExp"></div><div class="q-actions"><span></span><button class="btn" id="pNextQ" hidden>'+(P.i===P.qs.length-1?T('See my score','ရမှတ် ကြည့်ရန်'):T('Next question','နောက်မေးခွန်း'))+'</button></div></div>';
  $$('.opt',area).forEach(b=>b.addEventListener('click',()=>{
    if(P.answered) return; P.answered=true; const i=+b.dataset.i, ok=i===q.a; if(ok) P.score++;
    $$('.opt',area).forEach((x,j)=>{ x.disabled=true; if(j===q.a) x.classList.add('right'); else if(j===i) x.classList.add('wrong'); });
    const k='ABCD'[q.a];
    $('#pExp').innerHTML='<div class="explain"><b class="'+(ok?'tag-ok':'tag-no')+'">'+(ok?OK:T('Not quite. The answer is '+k+'.','မမှန်ပါ။ အဖြေမှန်က '+k+' ဖြစ်ပါတယ်။'))+'</b>'+L(q.e)+'</div>';
    const n=$('#pNextQ'); n.hidden=false; n.focus();
  }));
  $('#pNextQ').addEventListener('click',()=>{ P.i++; P.answered=false; drawPractice(); });
}
startPractice();

/* ---------- Chapter end test ---------- */
const TEST_MIX={on:6,concepts:5,redox:5,agents:5,balancing:4}, TEST_MIN=30;
const TEST_N=Object.values(TEST_MIX).reduce((a,b)=>a+b,0);
let T_=null, timerId=null;
function gradeFor(p){ return p>=80?['A',['Distinction','ဂုဏ်ထူး']]:p>=65?['B',['Credit','ကောင်း']]:p>=50?['C',['Pass','အောင်']]:p>=40?['D',['Near pass','အောင်ခါနီး']]:['E',['Needs more practice','ထပ်လေ့ကျင့်ရန် လိုသည်']]; }
function testIntro(){
  clearInterval(timerId);
  const best=store.get('redox-best');
  $('#testArea').innerHTML='<p class="lead">'+T(TEST_N+' multiple-choice questions from every section of the chapter. You have '+TEST_MIN+' minutes. Answers are shown only after you submit, like a real exam.','အခန်းခွဲ အားလုံးကနေ multiple-choice မေးခွန်း '+TEST_N+' ခု ပါပါတယ်။ အချိန် '+TEST_MIN+' မိနစ် ရပါတယ်။ တကယ့် စာမေးပွဲလိုပဲ တင်သွင်းပြီးမှ အဖြေတွေ ပြပါတယ်။')+'</p>'+
   '<div class="panel"><div class="scroll-x"><table><tr><th>'+T('Section','အခန်းခွဲ')+'</th><th>'+T('Questions','မေးခွန်း')+'</th></tr>'+Object.keys(TEST_MIX).map(k=>'<tr><td>'+L(TOPICS[k])+'</td><td>'+TEST_MIX[k]+'</td></tr>').join('')+'<tr><th>'+T('Total','စုစုပေါင်း')+'</th><th>'+TEST_N+'</th></tr></table></div>'+
   (best?'<p class="note" style="margin-top:12px">'+T('Your best score on this device: ','ဒီ device ပေါ်က သင့်ရဲ့ အမြင့်ဆုံး ရမှတ်: ')+'<b>'+esc(best)+'</b></p>':'')+
   '<div class="row" style="margin-top:14px"><button class="btn" id="tStart">'+T('Start the test','စာမေးပွဲ စတင်ရန်')+'</button></div></div>';
  $('#tStart').addEventListener('click',startTest);
}
function startTest(){
  let qs=[]; Object.keys(TEST_MIX).forEach(k=>{ qs=qs.concat(shuffle(Q.filter(q=>q.t===k)).slice(0,TEST_MIX[k])); });
  T_={qs:qs.map(makeQ),ans:new Array(qs.length).fill(null),i:0,end:Date.now()+TEST_MIN*60000};
  drawTest(); clearInterval(timerId); timerId=setInterval(tick,1000); tick();
}
function tick(){
  if(!T_) return; const left=Math.max(0,T_.end-Date.now()); const el=$('#tTimer');
  if(el){ const m=Math.floor(left/60000), s=Math.floor(left%60000/1000); el.textContent=m+':'+String(s).padStart(2,'0'); el.classList.toggle('low',left<180000); }
  if(left<=0){ clearInterval(timerId); finishTest(true); }
}
function drawTest(){
  const area=$('#testArea'), q=T_.qs[T_.i], answered=T_.ans.filter(a=>a!==null).length, last=T_.i===T_.qs.length-1;
  area.innerHTML='<div class="q-card"><div class="q-meta"><span>'+T('Question ','မေးခွန်း ')+(T_.i+1)+' / '+T_.qs.length+'</span><span>'+T('Answered: ','ဖြေပြီး: ')+answered+' / '+T_.qs.length+'</span><span>'+T('Time left: ','ကျန်ချိန်: ')+'<span class="timer" id="tTimer"></span></span></div><div class="progress"><span style="width:'+(answered/T_.qs.length*100)+'%"></span></div>'+
   '<p class="q-text">'+L(q.q)+'</p><div class="opts">'+optsHTML(q,T_.ans[T_.i])+'</div>'+
   '<div class="q-actions"><button class="btn ghost" id="tPrev"'+(T_.i===0?' disabled':'')+'>'+T('Previous','ယခင်')+'</button><div class="row">'+(!last?'<button class="btn" id="tNext">'+T('Next','နောက်တစ်ခု')+'</button>':'')+'<button class="btn'+(!last?' ghost':'')+'" id="tSubmit">'+T('Submit test','အဖြေ တင်သွင်းရန်')+'</button></div></div>'+
   '<div id="tConfirm"></div><div class="grid-nav" aria-label="Jump to question">'+T_.qs.map((_,i)=>'<button class="'+(T_.ans[i]!==null?'ans ':'')+(i===T_.i?'cur':'')+'" data-j="'+i+'" aria-label="Question '+(i+1)+'">'+(i+1)+'</button>').join('')+'</div></div>';
  tick();
  $$('.opt',area).forEach(b=>b.addEventListener('click',()=>{ T_.ans[T_.i]=+b.dataset.i; drawTest(); }));
  $('#tPrev').addEventListener('click',()=>{ T_.i--; drawTest(); });
  const n=$('#tNext'); if(n) n.addEventListener('click',()=>{ T_.i++; drawTest(); });
  $$('.grid-nav button',area).forEach(b=>b.addEventListener('click',()=>{ T_.i=+b.dataset.j; drawTest(); }));
  $('#tSubmit').addEventListener('click',()=>{
    const un=T_.ans.filter(a=>a===null).length;
    if(un===0) return finishTest(false);
    $('#tConfirm').innerHTML='<div class="confirm">'+T(un+' question'+(un>1?'s are':' is')+' not answered yet. Unanswered questions score zero.','မေးခွန်း '+un+' ခု မဖြေရသေးပါ။ မဖြေထားတဲ့ မေးခွန်းတွေ အမှတ် မရပါ။')+'<div class="row" style="margin-top:10px"><button class="btn" id="tYes">'+T('Submit anyway','ဒီအတိုင်း တင်သွင်းရန်')+'</button><button class="btn ghost" id="tNo">'+T('Keep working','ဆက်ဖြေရန်')+'</button></div></div>';
    $('#tYes').addEventListener('click',()=>finishTest(false)); $('#tNo').addEventListener('click',()=>{ $('#tConfirm').innerHTML=''; });
  });
}
function finishTest(timeUp){
  clearInterval(timerId); if(!T_) return;
  const res=T_.qs.map((q,i)=>({q,ch:T_.ans[i],ok:T_.ans[i]===q.a}));
  const score=res.filter(r=>r.ok).length, pct=Math.round(score/res.length*100), g=gradeFor(pct);
  const best=store.get('redox-best'); const bestN=best?parseInt(best,10):-1; if(score>bestN) store.set('redox-best',score+' / '+res.length);
  const by={}; res.forEach(r=>{ by[r.q.t]=by[r.q.t]||[0,0]; by[r.q.t][1]++; if(r.ok) by[r.q.t][0]++; });
  const weak=Object.keys(by).filter(k=>by[k][0]/by[k][1]<.6);
  const links={on:'oxidation-numbers',concepts:'concepts',redox:'redox',agents:'agents',balancing:'balancing'};
  let h='<div class="q-card">'+(timeUp?'<p class="msg" style="margin-bottom:14px">'+T('Time is up. Your answers were submitted automatically.','အချိန်ပြည့်သွားပါပြီ။ သင့်အဖြေတွေကို အလိုအလျောက် တင်သွင်းလိုက်ပါပြီ။')+'</p>':'')+
   '<div class="big-score">'+score+'<small> / '+res.length+'</small></div><p style="margin:10px 0 4px;font-size:1.15rem"><b>'+pct+'%, grade '+g[0]+'</b> ('+L(g[1])+')</p>'+
   '<h3>'+T('Score by section','အခန်းခွဲအလိုက် ရမှတ်')+'</h3><div class="bars">'+Object.keys(TEST_MIX).map(k=>{ const v=by[k]||[0,0], p=v[1]?v[0]/v[1]*100:0; return '<div class="bar-row"><span>'+L(TOPICS[k])+'</span><div class="bar"><span class="'+(p>=70?'':p>=50?'mid':'lo')+'" style="width:'+p+'%"></span></div><b>'+v[0]+'/'+v[1]+'</b></div>'; }).join('')+'</div>'+
   (weak.length?'<p>'+T('Review these sections: ','ဒီအခန်းခွဲတွေကို ပြန်လေ့လာပါ: ')+weak.map(k=>'<a href="#'+links[k]+'">'+L(TOPICS[k])+'</a>').join(', ')+'</p>':'<p>'+T('Strong across every section.','အခန်းခွဲ အားလုံးမှာ တော်ပါတယ်။')+'</p>')+
   '<div class="row"><button class="btn" id="tRetake">'+T('Take a new test','စာမေးပွဲ အသစ် ဖြေရန်')+'</button><button class="btn ghost" id="tJump">'+T('Review my answers','အဖြေများ ပြန်ကြည့်ရန်')+'</button></div></div>'+
   '<div class="q-card" id="tReview"><h3 style="margin-top:0">'+T('Answer review','အဖြေ ပြန်လည်စစ်ဆေးခြင်း')+'</h3>'+res.map((r,i)=>'<div class="review-item"><p style="margin:0 0 4px"><b>'+(i+1)+'. '+L(r.q.q)+'</b></p><p class="yr" style="margin:0 0 4px">'+T('Your answer: ','သင့်အဖြေ: ')+(r.ch===null?T('not answered','မဖြေထားပါ'):L(r.q.o[r.ch]))+' <span class="'+(r.ok?'tag-ok':'tag-no')+'">'+(r.ok?T('Correct','မှန်'):T('Wrong','မှား'))+'</span></p>'+(r.ok?'':'<p style="margin:0 0 4px">'+T('Correct answer: ','အဖြေမှန်: ')+'<b>'+L(r.q.o[r.q.a])+'</b></p>')+'<p class="note" style="margin:0">'+L(r.q.e)+'</p></div>').join('')+'</div>';
  $('#testArea').innerHTML=h; T_=null; window.scrollTo(0,$('#testArea').offsetTop-80);
  $('#tRetake').addEventListener('click',testIntro);
  $('#tJump').addEventListener('click',()=>$('#tReview').scrollIntoView({behavior:reduceMotion?'auto':'smooth'}));
}
testIntro();

renderChem(document);
setLang(store.get('redox-lang')==='my'?'my':'en');
route();
})();
