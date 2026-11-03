// 이미지 경로: 현재 저장소에 실제로 올라간 최상위 PNG를 우선 사용
const CHARACTERS = {
  flat: {name:'평평이',intro:'......',responses:['으악!','으악, 으악!'],impact:'퐁!',emotion:'flat'},
  beoreok: {name:'버럭이',intro:'왜 불렀는데?',responses:['갑자기 왜 때려!','장난하냐!'],impact:'퍽!',emotion:'angry'},
  abang: {name:'아방이',intro:'나... 왜 불렀어?',responses:['왜 그래...','아파....'],impact:'콩!',emotion:'sad'}
};
const stage=document.querySelector('#stage');
const portrait=document.querySelector('#portrait');
const speech=document.querySelector('#speech');
const effects=document.querySelector('#effects');
const characterName=document.querySelector('#character-name');
const soundToggle=document.querySelector('#sound');
let selected='beoreok';
let animationTimer=null;
let portraitRequest=0;
let audioCtx=null;
const responseIndex={flat:-1,beoreok:-1,abang:-1};

function useFirstImageThatWorks(img, paths, current=0, stillCurrent=()=>true){
  if(current>=paths.length){img.removeAttribute('src');return;}
  const test=new Image();
  test.onload=()=>{if(stillCurrent()) img.src=paths[current];};
  test.onerror=()=>{if(stillCurrent()) useFirstImageThatWorks(img,paths,current+1,stillCurrent);};
  test.src=paths[current];
}
function imagesFor(id){
  return [`${id}.png`,`characters/${id}.png`,`${id}.svg`,`characters/${id}.svg`];
}
// 선택 카드도 같은 실제 사진을 사용
for(const img of document.querySelectorAll('.thumb img')){
  const id=img.closest('[data-character]').dataset.character;
  useFirstImageThatWorks(img,imagesFor(id));
}
function selectCharacter(id){
  if(!Object.hasOwn(CHARACTERS,id))return;
  selected=id;
  const nonce=++portraitRequest;
  for(const button of document.querySelectorAll('[data-character]')){
    const active=button.dataset.character===id;
    button.classList.toggle('active',active);
    button.setAttribute('aria-pressed',String(active));
  }
  stage.classList.remove('hit-left','hit-front','hit-right');
  effects.replaceChildren();
  clearTimeout(animationTimer);
  portrait.alt=CHARACTERS[id].name;
  useFirstImageThatWorks(portrait,imagesFor(id),0,()=>nonce===portraitRequest);
  characterName.textContent=CHARACTERS[id].name;
  say(CHARACTERS[id].intro,false);
}
function say(text,animate=true){
  speech.textContent=text;
  speech.classList.remove('pop');
  if(animate){void speech.offsetWidth;speech.classList.add('pop');}
}
function addEffect(cssClass,text){
  const el=document.createElement('span');
  el.className=cssClass;
  el.textContent=text;
  effects.appendChild(el);
}
function sound(){
  if(!soundToggle.checked)return;
  try{
    const AudioContextClass=window.AudioContext||window.webkitAudioContext;
    if(!AudioContextClass)return;
    audioCtx??=new AudioContextClass();
    if(audioCtx.state==='suspended')audioCtx.resume();
    const now=audioCtx.currentTime;
    const osc=audioCtx.createOscillator();
    const gain=audioCtx.createGain();
    osc.type='triangle';
    osc.frequency.setValueAtTime(140,now);
    osc.frequency.exponentialRampToValueAtTime(62,now+.12);
    gain.gain.setValueAtTime(.0001,now);
    gain.gain.exponentialRampToValueAtTime(.065,now+.01);
    gain.gain.exponentialRampToValueAtTime(.0001,now+.14);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(now);osc.stop(now+.15);
  }catch(_){/* 소리 없이 게임 진행 */}
}
function punch(direction){
  if(!['left','front','right'].includes(direction))return;
  const c=CHARACTERS[selected];
  responseIndex[selected]=(responseIndex[selected]+1)%c.responses.length;
  say(c.responses[responseIndex[selected]]);
  clearTimeout(animationTimer);
  effects.replaceChildren();
  stage.classList.remove('hit-left','hit-front','hit-right');
  void stage.offsetWidth;
  stage.classList.add('hit-'+direction);
  addEffect('fist fist--'+direction,'👊');
  addEffect('impact',c.impact);
  if(c.emotion==='angry')addEffect('emote','💢');
  if(c.emotion==='sad'){addEffect('tear left','💧');addEffect('tear right','💧');}
  sound();
  animationTimer=setTimeout(()=>{
    effects.replaceChildren();
    stage.classList.remove('hit-left','hit-front','hit-right');
  },1050);
}
for(const button of document.querySelectorAll('[data-character]')){
  button.addEventListener('click',()=>selectCharacter(button.dataset.character));
}
for(const button of document.querySelectorAll('[data-punch]')){
  button.addEventListener('click',()=>punch(button.dataset.punch));
}
document.addEventListener('keydown',e=>{
  if(e.altKey||e.ctrlKey||e.metaKey||e.repeat)return;
  if(['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName))return;
  const direction={a:'left',s:'front',d:'right'}[e.key.toLowerCase()];
  if(direction){e.preventDefault();punch(direction);}
});
selectCharacter(selected);
