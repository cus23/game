(()=>{
"use strict";
const $=id=>document.getElementById(id);
const state={questions:0,clues:[],scareOne:false,scareTwo:false,ended:false,correct:0};
const clueData={
 cctv:{tag:"EVIDENCE 01",title:"監視器截圖",body:"畫面時間：03:17:08。\n電梯門上的樓層顯示器是「13」。但畫面右下角的監視器時間戳記，顯示這段影片其實來自地下室的攝影機。\n\n更奇怪的是：電梯鏡面裡有一個人，站在管理員身後。管理員本人卻沒有回頭。",hint:"注意鏡面中的人影，以及這段影片真正的拍攝位置。"},
 elevator:{tag:"EVIDENCE 02",title:"電梯維修紀錄",body:"建物電梯控制系統的維修紀錄：\n\n00:41 — 取消 13 樓按鍵。\n01:06 — 13 樓樓層訊號再次出現。\n02:58 — 電梯在 12 樓與 B1 之間往返 6 次。\n03:17 — 電梯門感應器顯示「內側有人持續按住開門鍵」。\n\n備註：本棟建築並沒有登記 13 樓。",hint:"電梯的樓層顯示可能不是故障，而是有人刻意讓它停在某個位置。"},
 blueprint:{tag:"EVIDENCE 03",title:"建築平面圖",body:"你找到一張二十年前的施工圖。\n\n正式樓層從 12 樓直接跳到 14 樓。圖面上，12 樓天花板與屋頂設備層之間，留有一個未標示的夾層。\n\n夾層入口被畫在電梯井旁邊，旁邊有一行手寫字：\n「維修人員不得在 03:17 後進入。」",hint:"十三樓不是一般住戶使用的樓層。它被藏在兩個正式樓層之間。"},
 audio:{tag:"EVIDENCE 04",title:"最後一段錄音",body:"錄音長度：00:19。\n\n（電梯抵達提示音。）\n管理員：「我到十二樓了。」\n（敲門聲，三下。）\n未知聲音：「你怎麼還在外面？」\n管理員：「我沒有出去。」\n（長時間沉默。）\n未知聲音：「那剛才替你開門的是誰？」\n\n錄音結束前，還有一個很輕的聲音：四下敲門。",hint:"留意管理員說的「我沒有出去」，以及最後多出來的第四下敲門。"},
 report:{tag:"EVIDENCE 05",title:"管理員值班表",body:"管理員：林先生。\n值班時間：22:00–06:00。\n\n備註欄有三次相同的手寫紀錄：\n「03:17，巡樓時請勿搭乘電梯。」\n\n最底下還有一行被塗黑的字，透光後勉強辨識出：\n「如果在十三樓看見自己，不要回答他。」",hint:"管理員以前就知道這個時間會發生什麼事。"}
};
const answers=[
{keys:["13樓","十三樓","第十三層","夾層","樓層"],yes:"是。它確實存在，只是不在正式建築登記裡。",no:"不是這個方向。",important:true},
{keys:["鏡子","倒影","反射","鏡面"],yes:"是。鏡面裡的影像和現實並不一致。",no:"不是。鏡面是重要線索。",important:true},
{keys:["管理員","林先生","自己","複製","另一個人","替身"],yes:"是。管理員遇到的不是普通訪客。",no:"不能這樣說。你需要分清楚畫面裡的兩個人。",important:true},
{keys:["電梯","按鈕","維修","故障"],yes:"是。電梯是通往那個夾層的唯一入口。",no:"不是單純的機械故障。",important:true},
{keys:["03:17","時間","凌晨","敲門","四下","三下"],yes:"是。這個時間和敲門次數都有意義。",no:"不完全正確。再注意錄音裡的順序。",important:true},
{keys:["死","鬼","幽靈","超自然"],yes:"你可以這樣理解，但還沒有解釋清楚它如何出現。",no:"目前沒有足夠證據排除這個可能。",important:false},
{keys:["門","開門","出去","進去","裡面","外面"],yes:"是。真正危險的不是門外，而是有人已經在裡面。",no:"不是單純的門鎖問題。",important:true}
];
function logLine(q,a){const row=document.createElement("div");row.className="log-entry";const s=document.createElement("span");s.className="speaker";s.textContent="YOU";const t=document.createElement("span");t.className="answer";t.textContent=q;row.append(s,t);$("log").append(row);const r=document.createElement("div");r.className="log-entry";const rs=document.createElement("span");rs.className="speaker";rs.textContent="SOUP";const rt=document.createElement("span");rt.className="answer";const b=document.createElement("b");b.textContent=a;rt.append(b);r.append(rs,rt);$("log").append(r);$("log").scrollTop=$("log").scrollHeight;}
function answerQuestion(q){
 const s=q.toLowerCase();
 if(/答案|真相|完整故事|解答/.test(s))return "現在還不是時候。先把線索拼起來。";
 for(const item of answers){if(item.keys.some(k=>s.includes(k))){if(item.important)state.correct++;return item.yes;}}
 if(/為什麼|原因|發生|誰|什麼/.test(s))return "這個問題很重要，但你需要更具體一點。請拆開來問。";
 return "這件事目前無法判斷。試著問人物、時間、空間，或聲音是否有關。";
}
function submitQuestion(e){e.preventDefault();if(state.ended)return;const input=$("question");const q=input.value.trim();if(!q)return;state.questions++;const a=answerQuestion(q);logLine(q,a);input.value="";$("questionCount").textContent=state.questions+" 次提問";
 if(state.questions>=3&&!state.scareOne){state.scareOne=true;setTimeout(()=>jumpscare("small"),450);}
 if(state.questions>=7&&!state.scareTwo){state.scareTwo=true;setTimeout(()=>jumpscare("large"),650);}
}
function openClue(id){const d=clueData[id];if(!d)return;if(!state.clues.includes(id)){state.clues.push(id);const btn=document.querySelector('[data-clue="'+id+'"]');btn.classList.add("found");btn.querySelector("small").textContent="已取得";$("clueCount").textContent=state.clues.length+" / 5 已發現";if(state.clues.length===3&&!state.scareOne){state.scareOne=true;setTimeout(()=>jumpscare("small"),400);}if(state.clues.length===5&&!state.scareTwo){state.scareTwo=true;setTimeout(()=>jumpscare("large"),500);}}
 $("modalTag").textContent=d.tag;$("modalTitle").textContent=d.title;$("modalBody").textContent=d.body;$("modalHint").textContent="調查提示："+d.hint;$("clueModal").classList.remove("hidden");
}
function closeClue(){$("clueModal").classList.add("hidden");}
let audioCtx=null;
function soundScare(){try{const C=window.AudioContext||window.webkitAudioContext;if(!C)return;audioCtx=audioCtx||new C();if(audioCtx.state==="suspended")audioCtx.resume();const now=audioCtx.currentTime;const osc=audioCtx.createOscillator();const gain=audioCtx.createGain();osc.type="sawtooth";osc.frequency.setValueAtTime(95,now);osc.frequency.exponentialRampToValueAtTime(32,now+.55);gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(.35,now+.025);gain.gain.exponentialRampToValueAtTime(.0001,now+.75);osc.connect(gain);gain.connect(audioCtx.destination);osc.start(now);osc.stop(now+.8);}catch(e){}}
function vibrate(pattern){if(navigator.vibrate){try{navigator.vibrate(pattern);}catch(e){}}}
function jumpscare(level){if(state.ended)return;const el=$("jumpscare");el.classList.remove("hidden");el.classList.add("active");el.setAttribute("aria-hidden","false");soundScare();vibrate(level==="large"?[180,60,240,60,400]:[100,50,160]);document.body.classList.add("shake");setTimeout(()=>{el.classList.remove("active");el.classList.add("hidden");el.setAttribute("aria-hidden","true");document.body.classList.remove("shake");},level==="large"?1900:1250);}
function submitTheory(){const t=$("theory").value.trim();if(t.length<12){$("theory").focus();$("theory").placeholder="請再多寫一點，你還需要解釋發生了什麼。";return;}state.ended=true;const score=state.clues.length*2+Math.min(state.correct,5)+Math.min(state.questions,5);let code,title,body;
 if(state.clues.length===5&&/鏡|倒影|複製|另一個|自己|夾層|十三樓/.test(t)){code="ENDING 01 · 完整真相";title="你沒有回頭。";body="十三樓是藏在十二樓與屋頂之間的維修夾層。電梯鏡面會在 03:17 映出一個「多出來的人」。它會模仿乘客，並在乘客回答敲門聲後取代他。管理員在鏡中看見了自己，卻沒有回答。真正讓他消失的，是他身後那個已經走出鏡面的自己。你拼出了真相。但提交推理後，螢幕反光裡，你的嘴巴比你早一步笑了。";}
 else if(score>=8){code="ENDING 02 · 未完成的紀錄";title="你知道得太多了。";body="你找到十三樓的入口，也知道管理員不是第一個失蹤的人。但你沒有弄清楚鏡面裡的東西如何離開。凌晨 03:17，電梯抵達。這次，樓層顯示器亮起了「你的名字」。";}
 else{code="ENDING 03 · 第四下";title="門外有人。";body="你提交了推理，卻忽略了最重要的聲音。錄音最後有四下敲門，而管理員值班表提醒：不要回答。你聽見房門外傳來敲門聲。三下。停頓。第四下。接著，門內也響起相同的聲音。";}
 $("endingCode").textContent=code;$("endingTitle").textContent=title;$("endingText").textContent=body;$("ending").classList.remove("hidden");soundScare();vibrate([100,70,180]);
}
function start(){if(audioCtx&&audioCtx.state==="suspended")audioCtx.resume();$("intro").classList.add("hidden");$("story").classList.remove("hidden");$("question").focus();}
function restart(){location.reload();}
function tick(){const d=new Date();$("clock").textContent="03:"+String(d.getMinutes()).padStart(2,"0")+":"+String(d.getSeconds()).padStart(2,"0");}
$("startBtn").addEventListener("click",start);$("questionForm").addEventListener("submit",submitQuestion);$("closeClue").addEventListener("click",closeClue);$("clueModal").addEventListener("click",e=>{if(e.target===$("clueModal"))closeClue();});document.querySelectorAll("[data-clue]").forEach(b=>b.addEventListener("click",()=>openClue(b.dataset.clue)));$("submitTheory").addEventListener("click",submitTheory);$("restart").addEventListener("click",restart);document.addEventListener("keydown",e=>{if(e.key==="Escape")closeClue();});tick();setInterval(tick,1000);
})();