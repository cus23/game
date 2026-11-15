(()=>{
"use strict";
const $=id=>document.getElementById(id);
const KEY="goodDayShopSaveV1";
const products=[
 {id:"tea",name:"奶茶",emoji:"🧋",price:45,stock:6,kind:"drink"},
 {id:"coffee",name:"咖啡",emoji:"☕",price:55,stock:5,kind:"drink"},
 {id:"water",name:"礦泉水",emoji:"💧",price:20,stock:8,kind:"drink"},
 {id:"bread",name:"菠蘿麵包",emoji:"🍞",price:35,stock:5,kind:"snack"},
 {id:"chips",name:"洋芋片",emoji:"🥔",price:40,stock:5,kind:"snack"},
 {id:"pudding",name:"布丁",emoji:"🍮",price:38,stock:4,kind:"snack"}
];
const customers=[
 {name:"趕上課的學生",emoji:"🧑🏻‍🎓",line:"老闆！我快遲到了，拜託快一點！",items:["tea","bread"],tip:8},
 {name:"剛下班的上班族",emoji:"👩🏻‍💻",line:"今天真的累翻了，想買點療癒的。",items:["coffee","pudding"],tip:12},
 {name:"健身房常客",emoji:"🏃🏻",line:"今天也要健康飲食！嗯……水跟麵包好了。",items:["water","bread"],tip:5},
 {name:"神祕阿姨",emoji:"👵🏻",line:"年輕人，幫我拿一下那個甜甜的。",items:["pudding","tea"],tip:10},
 {name:"放學的小朋友",emoji:"🧒🏻",line:"我有零用錢！可以買洋芋片嗎？",items:["chips","water"],tip:4},
 {name:"選擇困難的客人",emoji:"🤔",line:"我本來只想買一樣……但都好想吃。",items:["chips","pudding","coffee"],tip:14},
 {name:"附近的店長",emoji:"🧑🏻‍🍳",line:"來看看你今天生意如何。",items:["coffee","bread"],tip:18},
 {name:"旅行中的旅客",emoji:"🧳",line:"請問這附近有什麼好吃的？",items:["tea","chips"],tip:7},
 {name:"帶狗散步的人",emoji:"🐶",line:"牠一直盯著你的布丁看，哈哈。",items:["water","pudding"],tip:6}
];
let S={day:1,cash:1200,fame:10,energy:5,stock:{tea:6,coffee:5,water:8,bread:5,chips:5,pudding:4},turn:0,served:0,revenue:0,customers:[],rating:"—",promo:false,clean:false,diary:[],totalRevenue:0};
let current=null,muted=false,eventUsed=false;
const fmt=n=>"$"+Math.round(n).toLocaleString("en-US");
const product=id=>products.find(p=>p.id===id);
function save(){try{localStorage.setItem(KEY,JSON.stringify(S));$("saveHint").textContent="進度已自動儲存。";}catch(e){}}
function load(){try{const v=JSON.parse(localStorage.getItem(KEY));if(v&&v.day>=1&&v.day<=7)S={...S,...v};}catch(e){}}
function say(msg){$("feedback").textContent=msg;S.diary.unshift(msg);S.diary=S.diary.slice(0,5);$("diary").textContent=S.diary.join("　／　");}
function render(){
 $("dayLabel").textContent="第 "+S.day+" / 7 天";$("cash").textContent=fmt(S.cash);$("fame").textContent="★ "+S.fame;$("energy").textContent="♥ "+S.energy;$("rating").textContent=S.rating;$("turnLabel").textContent="第 "+Math.min(S.turn+1,5)+" 位客人";
 $("drinkShelf").innerHTML=["tea","coffee","water"].map(id=>'<span title="'+product(id).name+'">'+product(id).emoji.repeat(Math.min(3,Math.ceil(S.stock[id]/3)))+'</span>').join("");
 $("snackShelf").innerHTML=["bread","chips","pudding"].map(id=>'<span title="'+product(id).name+'">'+product(id).emoji.repeat(Math.min(3,Math.ceil(S.stock[id]/3)))+'</span>').join("");
 $("inventory").innerHTML=products.map(p=>'<span>'+p.emoji+" "+p.name+" × "+S.stock[p.id]+'</span>').join("");
 $("fameGoal").textContent=Math.min(S.fame,50)+" / 50";$("cashGoal").textContent=Math.min(S.totalRevenue,5000)+" / 5000";$("fameProgress").style.width=Math.min(100,S.fame/50*100)+"%";$("cashProgress").style.width=Math.min(100,S.totalRevenue/5000*100)+"%";
}
function makeCustomer(){
 const c=customers[Math.floor(Math.random()*customers.length)];
 current={...c,items:[...c.items]};$("customerEmoji").textContent=c.emoji;$("customerName").textContent=c.name;$("customerLine").textContent=c.line;
 $("orderList").innerHTML=c.items.map(id=>'<div class="order-item"><span>'+product(id).emoji+" "+product(id).name+'</span><b>'+fmt(product(id).price)+'</b></div>').join("");
 $("orderTotal").textContent=fmt(c.items.reduce((n,id)=>n+product(id).price,0));
 $("turnLabel").textContent="第 "+(S.turn+1)+" 位客人";$("serveBtn").disabled=false;$("skipBtn").disabled=false;$("feedback").textContent="客人正在等你結帳！";
}
function available(){return current.items.every(id=>S.stock[id]>0);}
function serve(){
 if(!current||S.turn>=5)return;
 if(!available()){say("有商品缺貨了！你可以補貨，或向客人道歉。");return;}
 const base=current.items.reduce((n,id)=>n+product(id).price,0);
 const bonus=S.promo?Math.round(base*.08):0;const tip=current.tip+(S.clean?5:0);
 S.cash+=base+bonus+tip;S.revenue+=base+bonus+tip;S.totalRevenue+=base+bonus+tip;S.fame+=S.clean?3:2;S.energy=Math.max(0,S.energy-1);
 current.items.forEach(id=>S.stock[id]--);S.served++;S.turn++;
 say(current.name+"買得很開心！收入 "+fmt(base+bonus+tip)+"（含小費）。");
 S.promo=false;S.clean=false;render();save();afterCustomer();
}
function skip(){if(!current||S.turn>=5)return;S.fame=Math.max(0,S.fame-1);S.turn++;say("你向客人道歉，人氣 -1。");render();save();afterCustomer();}
function afterCustomer(){
 if(S.turn>=5){setTimeout(endDay,500);return;}
 if(!eventUsed&&S.turn===2){eventUsed=true;setTimeout(randomEvent,350);return;}
 setTimeout(makeCustomer,350);
}
function randomEvent(){
 const events=[
 {emoji:"🌧️",title:"突然下起大雨！",text:"外面開始下大雨，路過的客人都跑進店裡躲雨。你要怎麼做？",choices:[["提供免費紙巾（人氣 +5）",()=>{S.fame+=5;say("客人覺得你很貼心！人氣 +5。");}],["趁機做雨天促銷（收入 +$100）",()=>{S.cash+=100;S.revenue+=100;S.totalRevenue+=100;say("雨天促銷成功！收入 +$100。");}]]},
 {emoji:"🎁",title:"廠商送來試吃品！",text:"廠商送來一批新品布丁，想請你幫忙試賣。",choices:[["收下！布丁庫存 +3",()=>{S.stock.pudding+=3;say("新品試賣開始！布丁 +3。");}],["婉拒，保持原本商品",()=>say("你決定先專心經營現有商品。")]]},
 {emoji:"🐈",title:"店門口有隻貓！",text:"一隻橘貓坐在門口，客人都停下來看牠。",choices:[["給牠一點水（人氣 +4）",()=>{S.fame+=4;say("橘貓成為店裡的吉祥物！人氣 +4。");}],["拍照發社群（人氣 +2、收入 +$40）",()=>{S.fame+=2;S.cash+=40;S.revenue+=40;S.totalRevenue+=40;say("照片意外爆紅！人氣 +2、收入 +$40。");}]]},
 {emoji:"📦",title:"補貨車提早到了！",text:"供應商說可以免費多送一箱商品，你想選哪一類？",choices:[["飲料箱（每種飲料 +2）",()=>{["tea","coffee","water"].forEach(id=>S.stock[id]+=2);say("飲料補給到貨！");}],["點心箱（每種點心 +2）",()=>{["bread","chips","pudding"].forEach(id=>S.stock[id]+=2);say("點心補給到貨！");}]]}
 ];
 const ev=events[Math.floor(Math.random()*events.length)];$("eventEmoji").textContent=ev.emoji;$("eventTitle").textContent=ev.title;$("eventText").textContent=ev.text;$("eventChoices").innerHTML="";
 ev.choices.forEach(([label,fn])=>{const b=document.createElement("button");b.textContent=label;b.addEventListener("click",()=>{$("eventModal").classList.add("hidden");fn();render();save();makeCustomer();});$("eventChoices").append(b);});
 $("eventModal").classList.remove("hidden");
}
function endDay(){
 const rating=S.served>=4?"🌟 超棒的一天":S.served>=3?"😊 還不錯":"🥲 再接再厲";
 S.rating=rating;render();$("resultEmoji").textContent=S.served>=4?"🎉":"🌙";$("resultTitle").textContent=S.day===7?"一週店長挑戰完成！":"今天辛苦了！";
 $("resultText").textContent="今天你接待了 "+S.served+" 位客人，營收 "+fmt(S.revenue)+"。"+(S.served>=4?"大家都很喜歡你的店！":"明天再想辦法讓更多客人滿意吧。");
 $("resultStats").innerHTML="<div>今日營收<b>"+fmt(S.revenue)+"</b></div><div>服務客人<b>"+S.served+" / 5</b></div><div>目前人氣<b>"+S.fame+"</b></div><div>剩餘體力<b>"+S.energy+"</b></div>";
 $("resultModal").classList.remove("hidden");save();
}
function nextDay(){
 $("resultModal").classList.add("hidden");
 if(S.day>=7){finishWeek();return;}
 S.day++;S.turn=0;S.served=0;S.revenue=0;S.energy=5;S.rating="—";S.promo=false;S.clean=false;eventUsed=false;
 Object.keys(S.stock).forEach(k=>S.stock[k]=Math.min(12,S.stock[k]+1));
 say("新的一天開始！商品自動補進一些庫存。");render();makeCustomer();save();
}
function finishWeek(){
 const won=S.fame>=50&&S.totalRevenue>=5000;
 $("resultModal").classList.remove("hidden");$("resultEmoji").textContent=won?"🏆":"🎊";$("resultTitle").textContent=won?"街坊最愛店長！":"七天營業結束！";
 $("resultText").textContent=won?"恭喜你達成雙重目標，GOOD DAY 成為附近最受歡迎的便利商店！":"你完成了七天營業！每間小店都有自己的成長節奏，再挑戰一次吧。";
 $("resultStats").innerHTML="<div>七天總營收<b>"+fmt(S.totalRevenue)+"</b></div><div>最終人氣<b>"+S.fame+"</b></div>";$("nextDayBtn").textContent="再玩一次 ↻";$("nextDayBtn").onclick=()=>{localStorage.removeItem(KEY);location.reload();};
}
function restock(){if(S.cash<100){say("現金不足，暫時不能補貨。");return;}S.cash-=100;products.forEach(p=>S.stock[p.id]=Math.min(15,S.stock[p.id]+2));say("補貨完成！每種商品庫存 +2。");render();save();}
function clean(){if(S.energy<1){say("體力不夠了，先休息一下吧。");return;}S.energy--;S.clean=true;S.fame+=2;say("店面整理乾淨了！下一位客人會感受到你的用心。");render();save();}
function promo(){if(S.cash<80){say("現金不足，無法宣傳。");return;}S.cash-=80;S.promo=true;S.fame+=3;say("促銷海報貼好了！下一位客人的消費會增加。");render();save();}
function start(){load();$("hero").classList.add("hidden");$("game").classList.remove("hidden");render();if(S.turn>=5){endDay();}else makeCustomer();save();}
$("startBtn").addEventListener("click",start);$("serveBtn").addEventListener("click",serve);$("skipBtn").addEventListener("click",skip);$("restockBtn").addEventListener("click",restock);$("cleanBtn").addEventListener("click",clean);$("promoBtn").addEventListener("click",promo);$("nextDayBtn").addEventListener("click",nextDay);$("soundBtn").addEventListener("click",()=>{muted=!muted;$("soundBtn").textContent=muted?"♫̸":"♫";});
const hero=document.querySelector(".hero");hero.id="hero";
if(localStorage.getItem(KEY)){const saved=JSON.parse(localStorage.getItem(KEY));if(saved&&saved.day){$("saveHint").textContent="偵測到上次的進度，開始後會接續遊戲。";}}
})();