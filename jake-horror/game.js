(() => {
"use strict";
const $ = id => document.getElementById(id);
const SAVE_KEY = "afterimage_jake_phone_v1";
const PASSCODE = "1115";
const nowTime = () => new Date().toLocaleTimeString("zh-TW",{hour:"2-digit",minute:"2-digit",hour12:false});
const defaults = {
  unlocked:false,stage:0,trust:50,fear:12,clues:[],flags:{},visited:[],activeApp:"",selectedContact:"jake",
  logs:{
    jake:[{from:"them",text:"到家了嗎？",time:"23:48"},{from:"them",text:"我剛剛好像看到你。",time:"23:49"}],
    mina:[{from:"them",text:"欸你到家了沒？今天雨超大。",time:"23:35"}]
  },
  calls:[{name:"Jake",time:"23:51",type:"未接來電"},{name:"未知號碼",time:"23:42",type:"已取消"}],
  notes:[],ending:"",lastReply:""
};
let state = structuredClone(defaults);
let passcode = "";
let touchStartY = null;
let callTicker = null;
let toastTimer = null;

const objectives = [
  "先回覆 Jake。你們剛剛才聊過，他應該只是確認你有沒有到家。",
  "打開「照片」，看看他傳來的那張照片。注意拍攝時間。",
  "查看「備忘錄」。你不記得自己寫過那段文字。",
  "打開 Safari，搜尋照片裡的地址與裝置資訊。",
  "查看「尋找」。位置共享的地圖似乎不太對。",
  "打開「電話」，聽聽那通未接來電留下了什麼。",
  "打開「相機」，確認門外到底有沒有人。",
  "回到訊息。這次，決定你要怎麼處理 Jake。",
  "故事已結束。你可以回看線索，或重新開始另一條路線。"
];
const clueData = {
  photo:{title:"照片資訊：23:41",desc:"檔案名稱：IMG_2048.HEIC\n拍攝時間：今天 23:41\n位置：你家樓下，距離住址 18 公尺\n裝置：iPhone 18 Pro\n\n奇怪的是，這張照片不是 Jake 傳給你的原始照片。它存在你的相簿裡，拍攝者欄位卻是空白。",icon:"⌖"},
  note:{title:"未建立的備忘錄",desc:"標題：不要開門\n建立時間：今天 23:44\n\n如果他說他在樓下，不要相信。\n如果他說他沒有進來，也不要相信。\n\n最後一行被刪掉了。你看不見內容，但刪除時間是 23:47。",icon:"≡"},
  web:{title:"搜尋結果：社區監視器",desc:"論壇貼文：有人在凌晨反覆出現在同一棟公寓的電梯鏡面裡。\n\n管理員回覆：監視器畫面中，電梯內只有住戶一人。鏡面反射卻多出另一個人。\n\n貼文附圖已失效。最後更新時間：今天 23:46。",icon:"⌕"},
  location:{title:"位置共享異常",desc:"Jake 的位置顯示在你家樓下。\n\n但點開詳細資訊後，裝置名稱變成：\n「你的 iPhone」\n\n位置更新：現在。\n距離：0 公尺。",icon:"◎"},
  voicemail:{title:"語音信箱 · 00:03",desc:"（背景有電梯抵達的提示音。）\n\nJake：「你是不是把門鎖換了？」\n\n（停頓 4 秒。）\n\nJake：「沒關係，我有備份鑰匙。」\n\n（很輕的敲門聲。三下。）",icon:"◖"},
  camera:{title:"前鏡頭截圖",desc:"你按下快門時，畫面裡只有你自己。\n\n但照片存進相簿後，背景多出一隻手。\n\n那隻手搭在你的肩膀上。\n\n你沒有感覺到有人碰你。",icon:"▣"}
};
const stageClues = {1:"photo",2:"note",3:"web",4:"location",5:"voicemail",6:"camera"};
function clone(x){return JSON.parse(JSON.stringify(x))}
function loadSave(){
  try{
    const raw=localStorage.getItem(SAVE_KEY);
    if(!raw)return;
    const saved=JSON.parse(raw);
    state={...clone(defaults),...saved,flags:{...defaults.flags,...saved.flags},logs:{jake:[],mina:[],...saved.logs}};
    if(!Array.isArray(state.clues))state.clues=[];
    if(!Array.isArray(state.visited))state.visited=[];
    if(state.unlocked){$("lockScreen").classList.add("dismissed");$("homeScreen").classList.remove("hidden")}
  }catch(e){state=clone(defaults)}
}
function save(){
  try{localStorage.setItem(SAVE_KEY,JSON.stringify(state));}catch(e){toast("無法儲存，請檢查瀏覽器儲存空間")}
}
function toast(message){
  const el=$("toast");el.textContent=message;el.classList.add("visible");
  clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove("visible"),1900);
}
function updateClock(){
  const d=new Date(),t=nowTime();
  $("statusTime").textContent=t;$("lockClock").textContent=t;
  $("lockDate").textContent=d.toLocaleDateString("zh-TW",{month:"long",day:"numeric",weekday:"long"});
}
function showPasscode(){
  if(state.unlocked)return;
  passcode="";updateDots();$("passcodeError").textContent="";
  $("passcodeScreen").classList.add("visible");$("passcodeScreen").setAttribute("aria-hidden","false");
  if(navigator.vibrate)navigator.vibrate(18);
}
function hidePasscode(){
  $("passcodeScreen").classList.remove("visible");$("passcodeScreen").setAttribute("aria-hidden","true");
  passcode="";updateDots();
}
function updateDots(){document.querySelectorAll("#passcodeDots i").forEach((el,i)=>el.classList.toggle("filled",i<passcode.length))}
function digit(d){
  if(passcode.length>=4)return;
  passcode+=d;updateDots();
  if(passcode.length!==4)return;
  if(passcode===PASSCODE){
    $("passcodeError").textContent="";if(navigator.vibrate)navigator.vibrate([30,30,70]);
    setTimeout(()=>{state.unlocked=true;hidePasscode();$("lockScreen").classList.add("dismissed");$("homeScreen").classList.remove("hidden");save();toast("已解鎖")},170);
  }else{
    $("passcodeError").textContent="密碼錯誤，請重試";
    if(navigator.vibrate)navigator.vibrate([80,40,80]);
    setTimeout(()=>{passcode="";updateDots()},650);
  }
}
function goHome(){
  $("appScreen").classList.add("hidden");$("incomingCall").classList.add("hidden");$("callScreen").classList.add("hidden");
  $("homeScreen").classList.remove("hidden");state.activeApp="";save();
}
function openApp(app){
  if(!state.unlocked)return;
  state.activeApp=app;
  if(!state.visited.includes(app))state.visited.push(app);
  $("homeScreen").classList.add("hidden");$("appScreen").classList.remove("hidden");
  renderApp();save();
}
function addClue(id){
  if(state.clues.includes(id))return;
  state.clues.push(id);state.trust=Math.max(0,state.trust-1);state.fear=Math.min(100,state.fear+7);
  toast("已新增線索："+clueData[id].title);save();updateBadges();
}
function advanceStage(n){
  if(n<=state.stage)return;
  state.stage=n;save();updateBadges();
  const messages={
    1:"你回覆之後，Jake 傳來一張照片。照片好像也出現在你的相簿裡。",
    2:"你找到一份奇怪的備忘錄。建立時間就在剛才。",
    3:"搜尋結果裡，有人描述過非常相似的事。",
    4:"位置共享開始更新。地圖上的位置，正在往你這裡移動。",
    5:"電話裡有一通未接來電。語音信箱有新訊息。",
    6:"走廊的感應燈亮了。你應該先確認門外的情況。",
    7:"Jake 又傳訊息了。這次他不再假裝只是擔心你。"
  };
  if(messages[n])addSystemMessage(messages[n]);
  toast("新進度已解鎖");
}
function updateBadges(){
  $("messageBadge").textContent=state.stage>=7?"1":"2";
  $("phoneBadge").textContent=state.stage>=5?"2":"1";
}
function renderApp(){
  const titleMap={messages:"訊息",phone:"電話",photos:"照片",notes:"備忘錄",safari:"Safari",findmy:"尋找",files:"檔案",settings:"設定",camera:"相機"};
  $("appTitle").textContent=titleMap[state.activeApp]||"";
  $("backLabel").textContent=state.activeApp==="messages"&&state.selectedContact?"訊息":"主畫面";
  $("appAction").textContent=state.activeApp==="messages"?"編輯":state.activeApp==="photos"?"選取":"";
  const content=$("appContent");content.innerHTML="";
  $("appScreen").className="app-screen "+(state.activeApp==="messages"?"messages-screen":"");
  const renderers={messages:renderMessages,phone:renderPhone,photos:renderPhotos,notes:renderNotes,safari:renderSafari,findmy:renderFindMy,files:renderFiles,settings:renderSettings,camera:renderCamera};
  (renderers[state.activeApp]||renderFiles)(content);
}
function el(tag,cls,text){
  const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;
}
function button(label,cls,fn){
  const b=el("button",cls,label);b.addEventListener("click",fn);return b;
}
function addSystemMessage(text){
  state.logs.jake.push({from:"system",text,time:nowTime()});save();
}
function renderMessages(root){
  if(!state.selectedContact){
    root.append(el("h2","","訊息"));
    root.append(el("p","intro","最近的對話"));
    const list=el("div","app-list");
    const j=button("","list-row",()=>{state.selectedContact="jake";renderApp()});
    j.append(el("div","contact-avatar","J"));const jm=el("div","list-main");jm.append(el("strong","","Jake"),el("small","",lastMessage("jake")));j.append(jm,el("span","chevron","›"));
    const m=button("","list-row",()=>{state.selectedContact="mina";renderApp()});
    m.append(el("div","contact-avatar friend","M"));const mm=el("div","list-main");mm.append(el("strong","","Mina"),el("small","",lastMessage("mina")));m.append(mm,el("span","chevron","›"));
    list.append(j,m);root.append(list);return;
  }
  const contact=state.selectedContact;
  const head=el("div","chat-contact-head");
  head.append(button("‹","app-back",()=>{state.selectedContact="";renderApp()}));
  head.append(el("div","contact-avatar "+(contact==="mina"?"friend":""),contact==="mina"?"M":"J"));
  const title=el("div");title.append(el("div","contact-title",contact==="mina"?"Mina":"Jake"),el("div","contact-sub",contact==="mina"?"iMessage":"端對端加密"));
  head.append(title,el("span","contact-actions","⌕"));root.append(head);
  const conversation=el("div","conversation");conversation.id="conversation";
  conversation.append(el("div","chat-date","今天　"+(contact==="mina"?"23:35":"23:48")));
  (state.logs[contact]||[]).forEach(msg=>conversation.append(makeBubble(msg)));
  root.append(conversation);
  const quick=el("div","quick-replies");
  const options=contact==="mina"?["你現在方便講電話嗎？","我覺得有人在我家附近。"]:state.stage>=7?["你到底是誰？","我知道你在說謊。","不要再靠近我。"]:["你怎麼知道我在哪？","我到家了。","你現在在哪裡？"];
  options.forEach(t=>quick.append(button(t,"",()=>{sendMessage(t)})));
  root.append(quick);
  const row=el("div","chat-input-row"),input=el("textarea");input.id="chatInput";input.rows=1;input.placeholder="iMessage";
  const send=button("↑","chat-send",()=>sendMessage(input.value));
  input.addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMessage(input.value)}});
  row.append(input,send);root.append(row);
  conversation.scrollTop=conversation.scrollHeight;
}
function lastMessage(contact){const a=state.logs[contact]||[];return a.length?a[a.length-1].text:"沒有訊息"}
function makeBubble(msg){
  const b=el("div","chat-bubble "+(msg.from==="me"?"me":msg.from==="system"?"system":"them"),msg.text);
  b.append(el("span","bubble-time",msg.time||""));return b;
}
function sendMessage(raw){
  const text=String(raw||"").trim();if(!text)return;
  const contact=state.selectedContact||"jake";
  state.logs[contact].push({from:"me",text,time:nowTime()});
  if(contact==="jake"){
    if(state.stage===0)advanceStage(1);
    if(state.stage>=7){finalChoice(text);return}
  }
  save();renderApp();
  setTimeout(()=>{
    const reply=contact==="mina"?minaReply(text):jakeReply(text);
    state.logs[contact].push({from:"them",text:reply,time:nowTime()});
    save();if(state.activeApp==="messages"&&state.selectedContact===contact)renderApp();
    if(contact==="jake"&&state.stage===1&&state.logs.jake.filter(x=>x.from==="me").length>=2){
      state.logs.jake.push({from:"them",text:"我剛剛傳了一張照片給你。你看一下，是不是你家樓下？",time:nowTime()});advanceStage(1);save();if(state.activeApp==="messages")renderApp();
    }
    if(contact==="mina"&&/電話|打給|call/.test(text))incomingCall("Mina 正在撥打給你");
  },650);
}
function jakeReply(text){
  const t=text.toLowerCase();
  if(state.stage>=7)return "我沒有要嚇你。我只是想確定，這次你會不會相信我。";
  if(/誰|哪裡|位置|在哪|看到|跟蹤|監視/.test(t))return "你真的想知道嗎？有些事情，知道了反而比較難睡。";
  if(/不要|別|害怕|怕|恐怖/.test(t))return "那就不要看窗外。把門鎖好，聽我的。";
  if(/照片|相簿|拍/.test(t))return "照片裡的人不是我。至少，不是你認識的那個我。";
  if(/到家|回家|到了/.test(t))return "很好。那你現在應該是在房間裡，對吧？";
  if(/想你|喜歡|愛/.test(t))return "我也想你。比你以為的還要久。";
  const replies=["嗯，我在聽。你可以慢慢說。","你剛剛是不是把窗簾拉上了？","我沒有生氣。我只是有點失望。","你手機的亮度好像調低了。看不清楚嗎？","你不用一直確認我在不在。我一直都在。"];
  return replies[(state.logs.jake.filter(x=>x.from==="me").length-1)%replies.length];
}
function minaReply(text){
  if(/有人|樓下|門外|照片|跟蹤|害怕/.test(text))return "等一下。你先不要開門。我現在打給你。你有沒有把門鎖好？";
  if(/電話|打給|call/.test(text))return "好，我打給你。不要掛掉，先待在有鎖的房間。";
  return "你先把事情從頭跟我說一次。我覺得這件事不太對。";
}
function finalChoice(text){
  const t=text.toLowerCase();
  if(/封鎖|離開|不要|報警|警察|朋友|求救/.test(t)){
    state.trust=20;state.fear=85;state.ending=/報警|警察|朋友|求救/.test(t)?"truth":"escape";
  }else if(/相信|見面|開門|想你|愛/.test(t)){
    state.trust=85;state.fear=92;state.ending="stay";
  }else{
    state.trust=45;state.fear=72;state.ending="unknown";
  }
  state.logs.jake.push({from:"them",text:state.ending==="escape"?"……你終於做了一件對的事。":"你還是沒有回答我。沒關係，我們很快就會見面。",time:nowTime()});
  state.stage=8;save();renderApp();setTimeout(()=>{state.selectedContact="";openApp("files");renderApp()},450);
}
function renderPhone(root){
  root.append(el("h2","","最近通話"),el("p","intro","所有通話都會保留在這部手機裡。"));
  const list=el("div","app-list");
  state.calls.forEach((c,i)=>{
    const row=button("","list-row",()=>{if(i===0||c.name==="Jake")showVoicemail()});
    row.append(el("div","call-log-avatar",c.name==="Jake"?"J":"?"));
    const main=el("div","list-main");main.append(el("strong","",c.name),el("small","",c.type+" · "+c.time));row.append(main,el("span","chevron","ⓘ"));list.append(row);
  });
  root.append(list);
  root.append(el("div","section-label","語音信箱"));
  root.append(button("▶　Jake　・　00:03　・　今天 00:03","list-row",showVoicemail));
  if(state.stage>=5)root.append(button("播放語音信箱","primary-app-button",showVoicemail));
}
function showVoicemail(){
  const root=$("appContent");root.innerHTML="";
  root.append(el("h2","","語音信箱"),el("p","intro","Jake　・　今天 00:03"));
  const card=el("div","progress-card");card.append(el("h3","","未知的背景聲"),el("p","","（背景有電梯抵達的提示音。）\n\nJake：「你是不是把門鎖換了？」\n\n（停頓 4 秒。）\n\nJake：「沒關係，我有備份鑰匙。」\n\n（很輕的敲門聲。三下。）"));root.append(card);
  root.append(button("收進線索","primary-app-button",()=>{addClue("voicemail");advanceStage(6);renderApp()}));
  root.append(button("返回通話紀錄","secondary-app-button",renderApp));
}
function renderPhotos(root){
  root.append(el("h2","","照片"),el("p","intro","最近項目　・　4 張照片"));
  const grid=el("div","evidence-grid");
  const cards=[["🌧","雨夜的街口","今天 23:41","photo"],["🚪","公寓走廊","今天 23:43","door"],["🪞","電梯鏡面","今天 23:44","mirror"],["🌑","未知影像","今天 23:47","shadow"]];
  cards.forEach((c,i)=>{
    const b=button("","evidence-card",()=>showPhoto(c[3]));
    b.append(el("span","evidence-art",c[0]),el("strong","",c[1]),el("small","",c[2]));grid.append(b);
  });root.append(grid);
}
function showPhoto(id){
  const root=$("appContent");root.innerHTML="";
  const card=el("div","evidence-detail");
  const visual=el("div","evidence-visual",id==="door"?"🚪":id==="mirror"?"🪞":id==="shadow"?"◌":"🌧");
  if(id==="mirror"||id==="shadow")visual.style.background="radial-gradient(ellipse at 55% 38%,#9c7c8a,#20212c 45%,#090b12)";
  card.append(visual);
  const title=id==="photo"?"IMG_2048.HEIC":id==="door"?"公寓走廊":id==="mirror"?"電梯鏡面":"未知影像";
  const desc=id==="photo"?clueData.photo.desc:id==="door"?"照片裡的門牌號碼是你的房號。拍攝角度來自走廊盡頭。你住在這層樓的最裡面。":id==="mirror"?"鏡子裡多了一個人影。你放大照片後，發現那個人站在拍攝者身後。照片資訊顯示：拍攝裝置是你的 iPhone。":"這張照片沒有拍攝時間。檔案大小 0 KB，卻能正常預覽。";
  card.append(el("h3","",title),el("p","",desc));
  if(id==="photo")card.append(button("查看照片資訊","evidence-action",()=>{addClue("photo");advanceStage(2);showClueDetail("photo")}));
  else card.append(button("加入線索","evidence-action",()=>{addClue("photo");advanceStage(2);toast("已保存照片")}));
  root.append(button("‹　返回照片","secondary-app-button",renderApp),card);
}
function showClueDetail(id){
  const root=$("appContent");root.innerHTML="";
  root.append(button("‹　返回照片","secondary-app-button",renderApp));
  const card=el("div","evidence-detail");card.append(el("div","evidence-visual",clueData[id].icon),el("h3","",clueData[id].title),el("p","",clueData[id].desc));root.append(card);
}
function renderNotes(root){
  root.append(el("h2","","備忘錄"),el("p","intro","iCloud 已同步　・　最近編輯"));
  const a=el("div","app-note");a.append(el("h3","","今天要記得的事"),el("p","","1. 明天交報告\n2. 買牛奶\n3. 回覆 Mina\n\n（這些都是你寫的。至少看起來是。）"),el("div","note-meta","今天 18:22　・　我的 iPhone"));root.append(a);
  const b=button("","app-note",()=>showNote());b.style.width="100%";b.style.textAlign="left";b.append(el("h3","","不要開門"),el("p","","如果他說他在樓下，不要相信。\n如果他說他沒有進來，也不要相信。\n\n⋯⋯"),el("div","note-meta","今天 23:44　・　未知裝置"));root.append(b);
}
function showNote(){
  const root=$("appContent");root.innerHTML="";
  const card=el("div","app-note");card.append(el("h3","","不要開門"),el("p","",clueData.note.desc),el("div","note-meta","最後編輯：現在　・　同步中…"));root.append(card);
  root.append(button("檢查編輯紀錄","primary-app-button",()=>{addClue("note");advanceStage(3);toast("建立者：你自己？")}));
  root.append(button("返回備忘錄","secondary-app-button",renderApp));
}
function renderSafari(root){
  root.append(el("h2","","Safari"),el("div","browser-bar","◉　私人瀏覽模式"));
  const search=el("input","browser-search");search.id="webSearch";search.value="IMG_2048 拍攝位置 異常";search.placeholder="搜尋或輸入網站名稱";root.append(search);
  root.append(button("搜尋","primary-app-button",()=>runSearch(search.value)));
  const results=el("div");results.id="webResults";
  [["社區監視器：凌晨的訪客","local-forum.example","有人在電梯鏡面中看見不存在的人。"],["如何查看 iPhone 照片的 EXIF 資訊","support.example","照片可能保留拍攝裝置、時間與定位資訊。"],["附近裝置偵測到未知 AirTag","security.example","一個未知配件持續跟隨你移動。"]].forEach(r=>{const c=el("div","browser-result");c.append(el("small","",r[1]),el("h3","",r[0]),el("p","",r[2]));results.append(c)});
  root.append(results);
}
function runSearch(query){
  const results=$("webResults");if(!results)return;
  results.innerHTML="";
  const c=el("div","browser-result");c.append(el("small","","搜尋結果　・　23:46"),el("h3","","你不是第一個遇到這種事的人"),el("p","",clueData.web.desc));results.append(c);
  results.append(button("開啟討論串並保存","primary-app-button",()=>{addClue("web");advanceStage(4);toast("搜尋紀錄已保存")}));
}
function renderFindMy(root){
  root.append(el("h2","","尋找"),el("p","intro","你的位置　・　現在"));
  const map=el("div","map-panel");map.append(el("div","map-roads"),el("span","map-pin","●"));root.append(map);
  root.append(el("p","map-caption","Jake　・　位置共享中\n最後更新：現在　　距離：18 公尺"));
  root.append(button("更新位置","primary-app-button",()=>{map.querySelector(".map-pin").style.left="50%";map.querySelector(".map-pin").style.top="58%";root.querySelector(".map-caption").textContent="Jake　・　位置共享中\n最後更新：現在　　距離：0 公尺";addClue("location");advanceStage(5)}));
  root.append(button("停止分享我的位置","secondary-app-button",()=>toast("無法停止共享：此裝置目前不在你的帳號中")));
}
function renderFiles(root){
  root.append(el("h2","","案件紀錄"),el("p","intro","AFTERIMAGE　・　私人調查檔案"));
  const card=el("div","progress-card");card.append(el("h3","","目前目標"),el("p","",""+(objectives[state.stage]||objectives[8])));root.append(card);
  root.append(el("div","section-label","已收集線索　"+state.clues.length+" / 6"));
  state.clues.forEach(id=>{const d=clueData[id],row=el("div","clue-row");row.append(el("span","clue-dot",d.icon));const text=el("div");text.append(el("strong","",d.title),el("p","",d.desc.slice(0,72)+"…"));row.append(text);root.append(row)});
  if(!state.clues.length)root.append(el("p","intro","目前沒有線索。請從手機裡的 App 開始調查。"));
  if(state.stage===8)renderEnding(root);
  root.append(button("回到主畫面","secondary-app-button",goHome));
}
function renderEnding(root){
  const title=state.ending==="truth"?"ENDING 01 · 真相曝光":state.ending==="escape"?"ENDING 02 · 斷線":state.ending==="stay"?"ENDING 03 · 門的另一邊":"ENDING 04 · 未知來電";
  const body=state.ending==="truth"?"你把所有截圖傳給 Mina，並聯絡管理員與警方。凌晨 02:13，監視器畫面終於恢復。走廊裡沒有人。只有你家的門，一直從內側緩慢地開著。":state.ending==="escape"?"你拔掉網路、封鎖 Jake，和 Mina 保持通話直到天亮。隔天你搬離那間公寓。三週後，你收到一張沒有寄件人的照片。照片裡，是你新家的窗戶。":state.ending==="stay"?"你打開了門。走廊空無一人。手機卻響起視訊來電。畫面裡的 Jake 坐在你房間的床沿，對你笑了一下。你身後傳來他的聲音：「怎麼不接？」":"你沒有回答。螢幕暗下去，反射出你身後站著一個人。你轉身時，手機收到最後一則訊息：不要回頭。";
  const c=el("div","progress-card");c.append(el("h3","",title),el("p","",body));root.append(c);
  root.append(button("重新開始新存檔","primary-app-button",resetGame));
}
function renderSettings(root){
  root.append(el("h2","","設定"),el("p","intro","AFTERIMAGE　・　iPhone"));
  const list=el("div","app-list");
  [["飛航模式","關閉"],["通知","已開啟"],["聲音與觸覺回饋","開啟"],["iCloud 備份","同步中…"],["關於本裝置","iPhone 18 Pro"]].forEach(x=>{const row=el("div","list-row");const m=el("div","list-main");m.append(el("strong","",x[0]),el("small","",x[1]));row.append(m,el("span","chevron","›"));list.append(row)});
  root.append(list);
  root.append(el("div","section-label","遊戲資料"));
  root.append(button("儲存目前進度","primary-app-button",()=>{save();toast("已儲存目前進度")}));
  root.append(button("重新開始遊戲（清除存檔）","secondary-app-button",resetGame));
  root.append(el("p","intro","遊戲進度只儲存在目前瀏覽器。清除網站資料或更換裝置可能會失去存檔。"));
}
function renderCamera(root){
  root.append(el("h2","","相機"),el("p","intro","後置相機　・　照片模式"));
  const preview=el("div","evidence-visual");preview.style.height="min(55vh,420px)";preview.style.borderRadius="18px";preview.style.background="radial-gradient(ellipse at 53% 48%,#34343d,#090b11 65%)";preview.textContent="";preview.style.position="relative";
  const cross=el("span","","＋");cross.style.cssText="position:absolute;inset:0;display:grid;place-items:center;color:#ffffff50;font-size:30px;font-weight:200";preview.append(cross);root.append(preview);
  root.append(button("拍攝","primary-app-button",()=>{preview.style.background="radial-gradient(ellipse at 54% 45%,#806b79,#1b1b26 45%,#08090d)";preview.textContent="";const ghost=el("span","","✋");ghost.style.cssText="font-size:65px;opacity:.75;transform:rotate(-18deg)";preview.append(ghost);addClue("camera");advanceStage(7);toast("照片已儲存到相簿");}));
  root.append(button("返回主畫面","secondary-app-button",goHome));
}
function incomingCall(name){
  $("callerName").textContent=name||"Jake";$("callerSub").textContent="iPhone 行動電話";
  $("incomingCall").classList.remove("hidden");if(navigator.vibrate)navigator.vibrate([180,80,180,80,280]);
}
function declineCall(){
  $("incomingCall").classList.add("hidden");state.calls.unshift({name:$("callerName").textContent,time:nowTime(),type:"未接來電"});save();toast("已拒絕來電");
}
function answerCall(){
  $("incomingCall").classList.add("hidden");$("callScreen").classList.remove("hidden");
  $("callTranscript").textContent="已接通。\n\nJake：「你終於接了。」\n\n（遠處傳來門鎖轉動的聲音。）\n\nJake：「等一下。你家裡是不是還有別人？」";
  let seconds=0;clearInterval(callTicker);callTicker=setInterval(()=>{seconds++;$("callTimer").textContent="00:"+String(seconds).padStart(2,"0")},1000);
}
function endCall(){
  clearInterval(callTicker);$("callScreen").classList.add("hidden");
  state.calls.unshift({name:"Jake",time:nowTime(),type:"已接聽 · 00:18"});save();toast("通話已結束");
}
function resetGame(){
  if(!confirm("確定清除目前存檔並重新開始？"))return;
  localStorage.removeItem(SAVE_KEY);state=clone(defaults);state.selectedContact="";passcode="";
  $("appScreen").classList.add("hidden");$("homeScreen").classList.add("hidden");$("lockScreen").classList.remove("dismissed");$("passcodeScreen").classList.remove("visible");$("incomingCall").classList.add("hidden");$("callScreen").classList.add("hidden");
  toast("已建立新存檔");
}
function bind(){
  document.querySelectorAll("[data-open-passcode]").forEach(b=>b.addEventListener("click",showPasscode));
  $("cancelPasscode").addEventListener("click",hidePasscode);
  $("keypad").addEventListener("click",e=>{const b=e.target.closest("[data-digit]");if(b)digit(b.dataset.digit)});
  $("deleteDigit").addEventListener("click",()=>{passcode=passcode.slice(0,-1);updateDots()});
  $("lockScreen").addEventListener("touchstart",e=>{if(e.touches.length===1)touchStartY=e.touches[0].clientY},{passive:true});
  $("lockScreen").addEventListener("touchend",e=>{if(touchStartY!==null&&touchStartY-e.changedTouches[0].clientY>28)showPasscode();touchStartY=null},{passive:true});
  $("lockScreen").addEventListener("touchcancel",()=>touchStartY=null,{passive:true});
  document.querySelectorAll("[data-app]").forEach(b=>b.addEventListener("click",()=>{state.selectedContact="";openApp(b.dataset.app)}));
  $("appHome").addEventListener("click",goHome);
  $("appBack").addEventListener("click",()=>{if(state.activeApp==="messages"&&state.selectedContact){state.selectedContact="";renderApp()}else goHome()});
  $("answerCall").addEventListener("click",answerCall);$("declineCall").addEventListener("click",declineCall);$("endCall").addEventListener("click",endCall);
  $("lockFlash").addEventListener("click",()=>toast("手電筒無法開啟：電量不足"));
  $("lockCamera").addEventListener("click",()=>{showPasscode()});
  let startY=null;
  $("homeScreen").addEventListener("touchstart",e=>{startY=e.touches[0].clientY},{passive:true});
  $("homeScreen").addEventListener("touchend",e=>{if(startY!==null&&startY-e.changedTouches[0].clientY>90)toast("沒有新的通知");startY=null},{passive:true});
}
loadSave();bind();updateClock();setInterval(updateClock,15000);updateBadges();
})();
