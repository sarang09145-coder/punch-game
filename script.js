/**
 * PUNCH LAB — 순수 HTML/CSS/JavaScript 웹게임
 * 본인의 캐릭터 이미지는 characters/beoreok.png, abang.png, flat.png 에 넣으세요.
 * PNG가 없으면 기본 SVG 예시 그림을 자동으로 사용합니다.
 */

const CHARACTERS = {
  beoreok: {
    name: '버럭씨', number: '01', tag: '참을성 0%', emoji: '💢',
    responses: ['갑자기 왜 때려!', '장난하냐!'],
    intro: '어디 한번 해보시지!', impact: '퍽!', emotion: 'angry'
  },
  abang: {
    name: '아방이', number: '02', tag: '울보 모드', emoji: '💧',
    responses: ['왜 그래...', '아파....'],
    intro: '나... 왜 불렀어?', impact: '콩!', emotion: 'sad'
  },
  flat: {
    name: '평평이', number: '03', tag: '무덤덤 만렙', emoji: '😐',
    responses: ['으악!', '으악, 으악!'],
    intro: '......', impact: '퐁!', emotion: 'flat'
  }
};

const DIRECTIONS = {
  left: '왼쪽 뺨', front: '정면', right: '오른쪽 뺨'
};

const STORAGE_KEY = 'punch-lab-scores-v1';
const $ = selector => document.querySelector(selector);
const $$ = selector => Array.from(document.querySelectorAll(selector));

function loadScores() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved || typeof saved !== 'object') throw Error('empty');
    const counts = {};
    for (const id of Object.keys(CHARACTERS)) {
      counts[id] = Number.isSafeInteger(saved.counts?.[id]) && saved.counts[id] >= 0
        ? saved.counts[id] : 0;
    }
    return counts;
  } catch {
    return { beoreok: 0, abang: 0, flat: 0 };
  }
}

const state = {
  selected: 'beoreok',
  counts: loadScores(),
  history: [],
  sound: false,
  animationTimer: null,
  imageRequestId: 0,
  lastResponseIndex: { beoreok: -1, abang: -1, flat: -1 }
};

const ui = {
  arena: $('#arena'),
  portrait: $('#character-portrait'),
  effect: $('#effect-layer'),
  bubble: $('#speech-bubble'),
  characterName: $('#character-name'),
  characterTag: $('#character-tag'),
  number: $('#character-number'),
  total: $('#total-count'),
  selectedName: $('#selected-stat-name'),
  selectedEmoji: $('#selected-stat-emoji'),
  selectedCount: $('#character-count'),
  log: $('#reaction-log'),
  sound: $('#sound-switch'),
  reset: $('#reset-button')
};

function assetPaths(id) {
  return {
    png: `characters/${id}.png`,
    svg: `characters/${id}.svg`
  };
}

// 이미지 파일이 있으면 사용자 PNG 적용, 없으면 기본 그림 사용
function upgradeImageIfAvailable(imgElement, id, requestId = null) {
  const { png } = assetPaths(id);
  const trial = new Image();
  trial.onload = () => {
    if (requestId !== null && requestId !== state.imageRequestId) return;
    imgElement.src = png;
  };
  trial.onerror = () => {}; // PNG가 없어도 정상 작동
  trial.src = png;
}

function refreshScores() {
  const total = Object.values(state.counts).reduce((a, b) => a + b, 0);
  ui.total.textContent = total.toLocaleString('ko-KR');
  ui.selectedCount.textContent = state.counts[state.selected].toLocaleString('ko-KR');
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ counts: state.counts })); } catch { /* private mode */ }
}

function selectCharacter(id) {
  if (!Object.hasOwn(CHARACTERS, id)) return;
  const ch = CHARACTERS[id];
  state.selected = id;
  state.imageRequestId += 1;
  const requestId = state.imageRequestId;

  $$('.character-option').forEach(button => {
    const active = button.dataset.character === id;
    button.classList.toggle('is-selected', active);
    button.setAttribute('aria-pressed', String(active));
  });

  ui.arena.dataset.character = id;
  ui.arena.classList.remove('hit-left', 'hit-front', 'hit-right');
  ui.effect.replaceChildren();
  ui.portrait.src = assetPaths(id).svg;
  ui.portrait.alt = `현재 선택한 캐릭터 ${ch.name}`;
  upgradeImageIfAvailable(ui.portrait, id, requestId);
  ui.characterName.textContent = ch.name;
  ui.characterTag.textContent = ch.tag;
  ui.number.textContent = ch.number;
  ui.selectedName.textContent = ch.name;
  ui.selectedEmoji.textContent = ch.emoji;
  setSpeech(ch.intro, false);
  refreshScores();
}

function setSpeech(text, animate = true) {
  ui.bubble.textContent = text;
  ui.bubble.classList.remove('pop');
  if (animate) {
    void ui.bubble.offsetWidth;
    ui.bubble.classList.add('pop');
  }
}

function nextResponse(id) {
  const lines = CHARACTERS[id].responses;
  // 동일한 대사가 바로 연속되지 않도록 순서대로 번갈아 재생
  state.lastResponseIndex[id] = (state.lastResponseIndex[id] + 1) % lines.length;
  return lines[state.lastResponseIndex[id]];
}

function makeEffect(className, text) {
  const el = document.createElement('span');
  el.className = className;
  el.textContent = text;
  ui.effect.appendChild(el);
}

function triggerAnimation(id, direction) {
  const ch = CHARACTERS[id];
  if (state.animationTimer !== null) clearTimeout(state.animationTimer);
  ui.effect.replaceChildren();
  ui.arena.classList.remove('hit-left', 'hit-front', 'hit-right');
  void ui.arena.offsetWidth; // 연타해도 흔들림 애니메이션을 다시 시작
  ui.arena.classList.add(`hit-${direction}`);

  makeEffect(`fist fist--${direction}`, '👊');
  makeEffect(`impact-text impact-text--${direction}`, ch.impact);
  if (ch.emotion === 'angry') makeEffect('effect-emote', '💢');
  if (ch.emotion === 'sad') {
    makeEffect('tear tear--left', '💧');
    makeEffect('tear tear--right', '💧');
  }
  if (ch.emotion === 'flat') makeEffect('effect-emote effect-emote--flat', '〰️');

  state.animationTimer = setTimeout(() => {
    ui.arena.classList.remove('hit-left', 'hit-front', 'hit-right');
    ui.effect.replaceChildren();
    state.animationTimer = null;
  }, 1000);
}

let audioContext;
function playArcadeSound() {
  if (!state.sound) return;
  try {
    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextCtor) return;
    audioContext ??= new AudioContextCtor();
    if (audioContext.state === 'suspended') audioContext.resume();
    const t = audioContext.currentTime;
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(155, t);
    osc.frequency.exponentialRampToValueAtTime(65, t + 0.11);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.08, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.13);
    osc.connect(gain).connect(audioContext.destination);
    osc.start(t);
    osc.stop(t + 0.14);
  } catch { /* 사운드가 금지된 환경에서는 무음 */ }
}

function renderLog() {
  ui.log.replaceChildren();
  if (state.history.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'empty-log';
    empty.textContent = '아직 아무 일도 없어요. 👀';
    ui.log.appendChild(empty);
    return;
  }
  state.history.slice(0, 5).forEach(item => {
    const li = document.createElement('li');
    const line = document.createElement('span');
    line.className = 'log-quote';
    line.textContent = `${item.name} · “${item.response}”`;
    const direction = document.createElement('span');
    direction.className = 'direction';
    direction.textContent = DIRECTIONS[item.direction];
    li.append(line, direction);
    ui.log.appendChild(li);
  });
}

function punch(direction) {
  if (!Object.hasOwn(DIRECTIONS, direction)) return;
  const id = state.selected;
  const ch = CHARACTERS[id];
  const response = nextResponse(id);
  state.counts[id] += 1;
  state.history.unshift({ name: ch.name, direction, response });
  if (state.history.length > 5) state.history.length = 5;
  setSpeech(response);
  triggerAnimation(id, direction);
  playArcadeSound();
  refreshScores();
  renderLog();
}

$$('[data-character]').filter(b => b.matches('button')).forEach(button => {
  button.addEventListener('click', () => selectCharacter(button.dataset.character));
});
$$('[data-direction]').forEach(button => {
  button.addEventListener('click', () => punch(button.dataset.direction));
});
document.addEventListener('keydown', event => {
  if (event.altKey || event.ctrlKey || event.metaKey || event.repeat) return;
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;
  const direction = { a: 'left', s: 'front', d: 'right' }[event.key.toLowerCase()];
  if (direction) { event.preventDefault(); punch(direction); }
});
ui.sound.addEventListener('change', () => { state.sound = ui.sound.checked; });
ui.reset.addEventListener('click', () => {
  state.counts = { beoreok: 0, abang: 0, flat: 0 };
  state.history = [];
  state.lastResponseIndex = { beoreok: -1, abang: -1, flat: -1 };
  setSpeech('기록을 싹 지웠어요!');
  if (state.animationTimer !== null) clearTimeout(state.animationTimer);
  state.animationTimer = null;
  ui.arena.classList.remove('hit-left', 'hit-front', 'hit-right');
  ui.effect.replaceChildren();
  refreshScores();
  renderLog();
});

// 각 캐릭터 카드도 PNG 업로드 시 자동 변경
$$('.character-option').forEach(button => {
  const id = button.dataset.character;
  const img = button.querySelector('img');
  upgradeImageIfAvailable(img, id);
});
selectCharacter('beoreok');
renderLog();
