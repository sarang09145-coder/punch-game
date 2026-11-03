/**
 * 정적 웹사이트용 캐릭터 이미지 리액션 게임.
 * 기본 사진은 저장소 루트의 flat.png / beoreok.png / abang.png
 * 반응 사진 9장은 reactions/<캐릭터>-<방향>.webp 에서 불러옵니다.
 */
const CHARACTERS = {
  flat: {name:'평평이',intro:'......',responses:['으악!','으악, 으악!'],impact:'퐁!',emotion:'flat'},
  beoreok: {name:'버럭씨',intro:'왜 불렀는데?',responses:['갑자기 왜 때려!','장난하냐!'],impact:'퍽!',emotion:'angry'},
  abang: {name:'아방이',intro:'나... 왜 불렀어?',responses:['왜 그래...','아파....'],impact:'콩!',emotion:'sad'}
};
const DIRECTIONS = ['left','front','right'];
const REACTION_MS = 1050; // 사진이 유지되는 시간: 1.05초
const stage = document.querySelector('#stage');
const portrait = document.querySelector('#portrait');
const speech = document.querySelector('#speech');
const effects = document.querySelector('#effects');
const characterName = document.querySelector('#character-name');
const soundToggle = document.querySelector('#sound');
let selected = 'beoreok';
let animationTimer = null;
let portraitRequest = 0;
let audioCtx = null;
const responseIndex = {flat:-1, beoreok:-1, abang:-1};

const basePaths = id => [`${id}.png`, `characters/${id}.png`];
const reactionPath = (id,direction) => `${id}-${direction}.webp`;

/** Show first existing image; stale asynchronous image loads may not overwrite a newer choice. */
function setPortrait(paths, token, isReaction=false, idx=0) {
  if (idx >= paths.length) {
    if (token === portraitRequest && isReaction) {
      // If the update was incomplete, keep a valid base photo instead of a broken image.
      setPortrait(basePaths(selected), token, false);
    }
    return;
  }
  const prefetch = new Image();
  prefetch.onload = () => {
    if (token !== portraitRequest) return;
    portrait.src = paths[idx];
    portrait.classList.toggle('is-reaction', isReaction);
    stage.classList.toggle('show-reaction', isReaction);
  };
  prefetch.onerror = () => {
    if (token === portraitRequest) setPortrait(paths,token,isReaction,idx+1);
  };
  prefetch.src = paths[idx];
}

function showBase(id) {
  const token = ++portraitRequest;
  portrait.classList.remove('is-reaction');
  stage.classList.remove('show-reaction');
  setPortrait(basePaths(id),token);
}

// Each small card always shows its base portrait.
for(const img of document.querySelectorAll('.thumb img')) {
  const id=img.closest('[data-character]').dataset.character;
  let index=0;
  const paths=basePaths(id);
  function attempt() {
    if(index>=paths.length) return;
    const trial=new Image();
    trial.onload=()=>{img.src=paths[index];};
    trial.onerror=()=>{index++;attempt();};
    trial.src=paths[index];
  }
  attempt();
}

// Preload so photos can switch immediately when a punch is clicked.
for(const id of Object.keys(CHARACTERS)) {
  for(const direction of DIRECTIONS) {
    const img=new Image();
    img.src=reactionPath(id,direction);
  }
}

function selectCharacter(id) {
  if (!Object.hasOwn(CHARACTERS,id)) return;
  selected=id;
  clearTimeout(animationTimer);
  stage.classList.remove('hit-left','hit-front','hit-right');
  effects.replaceChildren();
  for(const button of document.querySelectorAll('[data-character]')) {
    const active = button.dataset.character===id;
    button.classList.toggle('active',active);
    button.setAttribute('aria-pressed',String(active));
  }
  portrait.alt=CHARACTERS[id].name;
  characterName.textContent=CHARACTERS[id].name;
  say(CHARACTERS[id].intro,false);
  showBase(id);
}

function say(text, animate=true) {
  speech.textContent=text;
  speech.classList.remove('pop');
  if(animate){void speech.offsetWidth; speech.classList.add('pop');}
}
function addEffect(cssClass,text) {
  const el=document.createElement('span');
  el.className=cssClass;
  el.textContent=text;
  effects.appendChild(el);
}
function sound() {
  if(!soundToggle.checked) return;
  try {
    const AC=window.AudioContext||window.webkitAudioContext;
    if(!AC) return;
    audioCtx ??= new AC();
    if(audioCtx.state==='suspended')audioCtx.resume();
    const t=audioCtx.currentTime;
    const osc=audioCtx.createOscillator();
    const gain=audioCtx.createGain();
    osc.type='triangle';
    osc.frequency.setValueAtTime(140,t);
    osc.frequency.exponentialRampToValueAtTime(62,t+.12);
    gain.gain.setValueAtTime(.0001,t);
    gain.gain.exponentialRampToValueAtTime(.065,t+.01);
    gain.gain.exponentialRampToValueAtTime(.0001,t+.14);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(t); osc.stop(t+.15);
  } catch(_) { /* Play without sound when the browser blocks audio. */ }
}
function punch(direction) {
  if(!DIRECTIONS.includes(direction)) return;
  const id=selected;
  const character=CHARACTERS[id];
  responseIndex[id] = (responseIndex[id]+1)%character.responses.length;
  say(character.responses[responseIndex[id]]);
  clearTimeout(animationTimer);
  effects.replaceChildren();
  stage.classList.remove('hit-left','hit-front','hit-right');
  void stage.offsetWidth;
  stage.classList.add('hit-'+direction);

  // Switch to the exact matching photo (full frontal / left / right).
  const token=++portraitRequest;
  setPortrait([reactionPath(id,direction)],token,true);

  // Photos already contain the incoming hand; don't draw a second cartoon fist.
  if(character.emotion==='angry') addEffect('emote','💢');
  if(character.emotion==='sad') {
    addEffect('tear left','💧');
    addEffect('tear right','💧');
  }
  sound();

  animationTimer=setTimeout(()=>{
    // Character may have changed or another punch may have started.
    if(selected!==id||token!==portraitRequest) return;
    effects.replaceChildren();
    stage.classList.remove('hit-left','hit-front','hit-right');
    showBase(id);
  },REACTION_MS);
}

for(const button of document.querySelectorAll('[data-character]'))
  button.addEventListener('click',()=>selectCharacter(button.dataset.character));
for(const button of document.querySelectorAll('[data-punch]'))
  button.addEventListener('click',()=>punch(button.dataset.punch));

document.addEventListener('keydown',e=>{
  if(e.altKey||e.ctrlKey||e.metaKey||e.repeat)return;
  if(['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName))return;
  const direction={a:'left',s:'front',d:'right'}[e.key.toLowerCase()];
  if(direction){e.preventDefault();punch(direction);}
});
selectCharacter(selected);
