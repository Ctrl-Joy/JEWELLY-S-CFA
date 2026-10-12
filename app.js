const JEWEL_SUBJECTS = [
  {name:"Alternative Investments",file:"CFA_Alternative_Investments_Study_Atelier(1).html",number:"01"},
  {name:"Corporate Issuers",file:"CFA_Corporate_Issuers_Study_Atelier(2)(1).html",number:"02"},
  {name:"Derivatives",file:"CFA_Derivatives_Study_Atelier(2)(1).html",number:"03"},
  {name:"Economics",file:"CFA_Economics_Study_Atelier(8)(1).html",number:"04"},
  {name:"Equity Investments",file:"CFA_Equity_Investments_Study_Atelier(2)(1).html",number:"05"},
  {name:"Ethics and Professional Standards",file:"CFA_Ethics_and_Professional_Standards_Study_Atelier(2)(1).html",number:"06"},
  {name:"Financial Statement Analysis",file:"CFA_Financial_Statement_Analysis_Study_Atelier(2)(1).html",number:"07"},
  {name:"Fixed Income",file:"CFA_Fixed_Income_Study_Atelier(2)(1).html",number:"08"},
  {name:"Portfolio Management",file:"CFA_Portfolio_Management_Study_Atelier(4)(1).html",number:"09"},
  {name:"Quantitative Methods",file:"CFA_Quantitative_Methods_Study_Atelier(1).html",number:"10"}
];
const STORAGE = {theme:"jewel-theme",completed:"jewel-completed",recent:"jewel-recent",goal:"jewel-goal"};
const readJSON = (key,fallback) => { try { const v=localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; } };
const writeJSON = (key,value) => { try { localStorage.setItem(key,JSON.stringify(value)); } catch {} };
function subjectHref(s){return "subjects/"+encodeURIComponent(s.file).replaceAll("%28","(").replaceAll("%29",")");}
function openSubject(s){
  const recent = readJSON(STORAGE.recent,[]);
  const next = [s.name,...recent.filter(n=>n!==s.name)].slice(0,5);
  writeJSON(STORAGE.recent,next);
  try { localStorage.setItem("jewel-last-subject",s.name); } catch {}
  window.location.href = subjectHref(s);
}
function applyTheme(){
  const theme=localStorage.getItem(STORAGE.theme)||"light";
  document.body.classList.toggle("dark",theme==="dark");
  const btn=document.getElementById("themeToggle");
  if(btn){btn.setAttribute("aria-label",theme==="dark"?"Switch to light mode":"Switch to dark mode");btn.title=theme==="dark"?"Switch to light mode":"Switch to dark mode";}
}
function initTheme(){
  applyTheme();
  const btn=document.getElementById("themeToggle");
  if(btn) btn.addEventListener("click",()=>{const dark=!document.body.classList.contains("dark");try{localStorage.setItem(STORAGE.theme,dark?"dark":"light");}catch{}applyTheme();});
}
function updateLanding(){
  const list=document.getElementById("landingSubjects");
  if(list){
    list.innerHTML=JEWEL_SUBJECTS.map(s=>`<a class="subject-chip" href="${subjectHref(s)}" data-subject="${s.name}"><span class="subject-number">${s.number}</span><span>${s.name}</span></a>`).join("");
    list.addEventListener("click",e=>{const a=e.target.closest("[data-subject]");if(a){const s=JEWEL_SUBJECTS.find(x=>x.name===a.dataset.subject);if(s){const recent=readJSON(STORAGE.recent,[]);writeJSON(STORAGE.recent,[s.name,...recent.filter(n=>n!==s.name)].slice(0,5));try{localStorage.setItem("jewel-last-subject",s.name);}catch{}}}});
  }
  const done=readJSON(STORAGE.completed,[]);
  const count=done.length;
  const label=document.getElementById("landingProgressLabel");
  const bar=document.getElementById("landingProgressBar");
  if(label) label.textContent=`${count} of 10 subjects`;
  if(bar) bar.style.width=`${count*10}%`;
}
function renderDashboard(){
  const grid=document.getElementById("subjectGrid");
  if(!grid) return;
  const completed=readJSON(STORAGE.completed,[]);
  const recent=readJSON(STORAGE.recent,[]);
  const last=localStorage.getItem("jewel-last-subject");
  const lastSubject=JEWEL_SUBJECTS.find(s=>s.name===last) || JEWEL_SUBJECTS.find(s=>recent.includes(s.name));
  const goalInput=document.getElementById("goalMinutes");
  if(goalInput) goalInput.value=readJSON(STORAGE.goal,60);
  const continueCard=document.getElementById("continueCard");
  if(continueCard && lastSubject){
    continueCard.innerHTML=`<div class="continue-symbol">✦</div><div class="continue-copy"><strong>${lastSubject.name}</strong><span>Last opened subject · ready when you are</span></div><button class="button button-primary" id="continueLast" type="button">Continue <span aria-hidden="true">→</span></button>`;
    document.getElementById("continueLast").addEventListener("click",()=>openSubject(lastSubject));
  }
  grid.innerHTML=JEWEL_SUBJECTS.map(s=>{
    const isDone=completed.includes(s.name);
    return `<article class="subject-card"><div class="subject-card-number">${s.number}</div><div class="subject-card-copy"><strong>${s.name}</strong><small>${isDone?"Marked complete":"Ready when you are"}</small></div><div class="subject-card-actions"><button class="complete-toggle" type="button" aria-pressed="${isDone}" data-complete="${s.name}">${isDone?"✓ Completed":"○ Mark complete"}</button><a class="subject-open" href="${subjectHref(s)}" data-open="${s.name}">Open ↗</a></div></article>`;
  }).join("");
  grid.addEventListener("click",e=>{
    const doneBtn=e.target.closest("[data-complete]");
    if(doneBtn){const name=doneBtn.dataset.complete;let items=readJSON(STORAGE.completed,[]);items=items.includes(name)?items.filter(n=>n!==name):[...items,name];writeJSON(STORAGE.completed,items);renderDashboard();updateProgress();return;}
    const open=e.target.closest("[data-open]");
    if(open){const s=JEWEL_SUBJECTS.find(x=>x.name===open.dataset.open);if(s){const r=readJSON(STORAGE.recent,[]);writeJSON(STORAGE.recent,[s.name,...r.filter(n=>n!==s.name)].slice(0,5));try{localStorage.setItem("jewel-last-subject",s.name);}catch{}}}
  },{once:true});
  updateProgress();
}
function updateProgress(){
  const completed=readJSON(STORAGE.completed,[]);
  const count=completed.length;
  const c=document.getElementById("completedCount"),b=document.getElementById("overallProgressBar"),t=document.getElementById("overallProgressText");
  if(c)c.textContent=count;if(b)b.style.width=`${count*10}%`;if(t)t.textContent=`${count*10}% complete`;
  const label=document.getElementById("landingProgressLabel"),bar=document.getElementById("landingProgressBar");
  if(label)label.textContent=`${count} of 10 subjects`;if(bar)bar.style.width=`${count*10}%`;
}
function initDashboard(){
  renderDashboard();
  const save=document.getElementById("saveGoal"),input=document.getElementById("goalMinutes");
  if(save && input)save.addEventListener("click",()=>{const n=Math.max(5,Math.min(600,Math.round((Number(input.value)||60)/5)*5));input.value=n;writeJSON(STORAGE.goal,n);save.textContent="Saved";setTimeout(()=>save.textContent="Save",1200);});
  const reset=document.getElementById("resetProgress");
  if(reset)reset.addEventListener("click",()=>{if(confirm("Reset all subject completion marks? This cannot be undone.")){writeJSON(STORAGE.completed,[]);renderDashboard();}});
}
document.addEventListener("DOMContentLoaded",()=>{initTheme();updateLanding();initDashboard();});
