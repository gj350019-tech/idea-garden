const STORE_KEY='idea-garden-v1';
const stages=[
  {id:'seed',label:'剛萌芽',icon:'🌱'},
  {id:'growing',label:'正在發展',icon:'🌿'},
  {id:'ready',label:'準備行動',icon:'🪴'},
  {id:'doing',label:'執行中',icon:'🚀'},
  {id:'done',label:'已實現',icon:'🌳'}
];
const categories=['尚未分類','格致青年','教學與課程','STEM／科技','校務與行政','網站與系統','視覺設計','閱讀與生活'];
const demoIdeas=[
  {title:'《格致青年》閱讀專欄改版',content:'從公視「名人書房」得到靈感：每月邀請老師推薦一本書，也讓任課老師分享學科中的新發現。',category:'格致青年',stage:'growing',action:'先寫出三個固定欄位名稱'},
  {title:'校內教師讀書會',content:'從閱讀推薦延伸成可以交流、分享，也能回到教學現場的讀書會。',category:'閱讀與生活',stage:'seed',action:'先記下希望邀請的三位老師'},
  {title:'Playtronica × Scratch STEM 體驗',content:'為國小設計 10–20 分鐘體驗：觸控、程式、聲音與畫面一起發生。器材包含 Touch Me 和 Playtron。',category:'STEM／科技',stage:'ready',action:'先畫出 15 分鐘活動流程'}
].map((x,i)=>({...x,id:crypto.randomUUID?.()||`${Date.now()}-${i}`,createdAt:new Date(Date.now()-i*86400000).toISOString(),updatedAt:new Date(Date.now()-i*86400000).toISOString(),wins:[]}));

let state=loadState();let currentFilter='all';let editingId=null;
function loadState(){try{const saved=JSON.parse(localStorage.getItem(STORE_KEY));if(saved?.ideas)return saved}catch(e){}return{ideas:demoIdeas,activity:[]}}
function save(){localStorage.setItem(STORE_KEY,JSON.stringify(state));renderAll()}
function esc(v=''){return String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function stageOf(id){return stages.find(s=>s.id===id)||stages[0]}
function dateLabel(iso){return new Intl.DateTimeFormat('zh-TW',{month:'short',day:'numeric'}).format(new Date(iso))}
function smartTitle(text){const first=text.split(/[。！!？?\n]/).find(Boolean)?.trim()||'新的想法';return first.length>28?first.slice(0,28)+'…':first}
function showToast(msg){const el=document.querySelector('#toast');el.textContent=msg;el.classList.add('show');clearTimeout(showToast.t);showToast.t=setTimeout(()=>el.classList.remove('show'),2200)}

function renderAll(){
  document.querySelector('#totalCount').textContent=state.ideas.length;
  renderRecent();renderToday();renderFilters();renderGarden();renderProgress();
}
function ideaRow(x){const s=stageOf(x.stage);return `<button class="idea-row" data-edit="${x.id}"><span class="stage-icon">${s.icon}</span><span><strong>${esc(x.title)}</strong><small>${esc(x.category)} · ${s.label}</small></span><time>${dateLabel(x.updatedAt)}</time></button>`}
function renderRecent(){document.querySelector('#recentList').innerHTML=state.ideas.slice().sort((a,b)=>new Date(b.updatedAt)-new Date(a.updatedAt)).slice(0,3).map(ideaRow).join('')||'<div class="empty-state">第一顆種子，正等著你種下。</div>'}
function renderToday(){
  const candidates=state.ideas.filter(x=>x.stage!=='done'&&x.action);const x=candidates[0];
  document.querySelector('#todayCard').innerHTML=x?`<article class="step-card"><button class="step-check" data-win="${x.id}" aria-label="完成這一步">✓</button><div class="step-copy"><small>${esc(x.title)}</small><strong>${esc(x.action)}</strong><p>先花 10 分鐘就好</p></div><button class="text-button" data-edit="${x.id}">編輯</button></article>`:'<div class="empty-state">替一顆種子設定「下一個小行動」，它就會出現在這裡。</div>';
}
function renderFilters(){const items=[{id:'all',label:'全部'},...stages];document.querySelector('#stageFilters').innerHTML=items.map(x=>`<button class="filter-chip ${currentFilter===x.id?'active':''}" data-filter="${x.id}">${x.icon||''} ${x.label}</button>`).join('')}
function renderGarden(){const list=state.ideas.filter(x=>currentFilter==='all'||x.stage===currentFilter);document.querySelector('#gardenGrid').innerHTML=list.map(x=>{const s=stageOf(x.stage);return `<button class="idea-card" data-edit="${x.id}"><div class="card-top"><span class="stage-icon">${s.icon}</span><span class="category-tag">${esc(x.category)}</span></div><h3>${esc(x.title)}</h3><p>${esc(x.content)}</p><footer>${x.action?'下一步：'+esc(x.action):'尚未設定下一步'}</footer></button>`}).join('')||'<div class="empty-state">這個階段還沒有靈感。</div>'}
function renderProgress(){
  const wins=state.activity.length,done=state.ideas.filter(x=>x.stage==='done').length,active=state.ideas.filter(x=>['ready','doing'].includes(x.stage)).length;
  document.querySelector('#statsGrid').innerHTML=`<div class="stat-card"><strong>${wins}</strong><span>個小勝利</span></div><div class="stat-card"><strong>${active}</strong><span>準備／執行中</span></div><div class="stat-card"><strong>${done}</strong><span>個想法已實現</span></div>`;
  document.querySelector('#timeline').innerHTML=state.activity.slice().reverse().map(a=>`<article class="timeline-item"><time>${dateLabel(a.date)}</time><strong>${esc(a.title)}</strong><p>${esc(a.text)}</p></article>`).join('')||'<div class="empty-state">完成第一個小行動後，成長軌跡會留在這裡。</div>';
}
function switchView(id){document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.id===`${id}View`));document.querySelectorAll('.bottom-nav button').forEach(b=>b.classList.toggle('active',b.dataset.view===id));scrollTo({top:0,behavior:'smooth'})}
function openIdea(id){const x=state.ideas.find(i=>i.id===id);if(!x)return;editingId=id;document.querySelector('#editTitle').value=x.title;document.querySelector('#editContent').value=x.content;document.querySelector('#editCategory').value=x.category;document.querySelector('#editStage').value=x.stage;document.querySelector('#editAction').value=x.action||'';document.querySelector('#dialogStageIcon').textContent=stageOf(x.stage).icon;document.querySelector('#ideaDialog').showModal()}

document.querySelector('#todayLabel').textContent=new Intl.DateTimeFormat('zh-TW',{month:'long',day:'numeric',weekday:'long'}).format(new Date());
document.querySelector('#editCategory').innerHTML=categories.map(x=>`<option>${x}</option>`).join('');
document.querySelector('#editStage').innerHTML=stages.map(x=>`<option value="${x.id}">${x.icon} ${x.label}</option>`).join('');
document.addEventListener('click',e=>{const view=e.target.closest('[data-view]');if(view)switchView(view.dataset.view);const edit=e.target.closest('[data-edit]');if(edit)openIdea(edit.dataset.edit);const filter=e.target.closest('[data-filter]');if(filter){currentFilter=filter.dataset.filter;renderFilters();renderGarden()}const win=e.target.closest('[data-win]');if(win){const x=state.ideas.find(i=>i.id===win.dataset.win);if(x){state.activity.push({date:new Date().toISOString(),title:x.title,text:`完成：${x.action}`});x.wins.push(new Date().toISOString());x.updatedAt=new Date().toISOString();save();showToast('記下了一個小勝利 ✦')}}});
document.querySelector('#ideaForm').addEventListener('submit',e=>{e.preventDefault();const text=document.querySelector('#ideaInput').value.trim();if(!text)return;state.ideas.unshift({id:crypto.randomUUID?.()||String(Date.now()),title:smartTitle(text),content:text,category:document.querySelector('#categoryInput').value,stage:'seed',action:'',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),wins:[]});e.target.reset();save();showToast('靈感已種下 🌱')});
document.querySelector('#editForm').addEventListener('submit',e=>{if(e.submitter?.value!=='save')return;const x=state.ideas.find(i=>i.id===editingId);if(!x)return;x.title=document.querySelector('#editTitle').value.trim();x.content=document.querySelector('#editContent').value.trim();x.category=document.querySelector('#editCategory').value;x.stage=document.querySelector('#editStage').value;x.action=document.querySelector('#editAction').value.trim();x.updatedAt=new Date().toISOString();save();showToast('已儲存變更')});
document.querySelector('#deleteBtn').addEventListener('click',()=>{if(!editingId||!confirm('確定要刪除這顆靈感種子嗎？'))return;state.ideas=state.ideas.filter(i=>i.id!==editingId);document.querySelector('#ideaDialog').close();save();showToast('已刪除')});
document.querySelector('#exportBtn').addEventListener('click',()=>{const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`靈感種子備份_${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(a.href);showToast('備份檔已下載')});

const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;
if(SpeechRecognition){const rec=new SpeechRecognition();rec.lang='zh-TW';rec.interimResults=true;let base='';rec.onstart=()=>{base=document.querySelector('#ideaInput').value;document.querySelector('#voiceBtn').classList.add('listening');document.querySelector('#voiceStatus').textContent='正在聽，說完後會自動停止……'};rec.onresult=e=>{let t='';for(let i=e.resultIndex;i<e.results.length;i++)t+=e.results[i][0].transcript;document.querySelector('#ideaInput').value=(base+' '+t).trim()};rec.onend=()=>{document.querySelector('#voiceBtn').classList.remove('listening');document.querySelector('#voiceStatus').textContent='語音已轉成文字'};document.querySelector('#voiceBtn').addEventListener('click',()=>rec.start())}else{document.querySelector('#voiceBtn').addEventListener('click',()=>showToast('此瀏覽器暫不支援語音輸入'))}
if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
renderAll();
