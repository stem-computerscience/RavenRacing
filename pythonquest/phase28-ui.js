/* Python Quest Phase 28 progressive enhancement.
   Adds UI without replacing the existing Python runner, API, auth, or club features. */
(()=>{"use strict";
const $=id=>document.getElementById(id);
const game=$("game"),layout=document.querySelector(".play-layout"),editor=document.querySelector(".editor-panel");
if(!game||!layout||!editor)return;
const style=document.createElement("style");style.textContent=`
#pqNav{display:flex;flex-wrap:wrap;gap:.4rem;margin:.65rem 0}
#pqNav button{padding:.45rem .65rem}
#pqReference{position:absolute;right:.7rem;top:3rem;width:min(20rem,85%);max-height:65%;overflow:auto;z-index:9;background:#1b3046;border:2px solid #68b9d0;border-radius:.7rem;padding:1rem;box-shadow:0 10px 28px #0009;color:#eef7ff}
.editor-panel{position:relative;min-width:0}
#pqReference pre{white-space:pre-wrap;background:#101a2a;padding:.7rem;border-radius:.4rem}
#pqJournalOverlay{position:fixed;inset:0;z-index:1000;background:#02070dc9;display:grid;place-items:center;padding:1rem}
#pqJournalOverlay[hidden],#pqReference[hidden]{display:none}
#pqJournalModal{width:min(1100px,96vw);max-height:92vh;overflow:auto;border:3px solid #c7a367;border-radius:1rem;background:#f0e3c5;color:#2e281f;padding:1rem}
[data-world="space"] #pqJournalModal{background:#152c40;color:#f0f8ff;border-color:#4bc9e1}
.pq-head{display:flex;justify-content:space-between;align-items:center;gap:1rem}
.pq-review{display:grid;grid-template-columns:minmax(135px,23%) minmax(0,1fr);gap:1rem}
.pq-recent{display:flex;flex-direction:column;gap:.45rem}
.pq-recent button{text-align:left}
.pq-recent button[aria-current="true"]{outline:3px solid #61b996}
.pq-code-pair{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.6rem}
.pq-code{background:#101a29;color:#e1edfc;border-radius:.5rem;padding:.6rem;min-width:0}
.pq-code pre{overflow:auto;max-height:270px;white-space:pre;font:12px/1.55 monospace}
.pq-code .changed{display:block;background:#254a3b;color:#e5ffed}
.pq-code .normal{display:block}
.pq-small{font-size:.85rem;opacity:.85}
#pqInstructionDetails{margin:.5rem 0}
#pqInstructionDetails summary{cursor:pointer}
#pqSuccess{background:#1a4638;color:#edfff4;border:1px solid #6ac49d;border-radius:.6rem;padding:.7rem;margin:.6rem 0}
#pqSuccess[hidden]{display:none}
#pqHintHistory{font-size:.9rem}
#pqHintHistory[hidden]{display:none}
#pqHintHistory p{background:#413a26;color:#ffe8a7;padding:.5rem;border-radius:.4rem}
#output{resize:vertical;overflow:auto;min-height:5rem}
#run{font-weight:800;padding:.75rem 1.2rem}
@media(min-width:850px){.play-layout{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);align-items:start;gap:.75rem}}
@media(max-width:700px){.pq-review,.pq-code-pair{grid-template-columns:1fr}}
`;document.head.append(style);
const nav=document.createElement("nav");nav.id="pqNav";nav.setAttribute("aria-label","Adventure navigation");
const panels=["Map","Quests","Character","Inventory","Badges","Journal","Progress"];
panels.forEach(name=>{const b=document.createElement("button");b.type="button";b.textContent=name;b.addEventListener("click",()=>openPanel(name));nav.append(b)});
const hud=document.querySelector(".hud");(hud||layout).before(nav);
const details=document.createElement("details");details.id="pqInstructionDetails";details.open=true;const summary=document.createElement("summary");summary.textContent="Challenge instructions";details.append(summary);const lesson=$("lesson");if(lesson){lesson.before(details);details.append(lesson)}
const ref=document.createElement("aside");ref.id="pqReference";ref.hidden=true;ref.setAttribute("aria-label","Python quick reference");ref.innerHTML='<button type="button" id="pqRefClose" style="float:right">Close</button><h3>Python Quick Reference</h3><label>Topic <select id="pqRefTopic"><option value="variables">Variables</option><option value="printing">Printing</option><option value="conditions">Conditions</option><option value="loops">Loops</option></select></label><p id="pqRefDesc"></p><pre id="pqRefCode"></pre>';
editor.append(ref);
const refButton=document.createElement("button");refButton.type="button";refButton.textContent="Python Reference";$("hint").after(refButton);
const refs={variables:["Store information using names.",'password = "OPEN"\nscore = 10'],printing:["Display text or a value.",'print("Hello")\nprint(password)'],conditions:["Choose what happens using if.",'if score >= 10:\n    print("Ready")'],loops:["Repeat code using for.",'for i in range(3):\n    print(i)']};
function updateRef(){const r=refs[$("pqRefTopic").value];$("pqRefDesc").textContent=r[0];$("pqRefCode").textContent=r[1]}
$("pqRefTopic").addEventListener("change",updateRef);updateRef();
refButton.onclick=()=>ref.hidden=!ref.hidden;$("pqRefClose").onclick=()=>ref.hidden=true;
const originalReset=$("reset");if(originalReset){originalReset.addEventListener("click",e=>{if(!window.confirm("Reset your code? Your current edits may be replaced.")){e.stopImmediatePropagation();e.preventDefault()}},true)}
const hintHistory=document.createElement("div");hintHistory.id="pqHintHistory";hintHistory.hidden=true;const hintText=$("hintText");if(hintText)hintText.after(hintHistory);
const hintSeen=new Set();if(hintText){new MutationObserver(()=>{if(hintText.hidden||!hintText.textContent.trim())return;const value=hintText.textContent.trim();if(hintSeen.has(value))return;hintSeen.add(value);const p=document.createElement("p");p.textContent=value;hintHistory.append(p);hintHistory.hidden=false}).observe(hintText,{childList:true,characterData:true,subtree:true,attributes:true,attributeFilter:["hidden"]})}
const success=document.createElement("div");success.id="pqSuccess";success.hidden=true;success.innerHTML='<strong>Challenge Complete!</strong><p>Python skill progress · See Progress for details.</p><button type="button" id="pqContinue">Continue Exploring</button>';const output=$("output");if(output)output.after(success);
$("pqContinue").onclick=()=>{success.hidden=true;ref.hidden=true;const scene=document.querySelector(".scene-panel");scene?.scrollIntoView({behavior:"smooth",block:"nearest"})};
const journal=document.createElement("div");journal.id="pqJournalOverlay";journal.hidden=true;journal.innerHTML='<section id="pqJournalModal" role="dialog" aria-modal="true" aria-label="Quest Journal"><div class="pq-head"><h2 id="pqPanelTitle">Quest Journal</h2><button type="button" id="pqPanelClose">Close ×</button></div><div id="pqPanelBody"></div></section>';document.body.append(journal);$("pqPanelClose").onclick=()=>journal.hidden=true;journal.addEventListener("click",e=>{if(e.target===journal)journal.hidden=true});
function changedLineIndices(before,after){
 const a=before.split("\\n"),b=after.split("\\n");
 // LCS: unchanged lines are aligned even when earlier lines are inserted/deleted.
 // Bound comparison to avoid quadratic work on unusually long submissions.
 if(a.length*b.length>250000){const result=new Set();b.forEach((line,i)=>{if(a[i]!==line)result.add(i)});return result}
 const dp=Array.from({length:a.length+1},()=>new Uint16Array(b.length+1));
 for(let i=a.length-1;i>=0;i--)for(let j=b.length-1;j>=0;j--)dp[i][j]=a[i]===b[j]?1+dp[i+1][j+1]:Math.max(dp[i+1][j],dp[i][j+1]);
 const unchanged=new Set();let i=0,j=0;
 while(i<a.length&&j<b.length){if(a[i]===b[j]){unchanged.add(j);i++;j++}else if(dp[i+1][j]>=dp[i][j+1])i++;else j++}
 return new Set(b.map((_,index)=>index).filter(index=>!unchanged.has(index)))
}
function lines(source,changed){
 const box=document.createElement("pre");
 source.split("\\n").forEach((line,i)=>{const span=document.createElement("span");span.className=changed?.has(i)?"changed":"normal";span.textContent=String(i+1).padStart(2," ")+"  "+line;box.append(span)});
 return box
}
const verifiedAttempts=[];
window.addEventListener("pythonquest:verified-attempt",e=>{
 const d=e.detail||{};if(!d.id||!d.code)return;success.hidden=false;
 const title=d.title||("Chapter "+d.mission);
 const starter=typeof d.starter==="string"?d.starter:"";
 verifiedAttempts.splice(verifiedAttempts.findIndex(item=>item.id===d.id),verifiedAttempts.some(item=>item.id===d.id)?1:0);
 verifiedAttempts.unshift({id:d.id,title,code:d.code,starter,world:d.world,mode:d.mode,mission:d.mission});
 if(verifiedAttempts.length>5)verifiedAttempts.length=5;
});
window.addEventListener("pythonquest:login",()=>{verifiedAttempts.length=0;selectedAttempt=0;journal.hidden=true;ref.hidden=true;success.hidden=true;hintSeen.clear();hintHistory.replaceChildren();hintHistory.hidden=true;$("pqPanelBody").replaceChildren()});
document.querySelectorAll(".logout").forEach(button=>button.addEventListener("click",()=>{verifiedAttempts.length=0;selectedAttempt=0;journal.hidden=true;ref.hidden=true;success.hidden=true;$("pqPanelBody").replaceChildren()},true));
let selectedAttempt=0;
function renderJournal(){
 const root=$("pqPanelBody");root.replaceChildren();
 const summary=$("learningJournal");if(summary){const copy=summary.cloneNode(true);copy.removeAttribute("id");root.append(copy)}
 const heading=document.createElement("h3");heading.textContent="Recent verified challenges";root.append(heading);
 const note=document.createElement("p");note.className="pq-small";
 note.textContent="This session only. Attempts are recorded on the server, but earlier saved code is not yet available to this review panel.";root.append(note);
 if(!verifiedAttempts.length){const p=document.createElement("p");p.textContent="No successful server-recorded challenges in this session yet.";root.append(p);return}
 selectedAttempt=Math.min(selectedAttempt,verifiedAttempts.length-1);
 const grid=document.createElement("div");grid.className="pq-review";
 const list=document.createElement("div");list.className="pq-recent";
 verifiedAttempts.forEach((entry,i)=>{const b=document.createElement("button");b.type="button";b.textContent=entry.title+" · "+entry.world;b.setAttribute("aria-current",String(i===selectedAttempt));b.onclick=()=>{selectedAttempt=i;renderJournal()};list.append(b)});
 grid.append(list);
 const entry=verifiedAttempts[selectedAttempt],review=document.createElement("section");
 const title=document.createElement("h3");title.textContent=entry.title;review.append(title);
 const info=document.createElement("p");info.textContent="Chapter "+entry.mission+" · "+entry.mode+" · server-recorded";review.append(info);
 const pair=document.createElement("div");pair.className="pq-code-pair";
 [["STARTING CODE",entry.starter],["COMPLETED CODE",entry.code]].forEach(([name,source],i)=>{const pane=document.createElement("div");pane.className="pq-code";const label=document.createElement("strong");label.textContent=name;pane.append(label,lines(source,i?changedLineIndices(entry.starter,entry.code):new Set()));pair.append(pane)});review.append(pair);
 const explanation=document.createElement("p");explanation.className="pq-small";explanation.textContent="Original starter code and successful submitted code are shown side by side. Only added or modified lines are highlighted green.";review.append(explanation);
 grid.append(review);root.append(grid)
}
function appendField(root,label,value){
 const p=document.createElement("p");const strong=document.createElement("strong");strong.textContent=label+": ";p.append(strong,document.createTextNode(value||"Not available"));root.append(p)
}
function appendCopy(root,sourceId){
 const source=$(sourceId);if(!source)return false;
 const copy=source.cloneNode(true);copy.removeAttribute("id");
 copy.querySelectorAll("[id]").forEach(node=>node.removeAttribute("id"));
 copy.querySelectorAll("button,input,select,textarea,a").forEach(node=>{node.removeAttribute("href");node.disabled=true;node.setAttribute("aria-disabled","true")});
 root.append(copy);return true
}
function openPanel(name){
 $("pqPanelTitle").textContent=name==="Journal"?"Quest Journal":name;
 journal.hidden=false;
 document.querySelector("#pqJournalModal").style.borderColor=$("world")?.value==="dungeon"?"#c7a367":"#4bc9e1";
 if(name==="Journal"){renderJournal();$("pqPanelClose").focus();return}
 const root=$("pqPanelBody");root.replaceChildren();
 if(name==="Progress"){
  appendField(root,"Current progress",$("progress")?.textContent);
  appendCopy(root,"learningJournal");
 }else if(name==="Quests"){
  appendField(root,"Current quest",$("chapterTitle")?.textContent);
  appendField(root,"Objective",$("objective")?.textContent);
  appendField(root,"Region",$("regionStatus")?.textContent);
  appendField(root,"Quest instructions",$("lesson")?.textContent);
 }else if(name==="Inventory"){
  appendField(root,"Backpack",$("inventory")?.textContent);
 }else if(name==="Character"){
  appendField(root,"Current world",$("world")?.selectedOptions?.[0]?.textContent);
  appendField(root,"Adventure",$("chapterTitle")?.textContent);
  appendField(root,"Coordinates",$("coordinates")?.textContent);
 }else if(name==="Badges"){
  if(!appendCopy(root,"clubRewards"))appendField(root,"Badges","Open My XP, badges, and achievements to view your rewards.");
 }else if(name==="Map"){
  appendField(root,"Location",$("worldTitle")?.textContent);
  appendField(root,"Current objective",$("objective")?.textContent);
  const source=$("scene");if(source){
   const map=source.cloneNode(true);map.removeAttribute("id");
   map.setAttribute("aria-label","Current area map");
   map.style.width="100%";map.style.maxHeight="55vh";
   root.append(map);
  }
  const p=document.createElement("p");p.className="pq-small";p.textContent="Current-area map. Destination fast travel is not yet implemented.";root.append(p);
 }
 $("pqPanelClose").focus()
}
document.addEventListener("keydown",e=>{if(e.key==="Escape"){journal.hidden=true;ref.hidden=true;return}if(/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;if(e.key.toLowerCase()==="j")openPanel("Journal");if(e.key.toLowerCase()==="m")openPanel("Map")});
/* Observe only the existing status, never replace existing run-code or XP logic. */
const chapterHeading=$("chapterTitle");
if(chapterHeading)new MutationObserver(()=>{
 success.hidden=true;hintSeen.clear();hintHistory.replaceChildren();hintHistory.hidden=true;
}).observe(chapterHeading,{childList:true,characterData:true,subtree:true});
})();