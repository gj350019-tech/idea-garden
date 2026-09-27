const STORE_KEY='idea-garden-v1';
const stages=[
  {id:'seed',label:'剛萌芽',icon:'🌱'},
  {id:'growing',label:'正在發展',icon:'🌿'},
  {id:'ready',label:'準備行動',icon:'🪴'},
  {id:'doing',label:'執行中',icon:'🚀'},
  {id:'done',label:'已實現',icon:'🌳'}
];
const categories=['尚未分類','格致青年','教學與課程','STEM／科技','校務與行政','網站與系統','視覺設計','閱讀與生活'];
const suggestionBank={
  '尚未分類':['用一句話寫下這個想法想改變什麼','補充這個想法出現的時間與來源','替這個想法選一個最接近的分類','寫下如果不做，最可惜的地方','找出和這個想法有關的另一張靈感'],
  '格致青年':['替這個構想寫出三個欄位名稱','列出三位可能的採訪或邀稿對象','用50字寫出這篇內容的核心','畫出一張簡單的版面草圖','找出適合放進下期刊物的切入點'],
  '教學與課程':['寫下學生最後要學會的一件事','將活動切成10分鐘、20分鐘、50分鐘版本','列出需要準備的教材與器材','設計一個學生可以立即操作的任務','想出一個能看見學習成果的方法'],
  'STEM／科技':['先測試最關鍵的一項技術','畫出輸入、處理、輸出的流程','列出目前已經擁有的器材','設計一個10分鐘可完成的小實驗','記錄測試成功與失敗的條件'],
  '校務與行政':['寫下這個構想想改善的問題','找出第一位需要確認的人','列出執行前需要的三項資料','寫一份50字的簡短說明','決定最晚需要完成的時間'],
  '網站與系統':['寫出使用者最需要完成的一件事','畫出首頁最重要的操作流程','列出第一版一定要有的三項功能','找出目前最影響使用的問題','建立一筆實際資料進行測試'],
  '視覺設計':['蒐集三張符合方向的參考圖','決定主要色彩與一種輔助色','寫下畫面最需要被看見的文字','畫三張不同構圖的小草稿','刪除一個不必要的視覺元素'],
  '閱讀與生活':['寫下最觸動自己的一個觀點','記錄這個想法是由什麼引發的','找出一本可以延伸閱讀的書','寫下想與哪一個人分享','將想法轉成一個本週可做的行動']
};
const stageSuggestions={seed:['補上三個能代表這個想法的關鍵詞','用一句話寫出為什麼值得做'],growing:['找一個可以參考的案例','比較兩種可能的發展方向'],ready:['把第一步拆成10分鐘能完成的任務','確認開始前還缺少哪一項資源'],doing:['寫下目前最大的阻礙','完成一個今天可以看見的成果'],done:['寫下這次最值得保留的做法','從成果延伸出一顆新的靈感']};
const demoIdeas=[
  {title:'《格致青年》閱讀專欄改版',content:'從公視「名人書房」得到靈感：每月邀請老師推薦一本書，也讓任課老師分享學科中的新發現。',category:'格致青年',stage:'growing',action:'先寫出三個固定欄位名稱'},
  {title:'校內教師讀書會',content:'從閱讀推薦延伸成可以交流、分享，也能回到教學現場的讀書會。',category:'閱讀與生活',stage:'seed',action:'先記下希望邀請的三位老師'},
  {title:'Playtronica × Scratch STEM 體驗',content:'為國小設計 10–20 分鐘體驗：觸控、程式、聲音與畫面一起發生。器材包含 Touch Me 和 Playtron。',category:'STEM／科技',stage:'ready',action:'先畫出 15 分鐘活動流程'}
].map((x,i)=>({...x,id:crypto.randomUUID?.()||`${Date.now()}-${i}`,createdAt:new Date(Date.now()-i*86400000).toISOString(),updatedAt:new Date(Date.now()-i*86400000).toISOString(),wins:[]}));

let state=loadState();let currentFilter='all';let editingId=null;
function uid(){return crypto.randomUUID?.()||`${Date.now()}-${Math.random().toString(16).slice(2)}`}
function loadState(){let data;try{data=JSON.parse(localStorage.getItem(STORE_KEY))}catch(e){}if(!data?.ideas)data={ideas:demoIdeas,activity:[]};data.activity=(data.activity||[]).map((a,i)=>({...a,id:a.id||`old-${i}-${new Date(a.date).getTime()}`,ideaId:a.ideaId||data.ideas.find(x=>x.title===a.title)?.id||null,type:a.type||'win'}));data.ideas.forEach(x=>{if(!data.activity.some(a=>a.ideaId===x.id&&a.type==='created'))data.activity.push({id:uid(),ideaId:x.id,date:x.createdAt||new Date().toISOString(),title:x.title,text:`最初想法：${x.content}`,type:'created'})});localStorage.setItem(STORE_KEY,JSON.stringify(data));return data}
function save(){localStorage.setItem(STORE_KEY,JSON.stringify(state));renderAll()}
function esc(v=''){return String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function stageOf(id){return stages.find(s=>s.id===id)||stages[0]}
function dateLabel(iso){return new Intl.DateTimeFormat('zh-TW',{month:'short',day:'numeric'}).format(new Date(iso))}
function dateTimeLabel(iso){return new Intl.DateTimeFormat('zh-TW',{month:'long',day:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(iso))}
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
  const records=state.activity.length,done=state.ideas.filter(x=>x.stage==='done').length,active=state.ideas.filter(x=>['ready','doing'].includes(x.stage)).length;
  document.querySelector('#statsGrid').innerHTML=`<div class="stat-card"><strong>${records}</strong><span>筆成長紀錄</span></div><div class="stat-card"><strong>${active}</strong><span>準備／執行中</span></div><div class="stat-card"><strong>${done}</strong><span>個想法已實現</span></div>`;
  document.querySelector('#timeline').innerHTML=state.activity.slice().reverse().map(a=>`<article class="timeline-item"><button class="timeline-delete" data-delete-win="${a.id}" aria-label="刪除這筆小勝利" title="刪除這筆紀錄">×</button><time>${dateLabel(a.date)}</time><strong>${esc(a.title)}</strong><p>${esc(a.text)}</p></article>`).join('')||'<div class="empty-state">完成第一個小行動後，成長軌跡會留在這裡。</div>';
}
function switchView(id){document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.id===`${id}View`));document.querySelectorAll('.bottom-nav button').forEach(b=>b.classList.toggle('active',b.dataset.view===id));scrollTo({top:0,behavior:'smooth'})}
function openIdea(id){const x=state.ideas.find(i=>i.id===id);if(!x)return;editingId=id;document.querySelector('#editTitle').value=x.title;document.querySelector('#editContent').value=x.content;document.querySelector('#editCategory').value=x.category;document.querySelector('#editStage').value=x.stage;document.querySelector('#editAction').value=x.action||'';document.querySelector('#dialogStageIcon').textContent=stageOf(x.stage).icon;document.querySelector('#suggestions').hidden=true;showDetailTab('current');renderIdeaHistory();document.querySelector('#ideaDialog').showModal()}
function showDetailTab(tab){document.querySelectorAll('[data-detail-tab]').forEach(b=>b.classList.toggle('active',b.dataset.detailTab===tab));document.querySelector('#currentPanel').classList.toggle('active',tab==='current');document.querySelector('#historyPanel').classList.toggle('active',tab==='history')}
function historyFor(id){return state.activity.filter(a=>a.ideaId===id).sort((a,b)=>new Date(b.date)-new Date(a.date))}
function renderIdeaHistory(){const list=historyFor(editingId);document.querySelector('#historyCount').textContent=list.length;document.querySelector('#ideaHistory').innerHTML=list.map(a=>`<article class="history-entry"><button type="button" class="timeline-delete" data-delete-win="${a.id}" aria-label="刪除這筆紀錄">×</button><time>${dateTimeLabel(a.date)}</time><strong>${esc(a.title)}</strong><p>${esc(a.text)}</p></article>`).join('')||'<div class="empty-state">還沒有成長紀錄。</div>'}
function recordChanges(x,next){const changes=[];if(x.title!==next.title)changes.push(`名稱：${x.title} → ${next.title}`);if(x.content!==next.content)changes.push(`內容已更新：\n${next.content}`);if(x.category!==next.category)changes.push(`分類：${x.category} → ${next.category}`);if(x.stage!==next.stage)changes.push(`階段：${stageOf(x.stage).label} → ${stageOf(next.stage).label}`);if((x.action||'')!==next.action)changes.push(`下一個小行動：${next.action||'尚未設定'}`);if(changes.length)state.activity.push({id:uid(),ideaId:x.id,date:new Date().toISOString(),title:`${next.title}｜${stageOf(next.stage).icon} 更新想法`,text:changes.join('\n'),type:'updated'})}
function shuffle(list){return list.slice().sort(()=>Math.random()-.5)}
function makeSuggestions(){const category=document.querySelector('#editCategory').value;const stage=document.querySelector('#editStage').value;const pool=[...(suggestionBank[category]||suggestionBank['尚未分類']),...(stageSuggestions[stage]||[])];return shuffle([...new Set(pool)]).slice(0,3)}
function showSuggestions(){document.querySelector('#suggestionList').innerHTML=makeSuggestions().map(x=>`<button type="button" class="suggestion-option" data-suggestion="${esc(x)}">${esc(x)}</button>`).join('');document.querySelector('#suggestions').hidden=false}

document.querySelector('#todayLabel').textContent=new Intl.DateTimeFormat('zh-TW',{month:'long',day:'numeric',weekday:'long'}).format(new Date());
document.querySelector('#editCategory').innerHTML=categories.map(x=>`<option>${x}</option>`).join('');
document.querySelector('#editStage').innerHTML=stages.map(x=>`<option value="${x.id}">${x.icon} ${x.label}</option>`).join('');
document.addEventListener('click',e=>{const tab=e.target.closest('[data-detail-tab]');if(tab)showDetailTab(tab.dataset.detailTab);const view=e.target.closest('[data-view]');if(view)switchView(view.dataset.view);const edit=e.target.closest('[data-edit]');if(edit)openIdea(edit.dataset.edit);const filter=e.target.closest('[data-filter]');if(filter){currentFilter=filter.dataset.filter;renderFilters();renderGarden()}const suggestion=e.target.closest('[data-suggestion]');if(suggestion){document.querySelector('#editAction').value=suggestion.dataset.suggestion;document.querySelector('#suggestions').hidden=true;showToast('已放入下一個小行動')}const removeWin=e.target.closest('[data-delete-win]');if(removeWin&&confirm('確定要刪除這筆成長紀錄嗎？')){state.activity=state.activity.filter(a=>a.id!==removeWin.dataset.deleteWin);save();if(document.querySelector('#ideaDialog').open)renderIdeaHistory();showToast('成長紀錄已刪除')}const win=e.target.closest('[data-win]');if(win){const x=state.ideas.find(i=>i.id===win.dataset.win);if(x){state.activity.push({id:uid(),ideaId:x.id,date:new Date().toISOString(),title:`${x.title}｜✦ 完成小行動`,text:`完成：${x.action}`,type:'win'});x.wins.push(new Date().toISOString());x.updatedAt=new Date().toISOString();save();showToast('記下了一個小勝利 ✦')}}});
document.querySelector('#ideaForm').addEventListener('submit',e=>{e.preventDefault();const text=document.querySelector('#ideaInput').value.trim();if(!text)return;const now=new Date().toISOString();const idea={id:uid(),title:smartTitle(text),content:text,category:document.querySelector('#categoryInput').value,stage:'seed',action:'',createdAt:now,updatedAt:now,wins:[]};state.ideas.unshift(idea);state.activity.push({id:uid(),ideaId:idea.id,date:now,title:`${idea.title}｜🌱 種下靈感`,text:`最初想法：${idea.content}`,type:'created'});e.target.reset();save();showToast('靈感已種下，並記錄這次成長 🌱')});
document.querySelector('#editForm').addEventListener('submit',e=>{if(e.submitter?.value!=='save')return;const x=state.ideas.find(i=>i.id===editingId);if(!x)return;const next={title:document.querySelector('#editTitle').value.trim(),content:document.querySelector('#editContent').value.trim(),category:document.querySelector('#editCategory').value,stage:document.querySelector('#editStage').value,action:document.querySelector('#editAction').value.trim()};recordChanges(x,next);Object.assign(x,next,{updatedAt:new Date().toISOString()});save();showToast('已儲存，並記錄這次成長')});
document.querySelector('#deleteBtn').addEventListener('click',()=>{if(!editingId||!confirm('確定要刪除這顆靈感種子嗎？相關的小勝利紀錄也會一併刪除。'))return;const target=state.ideas.find(i=>i.id===editingId);state.ideas=state.ideas.filter(i=>i.id!==editingId);state.activity=state.activity.filter(a=>a.ideaId!==editingId&&a.title!==target?.title);document.querySelector('#ideaDialog').close();save();showToast('靈感與相關紀錄已刪除')});
document.querySelector('#suggestBtn').addEventListener('click',showSuggestions);
document.querySelector('#refreshSuggestions').addEventListener('click',showSuggestions);
document.querySelector('#addNoteBtn').addEventListener('click',()=>{const input=document.querySelector('#noteInput');const text=input.value.trim();const x=state.ideas.find(i=>i.id===editingId);if(!text||!x)return;state.activity.push({id:uid(),ideaId:x.id,date:new Date().toISOString(),title:`${x.title}｜補充紀錄`,text,type:'note'});input.value='';save();renderIdeaHistory();showToast('已補充一筆成長紀錄')});
document.querySelector('#exportBtn').addEventListener('click',()=>{const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`靈感種子備份_${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(a.href);showToast('備份檔已下載')});

const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;
if(SpeechRecognition){const rec=new SpeechRecognition();rec.lang='zh-TW';rec.interimResults=true;let base='';rec.onstart=()=>{base=document.querySelector('#ideaInput').value;document.querySelector('#voiceBtn').classList.add('listening');document.querySelector('#voiceStatus').textContent='正在聽，說完後會自動停止……'};rec.onresult=e=>{let t='';for(let i=e.resultIndex;i<e.results.length;i++)t+=e.results[i][0].transcript;document.querySelector('#ideaInput').value=(base+' '+t).trim()};rec.onend=()=>{document.querySelector('#voiceBtn').classList.remove('listening');document.querySelector('#voiceStatus').textContent='語音已轉成文字'};document.querySelector('#voiceBtn').addEventListener('click',()=>rec.start())}else{document.querySelector('#voiceBtn').addEventListener('click',()=>showToast('此瀏覽器暫不支援語音輸入'))}
if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
renderAll();
