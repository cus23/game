const $=id=>document.getElementById(id);
const STORE='ikeDay_attendance_v2';
const START='2026-05-08';
const te=new TextEncoder(),td=new TextDecoder();
const PASSWORD_CHECK='15WclAORKD85Z3ymfYxpJbqbJ1obv4WDSf1OP9hzzQk=';
const SEED_DATA={"salt":"nLqy2rUtg/0x0szn3bXceg==","iv":"myw9Tl9gcYKTpLXG","ciphertext":"D0fZW6WMDFkJe872Ey/ioK8xCWiW8a1oz2ZKXKkac7fZrft95aQeNoqwXkDVwbRnTBBu9hhmYcoZPsrV45Uoj9+VEx0C25HM+hWlVFuuMMl2R9aGATmAo04jzHmd3/ROiSuw63VFStYPb05qtMTW0DVktvQKU9DMF9o4BCz1hBQHF0kX9/XCgv8BiuaJp12MPHU1kqpt1heGcWTg449b8yhMpyRfaqFTn6/pPyOkBjEzHtZwXl70Juta/Auclenw9FFhwJa14NwsovsEAxPJvc0PrLalC5Q0tUUv7cTqycJAZD9gm6mWDpx6OEBUmuW0FaIQgkbIqQtNeWW75BOEJG4Oi5Hq9I5RO8KeUd/rUnAhy2TUz/UsU+2wC1fl+gaIu96P/ZQoSOOg0vfVbU7Z8h8Ydz5EeKw4yvGMXV8JPpdaVsOvl7c/YAFh/zzWxmK6SxRF/Oie2eyUzO6aSwLn/2YrQbBdGy6G+vt7jTKNXAb80oybvFfDhgAhj+qWAGqUnVW/0OKbRHOQ7Bpa7/65w5FhUVMsvKXPzhLKczC5h32L/YciV+kzGf1dyLlpP80RvZGCWFJMnSjoFlByZvRzuDqfQ7meST+TcUQ/PZoWzzxVf2znZjjLETMer7BDQAf2R/r225vv6GtmIvEOINtW20VFJ0mDKqw1zWFOOVoV1AkTmIWHNZODu2grvhRt1PCu/3hB52KheTJRFqIw4xSY1cmgY1c7meDdcCI6lkbD2MCAhsx9j6vEaMZt5VnArwsWfF3+6CEqMrJUYG+zNHlpHC0rjI1M02ot8FMNqNH5o5vzLo2MhRI5x+2jleUFgxR0TFyZ7jEeT+hqRYgc4J5JZplIcaOiQTSXgFiF6Afmv4/Yy6tgL2J1qtLZzKQBswst0tHv37ytIwSFOya+QJNF1u2ZzFG45RiEuXFZQJzJjt58mWjIUv3tKN4ybrjpD0jl18YNNRtfvhtm/tRwwEbulSOTcQMGp6vYJcoy5K2Dt9FKdgbs5z5j/qbYZLAU8h3jtqLrinnFD6gwTyBYHDq5jUkLiSyfN1f5Eju+oJ/c91QMJXDj/Ngmd8vEvsEvQ3kGiCRAY4MasKItYGU0BPjU5aDd/SL2Ke2RmPAS3x6zJCv+EBS01wL5r59qOchQqBwPIu38RUxv0To1z8bxR27drmihrAP04uMO+f2QkakG1X3ocoA0jkXAG8KRrLFAZzBvfXWWzE5p6yLaEE8HY9haNBwA17jeosor//evY9zjc4Y4oVlBNGLLO3iV0hUoLqF70HkIDnKaYhYpPowkHXjAmA=="}
let records={},key=null,view=new Date(),selected=null,salt=null,sessionPassword='',seedVersion=0;

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
async function applySeedIfNeeded(){
  let changed=false;
  for(const [date,status] of Object.entries(records)){if(status!=='yes'){delete records[date];changed=true}}
  if(seedVersion<2){
    const seedKey=await deriveEncryptionKey(sessionPassword,unb64(SEED_DATA.salt));
    const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:unb64(SEED_DATA.iv)},seedKey,unb64(SEED_DATA.ciphertext));
    const seed=JSON.parse(td.decode(plain));
    for(const date of seed.dates){if(records[date]!=='yes'){records[date]='yes';changed=true}}
    seedVersion=2;changed=true;
  }
  if(changed)await persist();
}
async function persist(){
  const backup=await encryptRecords({records,seedVersion},salt,key);
  localStorage.setItem(STORE,JSON.stringify(backup));
}
function toast(message){const el=$('toast');el.textContent=message;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),1900)}
function localDate(date){return [date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-')}
function today(){return localDate(new Date())}
function showTracker(){ $('lockScreen').hidden=true;$('tracker').hidden=false;render() }
function lock(){key=null;salt=null;records={};selected=null;sessionPassword='';seedVersion=0;$('tracker').hidden=true;$('lockScreen').hidden=false;$('password').value='';$('lockError').textContent=''}
$('unlockForm').addEventListener('submit',async event=>{
  event.preventDefault();$('lockError').textContent='';
  const password=$('password').value;
  try{
    if(!await passwordIsValid(password))throw Error('密碼不正確。');
    const saved=localStorage.getItem(STORE);
    if(saved){
      const opened=await decryptBackup(JSON.parse(saved),password);
      records=opened.data.records;salt=opened.rawSalt;key=opened.derived;seedVersion=Number(opened.data.seedVersion)||(opened.data.seedApplied?1:0);
    }else{
      records={};salt=crypto.getRandomValues(new Uint8Array(16));key=await deriveEncryptionKey(password,salt);seedVersion=0;
    }
    sessionPassword=password;await applySeedIfNeeded();$('password').value='';showTracker();
  }catch(error){key=null;$('lockError').textContent=error.message==='The operation failed for an operation-specific reason.'?'無法解密資料，請確認備份與密碼。':error.message}
});
$('lockBtn').addEventListener('click',lock);
function render(){
  renderCalendar();
  $('markPanel').hidden=!selected;
  if(selected){$('selectedDate').textContent=selected.replaceAll('-','.');$('markYes').textContent=records[selected]==='yes'?'🐾 已標記有來':'🐾 有來';}
  renderYearChart();
}
function renderCalendar(){
  const year=view.getFullYear(),month=view.getMonth(),first=new Date(year,month,1).getDay(),count=new Date(year,month+1,0).getDate();
  $('monthLabel').textContent=year+'.'+String(month+1).padStart(2,'0');
  const grid=$('calendar');grid.innerHTML='';
  for(let i=0;i<first;i++)grid.append(document.createElement('div'));
  for(let day=1;day<=count;day++){
    const date=year+'-'+String(month+1).padStart(2,'0')+'-'+String(day).padStart(2,'0');
    const marked=records[date]==='yes';
    const button=document.createElement('button');
    button.type='button';button.className='day'+(marked?' yes':'')+(selected===date?' selected':'')+(date===today()?' today':'');
    button.disabled=date<START||date>today();
    button.setAttribute('aria-label',date+(marked?' 有來':' 未標記'));
    button.innerHTML='<span class="num">'+day+'</span><span class="mark">'+(marked?'🐾':'')+'</span>';
    button.addEventListener('click',()=>{selected=date;render()});
    grid.append(button);
  }
  $('prevMonth').disabled=year===2026&&month===4;
  $('nextMonth').disabled=year===new Date().getFullYear()&&month===new Date().getMonth();
}
async function setStatus(status){
  if(!selected)return;
  if(status==='yes')records[selected]='yes';
  try{await persist();render();toast('已標記：有來 🐾')}
  catch{toast('儲存失敗，請再試一次')}
}
$('markYes').addEventListener('click',()=>setStatus('yes'));
$('clearMark').addEventListener('click',async()=>{
  if(!selected||!records[selected])return;
  delete records[selected];
  try{await persist();render();toast('已取消標記')}catch{toast('儲存失敗')}
});
$('prevMonth').addEventListener('click',()=>{view=new Date(view.getFullYear(),view.getMonth()-1,1);renderCalendar()});
$('nextMonth').addEventListener('click',()=>{const next=new Date(view.getFullYear(),view.getMonth()+1,1);if(next<=new Date(new Date().getFullYear(),new Date().getMonth(),1)){view=next;renderCalendar()}});
function renderYearChart(){
  const counts=Array(12).fill(0);
  for(const [date,status] of Object.entries(records)){if(status==='yes'&&date.startsWith('2026-'))counts[Number(date.slice(5,7))-1]++}
  const total=counts.reduce((a,b)=>a+b,0);$('yearTotal').textContent=total;
  const max=Math.max(5,Math.ceil(Math.max(...counts)/5)*5),base=142,chartHeight=112,barW=26,gap=25,startX=31;
  let svg='<svg viewBox="0 0 650 190" role="img" aria-label="2026 每月有來天數：'+counts.join('、')+'">';
  for(let v=0;v<=max;v+=5){const y=base-(v/max)*chartHeight;svg+='<line x1="27" y1="'+y+'" x2="635" y2="'+y+'" stroke="#f0e8e2" stroke-dasharray="3 5"/><text x="18" y="'+(y+3)+'" text-anchor="end" fill="#b4a9a2" font-size="9">'+v+'</text>'}
  counts.forEach((value,i)=>{const x=startX+i*(barW+gap),h=value/max*chartHeight,y=base-h;svg+='<rect x="'+x+'" y="'+(value?y:base-2)+'" width="'+barW+'" height="'+Math.max(value?4:2,h)+'" rx="8" fill="'+(value?'#dfa39a':'#eee8e3')+'"/>';if(value)svg+='<text x="'+(x+barW/2)+'" y="'+(y-8)+'" text-anchor="middle" fill="#a8756e" font-size="10" font-weight="600">'+value+'</text>';svg+='<text x="'+(x+barW/2)+'" y="164" text-anchor="middle" fill="#9e938d" font-size="10">'+(i+1)+'月</text>'});
  svg+='<text x="635" y="184" text-anchor="end" fill="#c1b5ae" font-size="8">2026 · MONTHLY DAYS</text></svg>';
  $('yearChart').innerHTML=svg;
}
$('exportBtn').addEventListener('click',()=>{
  const data=localStorage.getItem(STORE);if(!data){toast('目前沒有可匯出的資料');return}
  const url=URL.createObjectURL(new Blob([JSON.stringify(JSON.parse(data),null,2)],{type:'application/json'}));
  const link=document.createElement('a');link.href=url;link.download='ikeDay-backup.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('已匯出加密 JSON');
});
$('importFile').addEventListener('change',async event=>{
  const file=event.target.files[0];if(!file)return;
  try{
    const backup=JSON.parse(await file.text());
    const opened=await decryptBackup(backup,sessionPassword);
    if(!confirm('匯入會取代目前這個瀏覽器的標記紀錄，確定繼續？'))return;
    records=opened.data.records;salt=opened.rawSalt;key=opened.derived;seedVersion=Number(opened.data.seedVersion)||(opened.data.seedApplied?1:0);
    await applySeedIfNeeded();render();toast('JSON 備份已匯入');
  }catch(error){toast(error.message==='The operation failed for an operation-specific reason.'?'備份無法解密，請確認檔案。':error.message)}
  finally{event.target.value=''}
});
if(!window.crypto?.subtle){
  $('unlockForm').querySelector('button').disabled=true;
  $('lockError').textContent='此瀏覽器不支援加密功能，請使用最新版 Safari 或 Chrome。';
}
