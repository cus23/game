const $=id=>document.getElementById(id);
const STORE='ikeDay_attendance_v2';
const START='2026-05-08';
const te=new TextEncoder(),td=new TextDecoder();
const PASSWORD_CHECK='15WclAORKD85Z3ymfYxpJbqbJ1obv4WDSf1OP9hzzQk=';
const SEED_DATA={"salt":"nLqy2rUtg/0x0szn3bXceg==","iv":"uwNJ1nGIfzHqHCyj","ciphertext":"HzCYncEb0R00XJRfTUjKtPzXnkqvrph+DPz1DuLbvMB8S4x9odJSufGFb4dDsw5Z1DGmkUaD+gkGaFpPcz61nINxMtQOWlSgHCiGUuNsq8QaqWYZQ6Q+NciyorqIMN2XtkninnPw3EtaVzWUvp7mtY8tO4VGcep3NHVhxhQqTRepUy7iD3VCR2wY9OwD+GV6cd4Fi0lqCZG7+kgHcFqr/oIHy+WPXm62zn86nO6V5ydxjVjpkKr/gO5hFaoBF5krNyzTurqv/x9u1onvcF6NyUtJN/v8RQ7ie+/2fzSAJ4XVWM86jJhji93vraCHIl90TBbsBDRW2k+4zXTYMMzuqv8Q2w8f5ZAYmUWuk/IBdUVSdiKU3aoNOp+YLgW0fd1n3FPYoUIvOzCKBh3ry4PWaeFKT7pAjimJ4AgKuPdOrrnbTehvuNCS6tc0iN4u0o68812Yj1SUWFAHqwY+IAtCXs9VA13PtSWyiY5Gkym24JvwStha9vqSKEe+HI19vcAb7uOw2TVHITeLoL63XLprvr45qNobMG30cV4dDm8LU9Ja3XzNayyzBaJb6KiQzKX3nxYN9S9Sh8qlCwQGE8w44PPwips1EZ5zZTZwCzlyHjk+Wm898kjQ5awqymzRgVRPAeyg7Vjw4GVI937zMl4Lp1zIU2e1p0E4YdvfseQiG+Q2hSFrpI79q31y8rASTpUN9km9RnWC/EPUeHmKVSHMsf3BmW0N0rHqnRzZhG6K1FOIs5qpXWW9XLQhrhWhnjqTa8S28AoxoQJEtee3MiOryG0eNINEJQVu/QzXqxvGu3++/6m0UzqOMTZMnXGjzyRcGz2A33t+hV1rFp6YhYiDiV2UnH/Z0u+NrXXFXTHeZKGo9UOM5RRozPdNoaBxMqpSyH+tEr1rWwyod+Z49741HcvXiY9fUBdoUiT7GNK88LSyT/cuwORffuXYl2RpxxG0OmVvs671RmXA4UUleAQGDwAKRSIlkbKf9oyVCH4zJcuQKu9UKFUzoFcFW0TVUbx4BtRrynz+FpK1BBxxvV8sGf53YPA7RK04NlWEm0IgYyTZ0t+r/3csOGky8mwNrXv9Rn0o3uEvBl3/A607QMCSTUtLl9KPA/r30tpNSAgUpwaGJf/N9tKo2wkarKGVVAlw28H8hHcRzNYrOFRoDp2Pe/BF6A62UJb/aYRvMVzYH32OUSirwoeO4mCrBdzQvFhNQCfSYI0/WkbBia8TgguUj8rqmrWov3hmuAFiaQgsgK9GpBTmw98+vVMW+I6+LKDjthC7e3vDHKFornFscomScg=="};
let records={},key=null,view=new Date(),selected=null,salt=null,sessionPassword="",seedVersion=0;

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
  if(seedVersion<3){
    const seedKey=await deriveEncryptionKey(sessionPassword,unb64(SEED_DATA.salt));
    const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:unb64(SEED_DATA.iv)},seedKey,unb64(SEED_DATA.ciphertext));
    const seed=JSON.parse(td.decode(plain));
    for(const date of seed.dates){if(records[date]!=='yes'){records[date]='yes';changed=true}}
    seedVersion=3;changed=true;
  }
  if(seedVersion<4){
    if(records['2026-08-20']!=='yes'){records['2026-08-20']='yes';changed=true}
    seedVersion=4;changed=true;
  }
  if(seedVersion<5){
    if(records['2026-11-14']!=='yes'){records['2026-11-14']='yes';changed=true}
    seedVersion=5;changed=true;
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
  renderSubscriptionDays();
  $('markPanel').hidden=!selected;
  if(selected){$('selectedDate').textContent=selected.replaceAll('-','.');$('markYes').textContent=records[selected]==='yes'?'🐾 已標記有來':'🐾 有來';}
  renderYearChart();
}
function renderSubscriptionDays(){
  const now=new Date();
  const start=Date.UTC(2026,4,9);
  const todayUTC=Date.UTC(now.getFullYear(),now.getMonth(),now.getDate());
  const days=Math.max(1,Math.floor((todayUTC-start)/86400000)+1);
  $('subscriptionDays').textContent='+'+days;

  const yearStart=Date.UTC(now.getFullYear(),0,1);
  const nextYear=Date.UTC(now.getFullYear()+1,0,1);
  const elapsed=Math.min(1,Math.max(0,(todayUTC-yearStart)/(nextYear-yearStart)));
  const percent=Math.round(elapsed*100);
  const ring=$('yearProgress');
  ring.style.background='conic-gradient(#d99b94 0 '+(elapsed*360)+'deg, #f2e4e0 '+(elapsed*360)+'deg 360deg)';
  ring.setAttribute('aria-label','今年已經過去 '+percent+'%');
  $('yearPercentValue').textContent=String(percent);

  const weekdayCounts=Array(7).fill(0);
  for(const [date,status] of Object.entries(records)){
    if(status!=='yes'||date>today())continue;
    const [y,m,d]=date.split('-').map(Number);
    const weekday=(new Date(y,m-1,d).getDay()+6)%7;
    weekdayCounts[weekday]++;
  }
  const maxCount=Math.max(1,...weekdayCounts);
  const totalWeekdays=weekdayCounts.reduce((sum,count)=>sum+count,0);
  $('weekdayTotal').textContent=String(totalWeekdays);
  const labels=['週一','週二','週三','週四','週五','週六','週日'];
  const colors=['#E9C9A8','#D9B98F','#F0D9B5','#D8C7A8','#E5BDAF','#CDBD9F','#F1DCC7'];
  const size=104,cx=52,cy=52,r=40,stroke=11,gap=5,slot=360/7;
  const polar=(angle)=>{const rad=(angle-90)*Math.PI/180;return [cx+r*Math.cos(rad),cy+r*Math.sin(rad)]};
  const arcs=weekdayCounts.map((count,i)=>{
    const startAngle=i*slot+gap/2;
    const endAngle=(i+1)*slot-gap/2;
    const [x1,y1]=polar(startAngle),[x2,y2]=polar(endAngle);
    const opacity=count===0?.52:(.78+.22*count/maxCount);
    return '<path d="M '+x1.toFixed(2)+' '+y1.toFixed(2)+' A '+r+' '+r+' 0 0 1 '+x2.toFixed(2)+' '+y2.toFixed(2)+'" fill="none" stroke="'+colors[i]+'" stroke-width="'+stroke+'" stroke-linecap="butt" opacity="'+opacity.toFixed(2)+'"/>';
  }).join('');
  const accessible=labels.map((label,i)=>label+' '+weekdayCounts[i]+' 天').join('、');
  $('weekdayProgress').querySelector('svg')?.remove();
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('viewBox','0 0 '+size+' '+size);
  svg.setAttribute('role','img');
  svg.setAttribute('aria-label',accessible);
  svg.innerHTML=arcs;
  $('weekdayProgress').prepend(svg);
  $('weekdayProgress').setAttribute('aria-label','星期一至星期日有來次數：'+accessible);
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

/* Swipe left/right across the calendar to change month on touch devices. */
(()=>{
  const panel=$('calendar-card')||document.querySelector('.calendar-card');
  if(!panel)return;
  let startX=0,startY=0;
  panel.addEventListener('touchstart',event=>{
    if(event.touches.length!==1)return;
    startX=event.touches[0].clientX;startY=event.touches[0].clientY;
  },{passive:true});
  panel.addEventListener('touchend',event=>{
    if(!startX&&!startY)return;
    const dx=event.changedTouches[0].clientX-startX;
    const dy=event.changedTouches[0].clientY-startY;
    if(Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)*1.25){
      if(dx<0&&!$('nextMonth').disabled)$('nextMonth').click();
      else if(dx>0&&!$('prevMonth').disabled)$('prevMonth').click();
    }
    startX=0;startY=0;
  },{passive:true});
})();
