
const REGIONS={"中国":"cn","蒙古":"mg","东亚":"ea","欧洲":"eu","伊斯兰":"is","其他":"ot"};
function parseEvents(source){
  const out=[];
  const seen={};
  source.split("\n").forEach(function(line){
    line=line.trim();
    if(!line||line.charAt(0)==="#")return;
    const parts=line.split("|");
    if(parts.length<3){console.warn("[题库] 格式应为「日期 | 地区 | 标题」： "+line);return;}
    const ds=parts[0].trim();
    const r=parts[1].trim();
    const t=parts.slice(2).join("|").trim();
    const ymd=ds.split("-").map(function(s){return parseInt(s,10);});
    if(!ymd[0]||!t){console.warn("[题库] 缺少年份或标题： "+line);return;}
    if(ymd.length>3||!ymd.slice(1).every(function(v){return v>=1;})){console.warn("[题库] 日期格式有误（应为 年 / 年-月 / 年-月-日）： "+line);return;}
    if(ymd.length>=2&&ymd[1]>12){console.warn("[题库] 月份超出范围： "+line);return;}
    if(ymd.length===3&&ymd[2]>31){console.warn("[题库] 日超出范围： "+line);return;}
    const y=ymd[0],m=ymd.length>1?ymd[1]:0,d=ymd.length>2?ymd[2]:0;
    if(!REGIONS[r]){console.warn("[题库] 未知地区「"+(r||"空")+"」（应为中国/蒙古/东亚/欧洲/伊斯兰/其他）： "+line);return;}
    if(y<1162||y>1368)console.warn("[题库] 年份超出 1162-1368 范围： "+line);
    if(/\d/.test(t))console.warn("[题库] 标题含阿拉伯数字，可能泄露答案： "+line);
    const k=y+"-"+m+"-"+d+"|"+t;
    if(seen[k]){console.warn("[题库] 重复事件已忽略： "+line);return;}
    seen[k]=true;
    out.push({y:y,m:m,d:d,r:r,t:t});
  });
  return out;
}
const EVENTS=parseEvents(EVENTS_SOURCE);

const $=s=>document.querySelector(s);
function el(tag,cls,html){const e=document.createElement(tag);if(cls)e.className=cls;if(html!=null)e.innerHTML=html;return e;}
function shuffle(arr){const a=arr.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function bestKey(){return "timeline-best-score";}
function loKey(e){return e.y*10000+(e.m||1)*100+(e.d||1);}
function hiKey(e){return e.y*10000+(e.m||12)*100+(e.d||31);}
function fmtDate(e){let s=e.y+"年";if(e.m){s+=e.m+"月";if(e.d)s+=e.d+"日";}return s;}
function definitelyOrdered(a,b){return hiKey(a)<loKey(b)||hiKey(b)<loKey(a);}
function dateNode(e){
  return el("div","card-date",fmtDate(e));
}
function regionNode(e){
  return el("span","tag-region "+(REGIONS[e.r]||""),e.r);
}
function cardBody(card,e,showDate){
  card.appendChild(el("div","t",e.t));
  if(showDate)card.appendChild(dateNode(e));
  if(e.r)card.appendChild(regionNode(e));
}

let state=null;

function show(id){document.querySelectorAll(".screen").forEach(s=>s.classList.remove("on"));$("#"+id).classList.add("on");}

function toast(msg,kind,dur){
  const t=$("#toast");
  t.className="";t.innerHTML=msg;
  requestAnimationFrame(()=>t.classList.add("show",kind||""));
  clearTimeout(t._tm);
  t._tm=setTimeout(()=>t.classList.remove("show"),dur||1800);
}

function renderHUD(){
  const h=$("#hearts");
  h.innerHTML="";
  for(let i=0;i<3;i++){const s=el("span",i<state.lives?"":"dead","♥");h.appendChild(s);}
  $("#score").textContent=state.score;
  $("#streak").textContent="×"+state.streak;
  $("#streak-box").classList.toggle("hot",state.streak>=3);
  $("#deck-left").textContent="牌堆剩余 "+(state.deck.length+(state.phase==="insert"?1:0))+" / "+EVENTS.length;
}

function drawCard(avoidYears){
  const skipped=[];
  while(state.deck.length){
    const e=state.deck.pop();
    if(!avoidYears.has(e.y)){state.deck=skipped.concat(state.deck);return e;}
    skipped.push(e);
  }
  state.deck=skipped.concat(state.deck);
  return null;
}

function timelineYearSet(){return new Set(state.timeline.map(e=>e.y));}

function cardNode(e,isNew){
  const c=el("div","tl-card"+(isNew?" new":""));
  cardBody(c,e,true);
  return c;
}

function renderTimeline(gapsClickable,wrongPick,rightPick,newIdx){
  const rp=Array.isArray(rightPick)?rightPick:null;
  const hit=i=>rp?(i>=rp[0]&&i<=rp[1]):i===rightPick;
  const box=$("#tl-scroll");
  box.innerHTML="";
  state.timeline.forEach((e,i)=>{
    if(gapsClickable){
      const g=el("button","gap","＋");
      g.dataset.i=i;
      if(i===wrongPick)g.classList.add("wrong-pick");
      if(hit(i))g.classList.add("right-pick");
      g.onclick=()=>{if(!state.lock)onGapClick(i);};
      box.appendChild(g);
    }
    box.appendChild(cardNode(e,i===newIdx));
  });
  if(gapsClickable){
    const g=el("button","gap","＋");
    g.dataset.i=state.timeline.length;
    if(state.timeline.length===wrongPick)g.classList.add("wrong-pick");
    if(hit(state.timeline.length))g.classList.add("right-pick");
    g.onclick=()=>{if(!state.lock)onGapClick(state.timeline.length);};
    box.appendChild(g);
  }
}

function startGame(){
  state={deck:shuffle(EVENTS),timeline:[],lives:3,score:0,streak:0,bestStreak:0,rounds:0,correct:0,lock:false,pending:null,phase:"compare"};
  show("screen-game");
  renderHUD();
  nextCompare();
}

function nextCompare(){
  const a=drawCard(new Set());
  if(!a)return gameOver(true);
  const aside=[];
  let b=null;
  for(;;){
    const c=drawCard(new Set());
    if(!c)break;
    if(definitelyOrdered(a,c)){b=c;break;}
    aside.push(c);
  }
  state.deck=aside.concat(state.deck);
  if(!b){state.deck.push(a);return gameOver(true);}
  state.phase="compare";
  state.pending=[a,b];
  renderHUD();
  $("#prompt").textContent="哪个事件发生得更早？点选它";
  $("#pending-wrap").innerHTML="";
  const box=$("#choices");
  box.innerHTML="";
  const early=hiKey(a)<loKey(b)?a:b;
  [a,b].forEach(e=>{
    const c=el("button","choice");
    cardBody(c,e,false);
    c.onclick=()=>{if(!state.lock)onComparePick(e===early,c);};
    box.appendChild(c);
  });
  renderTimeline(false);
}

function onComparePick(ok){
  const [a,b]=state.pending;
  const early=hiKey(a)<loKey(b)?a:b;
  const other=early===a?b:a;
  state.lock=true;
  state.rounds++;
  if(ok){
    state.streak++;state.bestStreak=Math.max(state.bestStreak,state.streak);
    const gain=100+Math.min(state.streak-1,10)*20;
    state.score+=gain;state.correct++;
    state.timeline=[early,other];
    renderHUD();
    $("#choices").innerHTML="";
    renderTimeline(false,-1,null,0);
    toast("正确！<b>"+fmtDate(early)+"</b>「"+early.t+"」更早　<b>+"+gain+"</b>","good",1400);
    setTimeout(()=>{state.lock=false;nextInsert();},1400);
  }else{
    state.lives--;state.streak=0;
    state.timeline=[early,other];
    renderHUD();
    $("#choices").innerHTML="";
    renderTimeline(false,-1,null,0);
    toast("错了！「"+early.t+"」发生于 <b>"+fmtDate(early)+"</b>，早于「"+other.t+"」（"+fmtDate(other)+"）","bad",2300);
    setTimeout(()=>{state.lock=false;if(state.lives<=0)gameOver(false);else nextInsert();},2300);
  }
}

function nextInsert(){
  const e=drawCard(new Set());
  if(!e)return gameOver(true);
  state.phase="insert";
  state.pending=e;
  renderHUD();
  $("#prompt").textContent="将新事件插入时间轴的正确位置（点击「＋」空隙）";
  const pw=$("#pending-wrap");
  pw.innerHTML="";
  pw.appendChild(el("div","tag","待 插 入 事 件"));
  const card=el("div","","");
  card.id="pending-card";
  cardBody(card,e,false);
  pw.appendChild(card);
  $("#choices").innerHTML="";
  renderTimeline(true);
}

function onGapClick(i){
  const e=state.pending;
  const eLo=loKey(e),eHi=hiKey(e);
  const lo=state.timeline.filter(t=>hiKey(t)<eLo).length;
  const hi=state.timeline.length-state.timeline.filter(t=>loKey(t)>eHi).length;
  const ok=i>=lo&&i<=hi;
  state.lock=true;
  state.rounds++;
  if(ok){
    state.streak++;state.bestStreak=Math.max(state.bestStreak,state.streak);
    const gain=100+Math.min(state.streak-1,10)*20;
    state.score+=gain;state.correct++;
    state.timeline.splice(i,0,e);
    $("#pending-wrap").innerHTML="";
    renderHUD();
    renderTimeline(false,-1,null,i);
    const nc=$("#tl-scroll").querySelector(".tl-card.new");
    if(nc)nc.scrollIntoView({behavior:"smooth",inline:"center",block:"nearest"});
    toast("正确！<b>"+fmtDate(e)+"</b>　<b>+"+gain+"</b>","good",1200);
    setTimeout(()=>{state.lock=false;nextInsert();},1200);
  }else{
    state.lives--;state.streak=0;
    renderHUD();
    renderTimeline(true,i,[lo,hi]);
    const L=lo>0?"「"+state.timeline[lo-1].t+"」之后":"时间轴最前";
    const R=hi<state.timeline.length?"「"+state.timeline[hi].t+"」之前":"时间轴最后";
    const where=lo===hi?("应插在"+L+"、"+R):("可插在"+L+"到"+R+"之间任意空隙（时间不明的事件两侧皆可）");
    toast("错了！「"+e.t+"」发生于 <b>"+fmtDate(e)+"</b>，"+where,"bad",2600);
    setTimeout(()=>{
      state.timeline.splice(lo,0,e);
      $("#pending-wrap").innerHTML="";
      renderTimeline(false,-1,null,lo);
      const nc=$("#tl-scroll").querySelector(".tl-card.new");
      if(nc)nc.scrollIntoView({behavior:"smooth",inline:"center",block:"nearest"});
      setTimeout(()=>{state.lock=false;if(state.lives<=0)gameOver(false);else nextInsert();},700);
    },1900);
  }
}

function gameOver(win){
  let best=0;
  try{
    best=parseInt(localStorage.getItem(bestKey())||"0",10);
    if(state&&state.score>best){best=state.score;localStorage.setItem(bestKey(),String(best));}
  }catch(err){}
  $("#over-title").textContent=win?"通 关 ！":"游 戏 结 束";
  $("#over-title").style.color=win?"#69c47d":"#d8563f";
  $("#over-sub").textContent=win?"你排尽了整个牌堆，历史在你手中纤毫毕现":(state.lives<=0?"三次失误，断案需再慎思":"");
  const stats=[["最终得分",state.score],["答对轮数",state.correct+" / "+state.rounds],["最高连击","×"+state.bestStreak],["时间轴长度",state.timeline.length+" 件"],["历史最高",best]];
  const sb=$("#stats");
  sb.innerHTML="";
  stats.forEach(s=>{
    const b=el("div","stat-box");
    b.appendChild(el("div","num",String(s[1])));
    b.appendChild(el("div","lbl",s[0]));
    sb.appendChild(b);
  });
  const rv=$("#review");
  rv.innerHTML="";
  state.timeline.slice().sort((x,y)=>loKey(x)-loKey(y)).forEach(e=>{
    rv.appendChild(el("div","",'<span class="ry">'+fmtDate(e)+'</span>'+e.t));
  });
  show("screen-over");
}

function refreshBestLine(){
  let best=0;
  try{best=parseInt(localStorage.getItem(bestKey())||"0",10);}catch(err){}
  $("#best-line").textContent=best>0?"历史最高分："+best:"";
}

$("#btn-start").onclick=startGame;
$("#btn-restart").onclick=startGame;
refreshBestLine();
