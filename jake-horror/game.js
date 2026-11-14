(() => {
  
"use strict";
  
const $ = id => document.getElementById(id);
  
const SAVE = "stay-with-me-jake-v2";
  
const CODE = "1115";
  
const state = {
    unlocked:false,passcode:"",trust:50,fear:8,scene:0,choices:[],clues:[],history:[],ended:false,touchY:null
  };
  
const scenes = [
{
    chapter:"CHAPTER 01 · 23:48",title:"雨夜的訊息",text:"雨下得很大。你剛走出便利商店，手機亮了。\n\nJake：到家了跟我說。\n\n你們認識三個星期。他總是很貼心，記得你的飲料、課表，甚至知道你哪天比較累。\n\n只是今天，你根本沒告訴他自己出門。",choices:[["「你怎麼知道我在外面？」",0,8,"question","你沒有告訴他自己出門。這件事值得問清楚。"],["「快到了，謝謝你。」",8,0,"soft","他回覆得很快，像是一直拿著手機等你。"],["「我現在不方便回訊息。」",-5,3,"distant","你把手機收進口袋，雨聲突然變得很大。"]]
  },
{
    chapter:"CHAPTER 01 · 23:53",title:"第二則訊息",text:"訊息顯示已讀。幾秒後，他傳來一張照片。\n\n照片裡是你家巷口的路燈。角度像是從對街拍的。\n\nJake：這邊路燈壞掉了，走亮一點的地方。\n\n你停下腳步。巷口明明就在前面。",choices:[["「你現在在我家附近？」",-2,12,"nearby","照片的拍攝角度，讓你無法當作巧合。"],["「你在哪裡？我看不到你。」",0,10,"look","你環顧四周，街上只有雨和車燈。"],["先不回覆，直接回家。",-3,7,"silent","你沒有再看手機，但螢幕仍亮了一次。"]]
  },
{
    chapter:"CHAPTER 02 · 00:06",title:"凌晨來電",text:"手機突然震動。螢幕上顯示 Jake。\n\n你接起來，電話那頭很安靜，只有一點風聲。\n\nJake：「終於接了。」\n\n他的聲音聽起來很疲倦，像是已經等了很久。",choices:[["「你到底在哪裡？」",-2,12,"where","他沒有回答位置，只問你是不是一個人。"],["「你是不是喝醉了？」",5,0,"drunk","他輕輕笑了一聲，說自己很清醒。"],["保持沉默，聽他說。",-4,5,"quiet","沉默持續了幾秒，他卻沒有掛斷。"]]
  },
{
    chapter:"CHAPTER 02 · 00:09",title:"他知道的事",text:"Jake：「你今天穿那件灰色外套，很適合你。」\n\n你低頭看著自己的袖口。\n\nJake：「不要怕。我沒有要做什麼。我只是……不喜歡不知道你在哪裡。」\n\n他停了一下。「你也不喜歡我突然消失，對吧？」",choices:[["「這不是一回事。」",0,10,"boundary","他說了聲抱歉，卻又問你明天幾點下課。"],["「我沒有要你一直報備。」",-2,8,"boundary2","他沒有反駁，只說自己會試著改。"],["「你先回去，我們明天談。」",4,3,"tomorrow","他答應得很快，快得像早就準備好這個答案。"]]
  },
{
    chapter:"CHAPTER 03 · 00:17",title:"門外的人",text:"你終於回到家。門鎖轉動時，手機又亮了。\n\nJake：開門前先看一下貓眼。\n\n你僵住。下一秒，門外傳來三下很輕的敲門聲。\n\n叩、叩、叩。",choices:[["透過貓眼查看。",-3,12,"peephole","走廊的燈閃了一下。門外沒有人，但地上有一把透明雨傘。"],["打電話給朋友。",2,0,"friend","朋友接起電話。你第一次把今晚的事完整說出口。"],["隔著門問對方是誰。",-5,8,"door","門外的人沒有回答。手機卻跳出一則訊息：是我。"]]
  },
{
    chapter:"CHAPTER 03 · 00:20",title:"未寄出的訊息",text:"你打開訊息頁面，發現 Jake 在你回家前就傳了三則訊息。\n\n「到家了嗎？」、「我知道你不喜歡下雨。」、「今天就先這樣，晚安。」\n\n最後一則的時間，比你抵達家門早了四分鐘。你盯著時間戳記。也許他只是猜的。也許不是。",choices:[["截圖保存訊息。",3,2,"screenshot","你把時間、照片和訊息都存了下來。"],["直接問他怎麼知道。",-1,9,"confront","已讀出現了。他正在輸入，卻遲遲沒有送出。"],["把手機調成飛航模式。",0,-3,"airplane","房間終於安靜下來。安靜得讓你聽見自己的呼吸。"]]
  },
{
    chapter:"CHAPTER 04 · 00:31",title:"他說的真相",text:"手機重新連上網路。Jake 傳來一段語音。\n\n「我沒有跟蹤你。我只是剛好在附近。」停頓。\n\n「你最近都很忙。我怕你不需要我了。」\n\n他的語氣不像生氣，更像在等你安慰他。你突然意識到，今晚你一直在解釋自己的行蹤。",choices:[["「我不需要為每個行程交代。」",2,2,"independent","你第一次沒有先安撫他的情緒。"],["「我知道你只是擔心。」",5,4,"reassure","他立刻回了一個愛心，接著問你明天的安排。"],["「我們先暫停聯絡。」",1,-5,"pause","對話停在已讀。這一次，是你主動結束了對話。"]]
  },
{
    chapter:"CHAPTER 04 · 00:42",title:"最後一個選擇",text:"門外已經沒有聲音。你把窗簾拉上，手機卻再次亮起。\n\nJake：我知道你現在很害怕。但你只要開口叫我，我就會在。\n\n游標閃爍，像是在等你做決定。你看著那些訊息，想起今晚每一個不合理的細節。",choices:[["「Jake，我們需要談談。」",5,-4,"talk","你決定把界線說清楚，也留下之後對話的空間。"],["封鎖他的聯絡方式。",0,-10,"block","你按下封鎖。房間裡只剩下雨聲。"],["「你先離開，我不想見你。」",3,-6,"leave","你沒有再解釋。他終於沒有立刻回覆。"]]
  }
];
  
const replies = {
    
question:["為什麼這樣問？","我只是剛好經過。"],soft:["乖。到家記得鎖門。","我不想你淋雨。"],distant:["好，我等你。","只是想知道你平安。"],
nearby:["我只是路過。","你不用這麼緊張。"],look:["你看不到我也沒關係。","我一直都在。"],silent:["你是不是不想理我？","沒關係，我等。"],
where:["就在附近。","你不用找我。"],drunk:["沒有喝。","我很清醒。"],quiet:["你不說話，我也知道你在聽。"],
boundary:["我知道。對不起。","我只是太在意你了。"],boundary2:["那你可以告訴我你在哪嗎？"],tomorrow:["好。明天見。","晚安，別鎖門太早。"],
peephole:["看到了什麼？","不要緊張。"],friend:["你要找誰？","我可以陪你。"],door:["是我。","開一下門，好嗎？"],
screenshot:["你不用特地保存。","我沒有要隱瞞你。"],confront:["我只是記性比較好。","你不是說過你討厭那條路嗎？"],airplane:["訊息送達失敗。"],
independent:["我知道。","我會給你一點空間。"],reassure:["我知道你會懂。","明天幾點下課？"],pause:["好。你休息。","晚安。"],
talk:["好。我聽你說。"],block:["……","訊息已送達。"],leave:["我知道了。","那你先休息。"]

  };
  
function vibrate(p=[40]){
    try{
      navigator.vibrate&&navigator.vibrate(p)
    }catch(e){
      
    }
  }
function toast(t){
    const n=$("toast");
    n.textContent=t;
    n.classList.add("visible");
    clearTimeout(toast.timer);
    toast.timer=setTimeout(()=>n.classList.remove("visible"),1700)
  }
function updateClock(){
    const d=new Date();
    const t=d.toLocaleTimeString("zh-TW",{
      hour:"2-digit",minute:"2-digit",hour12:false
    });
    $("systemTime").textContent=t;
    $("lockClock").textContent=t;
    $("lockDate").textContent=d.toLocaleDateString("zh-TW",{
      month:"long",day:"numeric",weekday:"long"
    })
  }
function showPasscode(){
    if(state.unlocked)return;
    state.passcode="";
    updateDots();
    $("passcodeError").textContent="";
    $("passcodeScreen").classList.add("visible");
    $("passcodeScreen").setAttribute("aria-hidden","false");
    vibrate([20])
  }
function hidePasscode(){
    $("passcodeScreen").classList.remove("visible");
    $("passcodeScreen").setAttribute("aria-hidden","true");
    state.passcode="";
    updateDots()
  }
function updateDots(){
    document.querySelectorAll("#passcodeDots i").forEach((d,i)=>d.classList.toggle("filled",i<state.passcode.length))
  }
function enterDigit(d){
    if(!/^\d$/.test(d)||state.passcode.length>=4)return;
    state.passcode+=d;
    updateDots();
    if(state.passcode.length!==4)return;
    if(state.passcode===CODE){
      $("passcodeError").textContent="";
      vibrate([35,35,80]);
      setTimeout(unlock,180)
    }else{
      $("passcodeError").textContent="密碼錯誤，請重試";
      vibrate([90,45,90]);
      setTimeout(()=>{
        state.passcode="";
        updateDots()
      },650)
    }
  }
function unlock(){
    if(state.unlocked)return;
    state.unlocked=true;
    hidePasscode();
    $("lockScreen").classList.add("dismissed");
    toast("已解鎖");
    save()
  }
function openView(name){
    document.querySelectorAll(".view").forEach(v=>v.classList.toggle("active",v.id==="view-"+name));
    document.querySelectorAll(".tab").forEach(t=>t.classList.toggle("active",t.dataset.view===name));
    if(name==="chat")renderChatChoices();
    save()
  }
function renderScene(){
    const s=scenes[state.scene];
    if(!s)return ending();
    $("sceneChapter").textContent=s.chapter;
    $("chapterLabel").textContent=s.chapter.split("·")[0].trim();
    $("sceneTitle").textContent=s.title;
    $("sceneText").textContent=s.text;
    $("sceneCounter").textContent=String(state.scene+1).padStart(2,"0")+" / 08";
    const list=$("choiceList");
    list.replaceChildren();
    s.choices.forEach((c,i)=>{
      const b=document.createElement("button");
      b.className="choice-button";
      b.textContent=(i+1)+". "+c[0];
      b.addEventListener("click",()=>choose(c));
      list.appendChild(b)
    })
  }
function choose(c){
    if(state.ended)return;
    state.trust=clamp(state.trust+c[1]);
    state.fear=clamp(state.fear+c[2]);
    state.choices.push(c[3]);
    state.history.push({
      scene:state.scene,choice:c[0]
    });
    if(c[4])addClue(c[4]);
    addMessage(c[0],"sent");
    const r=replies[c[3]]||["我知道了。"];
    setTimeout(()=>addMessage(r[0],"received",r[1]||""),300);
    if(state.scene===1)setTimeout(()=>incomingCall("Jake 正在呼叫你…"),1100);
    state.scene++;
    updateStats();
    updateDiary(c[3]);
    save();
    if(state.scene<scenes.length)setTimeout(renderScene,650);
    else setTimeout(ending,650)
  }
function clamp(n){
    return Math.max(0,Math.min(100,n))
  }
function addClue(t){
    if(state.clues.includes(t))return;
    state.clues.push(t);
    const ul=$("clueList");
    ul.replaceChildren();
    state.clues.forEach(x=>{
      const li=document.createElement("li");
      li.textContent=x;
      ul.appendChild(li)
    })
  }
function updateStats(){
    $("trustValue").textContent=state.trust;
    $("fearValue").textContent=state.fear;
    $("trustMeter").style.width=state.trust+"%";
    $("fearMeter").style.width=state.fear+"%"
  }
function updateDiary(k){
    const n={
      question:"他沒有正面回答。我開始在意，他究竟知道多少。",soft:"我選擇相信他的關心，但照片的事還是讓我不舒服。",boundary:"我試著說清楚自己的界線。他有聽進去嗎？",screenshot:"我把訊息和時間都存了下來。至少這次，我沒有只靠自己的記憶。",friend:"把事情說出口後，我才發現今晚有很多地方不合理。",block:"我不需要立刻原諒，也不需要為自己的安全感到抱歉。",leave:"我說了不想見面。接下來，我要看他會不會尊重這件事。",airplane:"我把手機關掉了一會兒。安靜讓我重新聽見自己的想法。"
    };
    if(n[k])$("diaryEntry").textContent=n[k]
  }
function addMessage(text,kind,translation){
    const b=document.createElement("div");
    b.className="bubble "+kind;
    b.textContent=text;
    if(translation){
      const s=document.createElement("small");
      s.textContent=translation;
      b.appendChild(s)
    }$("messageList").appendChild(b);
    $("messageList").scrollTop=$("messageList").scrollHeight
  }
function renderChatChoices(){
    const box=$("chatChoices");
    box.replaceChildren();
    const options=["「你現在在哪裡？」","「我到家了。」","「你可以不要一直找我嗎？」"];
    options.forEach((t,i)=>{
      const b=document.createElement("button");
      b.className="chat-choice";
      b.textContent=t;
      b.addEventListener("click",()=>{
        addMessage(t,"sent");
        const r=[["在你附近。","你不用擔心。"],["很好。把門鎖好。","晚安。"],["對不起。我只是怕你不理我。","我會注意。"]][i];
        setTimeout(()=>addMessage(r[0],"received",r[1]),400)
      });
      box.appendChild(b)
    })
  }
function incomingCall(t){
    $("callSubtitle").textContent=t||"正在撥打給你…";
    $("incomingCall").classList.add("visible");
    vibrate([220,90,220,90,350])
  }
function declineCall(){
    $("incomingCall").classList.remove("visible");
    addMessage("未接來電","received");
    toast("已拒絕來電")
  }
function answerCall(){
    $("callSubtitle").textContent="已接通 · 00:01";
    vibrate([60]);
    setTimeout(()=>{
      $("callSubtitle").textContent="Jake：「我只是想聽聽你的聲音。」"
    },500);
    setTimeout(()=>{
      $("incomingCall").classList.remove("visible");
      addMessage("我只是想聽聽你的聲音。","received");
      openView("chat")
    },1800)
  }
function ending(){
    state.ended=true;
    openView("story");
    $("chapterLabel").textContent="ENDING";
    $("sceneChapter").textContent="END OF STORY";
    let title,body,tag;
    if(state.fear>=30&&state.fear>state.trust){
      title="你還在聽嗎？";
      tag="ENDING 01 · THE SHADOW";
      body="你把手機翻面放在桌上。螢幕暗下去之前，又亮了一次。\n\nJake：我不會逼你。\n\nJake：但你知道，我總會找到你的。\n\n你沒有回覆。這一次，你決定先照顧自己的安全。"
    }else if(state.choices.includes("block")||state.choices.includes("leave")){
      title="界線之外";
      tag="ENDING 02 · YOUR OWN SPACE";
      body="你把話說完，沒有再替他的沉默找理由。\n\n隔天早上，你把昨晚的事告訴朋友，也決定暫時不再單獨見他。至少今晚，你拿回了自己的節奏。"
    }else{
      title="未完待續";
      tag="ENDING 03 · TOMORROW";
      body="你決定把話說清楚。電話那頭沉默了很久。\n\nJake：「好。那明天，我們好好談。」\n\n他掛斷了電話。你卻沒有立刻放下手機。信任不是一句道歉就能恢復的事。"
    }$("sceneTitle").textContent=title;
    $("sceneText").textContent=body;
    $("sceneCounter").textContent="END";
    const list=$("choiceList");
    list.replaceChildren();
    const card=document.createElement("article");
    card.className="panel";
    const label=document.createElement("p");
    label.className="eyebrow";
    label.textContent=tag;
    const sum=document.createElement("p");
    sum.textContent="信任感："+state.trust+" ／ 不安程度："+state.fear+"。你的選擇已影響這次結局。";
    card.append(label,sum);
    const replay=document.createElement("button");
    replay.className="primary-button";
    replay.textContent="重新開始";
    replay.onclick=reset;
    const chat=document.createElement("button");
    chat.className="secondary-button";
    chat.textContent="查看訊息紀錄";
    chat.onclick=()=>openView("chat");
    list.append(card,replay,chat);
    save()
  }
function start(){
    if(!state.unlocked)unlock();
    state.scene=0;
    state.ended=false;
    openView("story");
    renderScene();
    save()
  }
function reset(){
    state.trust=50;
    state.fear=8;
    state.scene=0;
    state.choices=[];
    state.clues=[];
    state.history=[];
    state.ended=false;
    $("messageList").innerHTML='<div class="date-divider">今天 23:48</div><div class="bubble received">집 도착했어?<small>到家了嗎？</small></div>';
    $("diaryEntry").textContent="他怎麼會知道我幾點離開？我明明沒有跟他說。";
    $("clueList").innerHTML="<li>尚未發現新的線索。</li>";
    updateStats();
    start()
  }
function save(){
    try{
      localStorage.setItem(SAVE,JSON.stringify({
        trust:state.trust,fear:state.fear,scene:state.scene,choices:state.choices,clues:state.clues,history:state.history,ended:state.ended,unlocked:state.unlocked
      }))
    }catch(e){
      
    }
  }
function load(){
    try{
      const d=JSON.parse(localStorage.getItem(SAVE)||"null");
      if(!d||typeof d.scene!=="number"){
         $("continueButton").disabled=true;
        $("continueButton").textContent="尚無存檔";
        return
      } $("continueButton").addEventListener("click",()=>{
        state.trust=clamp(Number(d.trust)||50);
        state.fear=clamp(Number(d.fear)||8);
        state.scene=Math.min(8,Math.max(0,d.scene));
        state.choices=Array.isArray(d.choices)?d.choices:[];
        state.clues=[];
        const savedClues=Array.isArray(d.clues)?d.clues:[];
        state.history=Array.isArray(d.history)?d.history:[];
        state.ended=!!d.ended;
        if(d.unlocked)unlock();
        updateStats();
        savedClues.forEach(addClue);
        if(state.ended||state.scene>=8)ending();
        else{
          openView("story");
          renderScene()
        }
      },{
        once:true
      })
    }catch(e){
      $("continueButton").disabled=true;
      $("continueButton").textContent="存檔讀取失敗"
    }
  }
function bind(){
    
document.querySelectorAll("[data-open-passcode]").forEach(b=>b.addEventListener("click",e=>{
      e.preventDefault();
      showPasscode()
    }));
    
$("cancelPasscode").addEventListener("click",hidePasscode);
    
$("deleteDigit").addEventListener("click",()=>{
      state.passcode=state.passcode.slice(0,-1);
      updateDots();
      $("passcodeError").textContent=""
    });
    
$("keypad").addEventListener("click",e=>{
      const b=e.target.closest("[data-digit]");
      if(b)enterDigit(b.dataset.digit)
    });
    
$("lockScreen").addEventListener("touchstart",e=>{
      if(e.touches.length===1)state.touchY=e.touches[0].clientY
    },{
      passive:true
    });
    
$("lockScreen").addEventListener("touchend",e=>{
      if(state.touchY==null)return;
      if(state.touchY-e.changedTouches[0].clientY>28)showPasscode();
      state.touchY=null
    },{
      passive:true
    });
    
$("lockScreen").addEventListener("touchcancel",()=>{
      state.touchY=null
    },{
      passive:true
    });
    
$("startButton").addEventListener("click",start);
    
$("callAgainButton").addEventListener("click",()=>incomingCall("Jake 正在呼叫你…"));
    
$("backToStoryButton").addEventListener("click",()=>openView("story"));
    
$("answerCall").addEventListener("click",answerCall);
    $("declineCall").addEventListener("click",declineCall);
    
document.querySelectorAll(".tab").forEach(b=>b.addEventListener("click",()=>openView(b.dataset.view)));
    

  }
updateClock();
  setInterval(updateClock,15000);
  bind();
  updateStats();
  renderChatChoices();
  load();
  

})();
