const $=id=>document.getElementById(id);
const STORE='ikeDay_attendance_v2';
const START='2026-05-08';
const te=new TextEncoder(),td=new TextDecoder();
const PASSWORD_CHECK='15WclAORKD85Z3ymfYxpJbqbJ1obv4WDSf1OP9hzzQk=';
let records={},key=null,view=new Date(),selected=null,salt=null;

function b64(bytes){return btoa(String.fromCharCode(...new Uint8Array(bytes)))}
function unb64(value){return Uint8Array.from(atob(value),c=>c.charCodeAt(0))}
async function passwordIsValid(password){
  const material=await crypto.subtle.importKey('raw',te.encode(password),'PBKDF2',false,['deriveBits']);
  const bits=await crypto.subtle.deriveBits({name:'PBKDF2',salt:te.encode('ikeDay-attendance-lock-v2'),iterations:310000,hash:'SHA-256'},material,256);
  return b64(bits)===PASSWORD_CHECK;
}
async function deriveEncryptionKey(password,rawSalt){
  const material=await crypto.subtle.importKey('raw',te.encode(password),'PBKDF2',false,['deriveKey']);
  return crypto.subtle.deriveKey({name:'PBKDF2',salt:rawSalt,iterations:310000,hash:'SHA-256'},material,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
}
async function encryptRecords(data,rawSalt,passwordKey){
  const iv=crypto.getRandomValues(new Uint8Array(12));
  const ciphertext=await crypto.subtle.encrypt({name:'AES-GCM',iv},passwordKey,te.encode(JSON.stringify(data)));
  return {version:2,algorithm:'AES-GCM',kdf:'PBKDF2-SHA-256',iterations:310000,salt:b64(rawSalt),iv:b64(iv),ciphertext:b64(ciphertext)};
}
async function decryptBackup(backup,password){
  if(backup.version!==2||backup.algorithm!=='AES-GCM'||!backup.salt||!backup.iv||!backup.ciphertext)throw Error('JSON 備份格式不正確。');
  const rawSalt=unb64(backup.salt);
  const derived=await deriveEncryptionKey(password,rawSalt);
  const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:unb64(backup.iv)},derived,unb64(backup.ciphertext));
  const data=JSON.parse(td.decode(plain));
  if(!data||typeof data!=='object'||!data.records||typeof data.records!=='object')throw Error('備份內容格式不正確。');
  for(const [date,status] of Object.entries(data.records)){
    if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!['yes','no'].includes(status))throw Error('備份內含無效日期或標記。');
  }
  return {data,rawSalt,derived};
}
async function persist(){
  const backup=await encryptRecords({records},salt,key);
  localStorage.setItem(STORE,JSON.stringify(backup));
}
function toast(message){const el=$('toast');el.textContent=message;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),1900)}
function localDate(date){return [date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-')}
function today(){return localDate(new Date())}
function showTracker(){ $('lockScreen').hidden=true;$('tracker').hidden=false;render() }
function lock(){key=null;salt=null;records={};selected=null;$('tracker').hidden=true;$('lockScreen').hidden=false;$('password').value='';$('lockError').textContent=''}
$('unlockForm').addEventListener('submit',async event=>{
  event.preventDefault();$('lockError').textContent='';
  const password=$('password').value;
  try{
    if(!await passwordIsValid(password))throw Error('密碼不正確。');
    const saved=localStorage.getItem(STORE);
    if(saved){
      const opened=await decryptBackup(JSON.parse(saved),password);
      records=opened.data.records;salt=opened.rawSalt;key=opened.derived;
    }else{
      records={};salt=crypto.getRandomValues(new Uint8Array(16));key=await deriveEncryptionKey(password,salt);await persist();
    }
    $('password').value='';showTracker();
  }catch(error){key=null;$('lockError').textContent=error.message==='The operation failed for an operation-specific reason.'?'無法解密資料，請確認備份與密碼。':error.message}
});
$('lockBtn').addEventListener('click',lock);
function render(){
  renderCalendar();
  $('markPanel').hidden=!selected;
  if(selected){$('selectedDate').textContent=selected.replaceAll('-','.');}
}
function renderCalendar(){
  const year=view.getFullYear(),month=view.getMonth(),first=new Date(year,month,1).getDay(),count=new Date(year,month+1,0).getDate();
  $('monthLabel').textContent=year+'.'+String(month+1).padStart(2,'0');
  const grid=$('calendar');grid.innerHTML='';
  for(let i=0;i<first;i++)grid.append(document.createElement('div'));
  for(let day=1;day<=count;day++){
    const date=year+'-'+String(month+1).padStart(2,'0')+'-'+String(day).padStart(2,'0');
    const status=records[date];
    const button=document.createElement('button');
    button.type='button';button.className='day'+(status?' '+status:'')+(selected===date?' selected':'')+(date===today()?' today':'');
    button.disabled=date<START||date>today();
    button.setAttribute('aria-label',date+(status==='yes'?' 有來':status==='no'?' 沒來':' 未標記'));
    button.innerHTML='<span class="num">'+day+'</span><span class="mark">'+(status==='yes'?'🐕':status==='no'?'🐾':'')+'</span>';
    button.addEventListener('click',()=>{selected=date;render()});
    grid.append(button);
  }
  $('prevMonth').disabled=year===2026&&month===4;
  $('nextMonth').disabled=year===new Date().getFullYear()&&month===new Date().getMonth();
}
async function setStatus(status){
  if(!selected)return;
  records[selected]=status;
  try{await persist();render();toast(status==='yes'?'已標記：有來 🦮':'已標記：沒來 🐾')}
  catch{toast('儲存失敗，請再試一次')}
}
$('markYes').addEventListener('click',()=>setStatus('yes'));
$('markNo').addEventListener('click',()=>setStatus('no'));
$('clearMark').addEventListener('click',async()=>{
  if(!selected||!records[selected])return;
  delete records[selected];
  try{await persist();render();toast('已清除標記')}catch{toast('儲存失敗')}
});
$('prevMonth').addEventListener('click',()=>{view=new Date(view.getFullYear(),view.getMonth()-1,1);renderCalendar()});
$('nextMonth').addEventListener('click',()=>{const next=new Date(view.getFullYear(),view.getMonth()+1,1);if(next<=new Date(new Date().getFullYear(),new Date().getMonth(),1)){view=next;renderCalendar()}});
$('exportBtn').addEventListener('click',()=>{
  const data=localStorage.getItem(STORE);if(!data){toast('目前沒有可匯出的資料');return}
  const url=URL.createObjectURL(new Blob([JSON.stringify(JSON.parse(data),null,2)],{type:'application/json'}));
  const link=document.createElement('a');link.href=url;link.download='ikeDay-backup.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('已匯出加密 JSON');
});
$('importFile').addEventListener('change',async event=>{
  const file=event.target.files[0];if(!file)return;
  try{
    const backup=JSON.parse(await file.text());
    const opened=await decryptBackup(backup,'2002ike');
    if(!confirm('匯入會取代目前這個瀏覽器的標記紀錄，確定繼續？'))return;
    records=opened.data.records;salt=opened.rawSalt;key=opened.derived;
    await persist();render();toast('JSON 備份已匯入');
  }catch(error){toast(error.message==='The operation failed for an operation-specific reason.'?'備份無法解密，請確認檔案。':error.message)}
  finally{event.target.value=''}
});
if(!window.crypto?.subtle){
  $('unlockForm').querySelector('button').disabled=true;
  $('lockError').textContent='此瀏覽器不支援加密功能，請使用最新版 Safari 或 Chrome。';
}
