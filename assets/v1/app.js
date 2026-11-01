/* =========================================================
   CATGame_GEN v0.2.0 — 画面（9ステップ＋役割バー）
   1画面1つのこと／わからないで進める／戻れる／途中保存（catgame.v1）
   ========================================================= */
(function(){
'use strict';
const $ = s => document.querySelector(s);
const app = $('#app'), railEl = $('#rail'), toastEl = $('#toast');
const KEY = 'catgame.v1';

const STEPS = [
  {id:'intro',   n:'00', t:'はじめる',    role:'しきり役'},
  {id:'profile', n:'01', t:'ネコのこと',  role:'記録役'},
  {id:'purpose', n:'02', t:'ねらい',      role:'しきり役'},
  {id:'action',  n:'03', t:'てだて',      role:'てだて役'},
  {id:'cons',    n:'04', t:'しばり',      role:'しばり役'},
  {id:'check',   n:'05', t:'点検',        role:'全員'},
  {id:'plan',    n:'06', t:'ゲーム案',    role:'記録役'},
  {id:'out',     n:'07', t:'出力',        role:'記録役'},
  {id:'group',   n:'08', t:'グループ',    role:'しきり役'}
];

function fresh(){
  return {step:'intro', tab:'plan', title:'',
    roles:{shikiri:'', kiroku:'', tedate:'', shibari:''},
    profile:{good:[], bad:[], feat:[], target:[], other:''},
    purpose:'', persona:'', action:'', coat:'shima',
    cons:[], agree:{}, retro:{}};
}
let state = fresh();

function save(){ try{ localStorage.setItem(KEY, JSON.stringify(state)); }catch(e){} }
function load(){
  try{
    const raw = localStorage.getItem(KEY);
    if(raw){ const o = JSON.parse(raw); if(o && o.step){ state = Object.assign(fresh(), o); } }
  }catch(e){}
}

/* ---------------- 小道具 ---------------- */
const esc = s => String(s==null?'':s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function toast(msg){ if(!toastEl) return; toastEl.textContent = msg; toastEl.classList.add('on');
  clearTimeout(toast._t); toast._t = setTimeout(()=>toastEl.classList.remove('on'), 1600); }
function copyText(text, btn){
  const done = ()=>{ toast('コピーしました'); if(btn){ const t=btn.textContent; btn.textContent='コピー済み'; setTimeout(()=>btn.textContent=t, 1300);} };
  if(navigator.clipboard && navigator.clipboard.writeText){ navigator.clipboard.writeText(text).then(done).catch(()=>fb()); }
  else fb();
  function fb(){ const ta=document.createElement('textarea'); ta.value=text; ta.style.position='fixed'; ta.style.left='-9999px';
    document.body.appendChild(ta); ta.select(); try{ document.execCommand('copy'); done(); }catch(e){ toast('コピーできませんでした'); } document.body.removeChild(ta); }
}
const id = () => 'ct' + Math.floor((function(){ let h=0; for(let i=0;i<8;i++){ h = (h*31 + new Date().getMilliseconds() + i) % 1e9; } return h; })());

/* ---------------- 役割バー ---------------- */
function renderRolebar(){
  const el = $('#rolebar');
  const st = STEPS.find(s=>s.id===state.step) || STEPS[0];
  const r = state.roles;
  el.innerHTML = '<div class="rolebar-in">いま誰の番: <b>' + esc(st.role) + '</b>'
    + '｜しきり役: ' + esc(r.shikiri || '未入力')
    + '｜記録役: ' + esc(r.kiroku || '未入力')
    + '｜てだて役: ' + esc(r.tedate || '未入力')
    + '｜しばり役: ' + esc(r.shibari || '未入力') + '</div>';
}

/* ---------------- レール ---------------- */
function renderRail(){
  const idx = STEPS.findIndex(s=>s.id===state.step);
  railEl.innerHTML = STEPS.map((s,i)=>{
    const locked = (s.id==='out') && !state.action;
    const cls = [s.id===state.step?'on':'', i<idx?'done':''].join(' ').trim();
    return '<button type="button" class="'+cls+'" data-go="'+s.id+'" '+(locked?'disabled':'')+'>'
      + '<span class="n">'+s.n+'</span><span>'+esc(s.t)+'</span></button>';
  }).join('');
}

/* ---------------- 共通部品 ---------------- */
function chips(arr, key, multi){
  return '<div class="chips">' + arr.map(o=>{
    const cur = multi ? state.profile[key] : null;
    const on = multi ? cur.indexOf(o.id)>=0 : state[key]===o.id;
    return '<button type="button" class="chip'+(on?' on':'')+'" data-pick="'+key+'" data-id="'+o.id+'" data-multi="'+(multi?1:0)+'">'+esc(o.label)+'</button>';
  }).join('') + '</div>';
}
function agreeBlock(key, label){
  const a = state.agree[key] || {agree:true, reason:''};
  return '<div class="agree"><label><input type="checkbox" data-agree="'+key+'" '+(a.agree?'checked':'')+'>この案に反対の人はいますか（反対がなければチェックのまま）</label>'
    + (!a.agree ? '<input type="text" data-agreereason="'+key+'" placeholder="反対の理由を1行だけ（あとで振り返りに使います）" value="'+esc(a.reason||'')+'">' : '')
    + '<div style="margin-top:4px">'+esc(label||'')+'</div></div>';
}
function nav(prev, next, nextLabel){
  return '<div class="nav">'
    + (prev ? '<button type="button" class="btn ghost" data-go="'+prev+'">← 戻る</button>' : '<span></span>')
    + (next ? '<button type="button" class="btn" data-go="'+next+'">'+esc(nextLabel||'次へ →')+'</button>' : '')
    + '</div>';
}
function catCanvas(pose, coat){
  return '<canvas class="preview" width="180" height="200" data-catpose="'+pose+'" data-coat="'+(coat||state.coat)+'"></canvas>';
}
function drawPreviews(){
  document.querySelectorAll('canvas[data-catpose]').forEach(cv=>{
    const ctx = cv.getContext('2d');
    ctx.clearRect(0,0,cv.width,cv.height);
    CT.drawCat(ctx, cv.width/2, cv.height-14, 44, cv.dataset.catpose, 1, 1, 1, {mode:cv.dataset.coat||'shima'});
  });
}

/* ---------------- 各ステップ ---------------- */
const R = {};

R.intro = () => [
'<section class="card"><div class="eyebrow">STEP 00 / はじめる</div>',
'<h2 class="step">ゲームは「目的・手段・制約」でできている。</h2>',
'<p class="lead">EMS（Ends and Means Structure／手段目的構造）を、グループで1本のネコのゲーム案にまとめます。ツールは案を作って配りません。あなたたちが書いた3つを点検して返します。</p>',
'<div class="lbl">E ＝ Ends（目的）</div><p class="lead" style="margin:0">プレイヤーが欲しい状態を1文で。「◯◯するゲーム」。</p>',
'<div class="lbl">M ＝ Means（手段）</div><p class="lead" style="margin:0">プレイヤーが使える操作。ネコの行動から1つだけ。</p>',
'<div class="lbl">S ＝ Structure（構造）</div><p class="lead" style="margin:0">制約はここに加える刺激。「〜せずに」「〜しながら」。数値で決める。</p>',
'<div class="lbl">点検は3色</div><p class="lead" style="margin:0">あまい（黄）／むり（赤）／ちょうどよい（緑）。点数は出ません。理由を1文つけます。</p>',
'<div class="lbl">役割（4人。人数は可変）</div>',
'<div class="cons-row"><span class="cname">しきり役</span><input type="text" data-role="shikiri" placeholder="なまえ" value="'+esc(state.roles.shikiri)+'"></div>',
'<div class="cons-row"><span class="cname">記録役</span><input type="text" data-role="kiroku" placeholder="なまえ" value="'+esc(state.roles.kiroku)+'"></div>',
'<div class="cons-row"><span class="cname">てだて役</span><input type="text" data-role="tedate" placeholder="なまえ" value="'+esc(state.roles.tedate)+'"></div>',
'<div class="cons-row"><span class="cname">しばり役</span><input type="text" data-role="shibari" placeholder="なまえ" value="'+esc(state.roles.shibari)+'"></div>',
nav(null, 'profile', 'はじめる →')
].join('');

R.profile = () => [
'<section class="card"><div class="eyebrow">STEP 01 / ネコのこと</div>',
'<h2 class="step">ネコを知る（ワークの総意を入れる）</h2>',
'<p class="lead">グループで出し合った内容から、近いものを選びます。足りなければ「その他」に書く。</p>',
'<div class="lbl">ネコが得意なこと（いくつでも）</div>' + chips(CT.CANDS.good, 'good', true),
'<div class="lbl">ネコが苦手なもの（いくつでも）</div>' + chips(CT.CANDS.bad, 'bad', true),
'<div class="lbl">ネコの特徴・かわいいところ（いくつでも）</div>' + chips(CT.CANDS.feat, 'feat', true),
'<div class="lbl">このゲームを買う人（いくつでも）</div>' + chips(CT.CANDS.target, 'target', true),
'<div class="lbl">その他のメモ</div><input type="text" data-profile-other placeholder="グループが出した言葉をそのまま" value="'+esc(state.profile.other)+'">',
nav('intro', 'purpose')
].join('');

R.purpose = () => [
'<section class="card"><div class="eyebrow">STEP 02 / ねらい（目的・E）</div>',
'<h2 class="step">ネコに何をさせたい？</h2>',
'<p class="lead">1文で。わからなければ近いものを選ぶ。</p>',
chips(CT.PURPOSES, 'purpose', false),
'<div class="lbl">ペルソナの課題（この型で書く）</div>',
'<div class="cons-row"><input type="text" data-persona-a placeholder="◯◯したい" value="'+esc((state.persona||'').split('のに')[0]||'')+'"><span class="unit">のに</span></div>',
'<div class="cons-row"><input type="text" data-persona-b placeholder="□□でできない" value="'+esc(((state.persona||'').split('のに')[1]||'').replace('でできない',''))+'"><span class="unit">でできない</span></div>',
agreeBlock('purpose', 'ねらいは しきり役 がまとめて全員に確認'),
nav('profile', 'action')
].join('');

R.action = () => [
'<section class="card"><div class="eyebrow">STEP 03 / てだて（手段・M）</div>',
'<h2 class="step">ネコの行動を1つ選ぶ（操作は1つだけ）</h2>',
'<p class="lead">選ぶと、そのまま操作になる動詞が出ます。</p>',
chips(CT.ACTIONS, 'action', false),
(state.action ? '<div class="oneline">'+esc((CT.ACTIONS.find(a=>a.id===state.action)||{}).verb)+'（' + esc((CT.ACTIONS.find(a=>a.id===state.action)||{}).note) + '）</div>' : ''),
'<div class="lbl">ネコの見た目（柄は3種まで。あとで変わります）</div>',
'<div class="chips">'+['shima','madara','tan'].map(m=>'<button type="button" class="chip'+(state.coat===m?' on':'')+'" data-coat="'+m+'">'+({shima:'しま',madara:'まだら',tan:'単色'}[m])+'</button>').join('')+'</div>',
catCanvas('idle'),
(state.action ? '<p class="lead">'+esc((CT.ACTIONS.find(a=>a.id===state.action)||{}).why)+'</p>' : ''),
agreeBlock('action', '手段は てだて役 が決めて全員に確認'),
nav('purpose', 'cons')
].join('');

R.cons = () => {
  const used = state.cons.map(c=>c.id);
  const rest = CT.CONSTRAINTS.filter(c=>used.indexOf(c.id)<0);
  const rows = state.cons.map((c,i)=>{
    const def = CT.CONSTRAINTS.find(d=>d.id===c.id);
    return '<div class="cons-row"><span class="cname">'+esc(def.label)+'</span>'
      + '<span class="ctpl">'+esc(def.tpl)+'</span>'
      + '<input type="number" data-consnum="'+i+'" value="'+esc(c.num)+'" placeholder="数値">'
      + '<span class="unit">'+esc(def.unit)+'</span>'
      + '<button type="button" class="del" data-consdel="'+i+'">外す</button></div>';
  }).join('');
  return [
'<section class="card"><div class="eyebrow">STEP 04 / しばり（制約・Sに加える刺激）</div>',
'<h2 class="step">目的を邪魔するルールを、数値で決める</h2>',
'<p class="lead">3つまで。数値のない制約は「未記入」として扱い、緑になりません。</p>',
rows + (rest.length ? '<div class="chips">' + rest.map(c=>'<button type="button" class="chip" data-consadd="'+c.id+'">＋ '+esc(c.label)+'</button>').join('') + '</div>' : '<p class="lead">3つ入っています。</p>'),
'<div class="lbl">制約なしで進むこともできます（点検で「あまい」に戻ってきます）</div>',
agreeBlock('cons', 'しばりは しばり役 が決めて全員に確認'),
nav('action', 'check', '点検へ →')
  ].join('');
};

R.check = () => {
  const J = CT.judge(state);
  const W = CT.JUDGE_WORDS[J.color];
  return [
'<section class="card"><div class="eyebrow">STEP 05 / 点検</div>',
'<h2 class="step">EMS点検（点数でなく3色）</h2>',
'<div class="verdict '+J.color+'">'+esc(W.word)+'（'+J.color+'）</div>',
'<p class="reason">'+esc(J.reason)+'</p>',
(J.fixes.length ? '<ul class="fixes">'+J.fixes.map(f=>'<li>'+esc(f)+'</li>').join('')+'</ul>' : ''),
(state.action ? '<div class="oneline">'+esc(CT.goalOf(CT.planOf(state))!=='' ? '':'') + esc((CT.ACTIONS.find(a=>a.id===state.action)||{}).verb)+'</div>' : ''),
'<p class="lead">わからないままでも先に進めます（止まりません）。直したら「もう一度点検」。</p>',
'<div class="nav"><button type="button" class="btn ghost" data-go="cons">← 直す（しばり）</button>'
 + '<button type="button" class="btn ghost" data-go="action">← 直す（てだて）</button>'
 + '<button type="button" class="btn" data-go="plan">ゲーム案へ →</button></div>'
  ].join('');
};

R.plan = () => {
  const P = CT.planOf(state);
  const one = 'ネコが' + (P.action ? P.action.verb : '（手段）') + 'して、'
    + (P.cons.length ? P.cons.map(c=>c.def.tpl.replace('◯◯', String(c.num))).join('、') + '、' : '')
    + CT.goalOf(P) + 'ゲーム。';
  return [
'<section class="card"><div class="eyebrow">STEP 06 / ゲーム案</div>',
'<h2 class="step">1本にまとめる（ここで初めてタイトル）</h2>',
'<div class="oneline">'+esc(one)+'</div>',
'<div class="lbl">タイトル（空なら自動で入ります）</div>',
'<input type="text" data-title placeholder="ネコが〜するゲーム" value="'+esc(state.title)+'">',
'<div class="lbl">今日の学び（EMS）</div>',
'<p class="lead" style="margin:0">ゲームは「目的・手段・制約」の構造でできている。私たちはその3つを自分たちで決めた。</p>',
'<div class="lbl">展開（つくり方の目安）</div>',
'<p class="lead" style="margin:0">'+CT.PHASES.map(p=>esc(p.at+' '+p.name)).join('<br>')+'</p>',
nav('check', 'out', '出力へ →')
  ].join('');
};

R.out = () => {
  const J = CT.judge(state);
  const outs = CT.buildAll(state, J);
  const names = {plan:'企画書', image:'イメージ1枚', assets:'素材シート', web:'Webプロト', unity:'Unity依頼', proposal:'提案書'};
  const tab = state.tab || 'plan';
  return [
'<section class="card"><div class="eyebrow">STEP 07 / 出力</div>',
'<h2 class="step">6種をコピーして、AIに貼る</h2>',
'<p class="lead">Webプロトが授業の到達点。Unity依頼は後日の移植実験用です。字数はそのまま出ます（無料枠に入るかは、貼る側で数えてください）。</p>',
'<div class="outtabs">'+Object.keys(outs).map(k=>'<button type="button" class="chip'+(tab===k?' on':'')+'" data-tab="'+k+'">'+names[k]+'</button>').join('')+'</div>',
'<div class="outmeta">'+esc(names[tab])+' — '+outs[tab].length.toLocaleString()+'字（決定的に組み立てました・乱数なし）</div>',
'<pre class="out">'+esc(outs[tab])+'</pre>',
'<div class="nav"><button type="button" class="btn ghost" data-go="plan">← 戻る</button>'
 + '<button type="button" class="btn" data-copy="'+tab+'">'+esc(names[tab])+'をコピー</button>'
 + '<button type="button" class="btn" data-go="group">グループへ →</button></div>'
  ].join('');
};

R.group = () => {
  const r = state.retro || {};
  return [
'<section class="card"><div class="eyebrow">STEP 08 / グループ（振り返り）</div>',
'<h2 class="step">記録を残す</h2>',
'<div class="lbl">反対が出たところはありましたか（理由つき）</div>',
Object.keys(state.agree||{}).map(k=>{ const a=state.agree[k]; return (!a.agree && a.reason) ? '<p class="lead" style="margin:2px 0">・'+esc(k)+': '+esc(a.reason)+'</p>' : ''; }).join('') || '<p class="lead" style="margin:2px 0">なし</p>',
'<div class="lbl">もう一回を押したくなると思った？</div>',
'<div class="chips">'+['はい','いいえ','わからない'].map(v=>'<button type="button" class="chip'+(r.again===v?' on':'')+'" data-retro="again" data-v="'+v+'">'+v+'</button>').join('')+'</div>',
'<div class="lbl">直せると思った場所</div><input type="text" data-retrotext="why" value="'+esc(r.why||'')+'">',
'<div class="lbl">今日ひとこと（次のグループへ）</div><input type="text" data-retrotext="msg" value="'+esc(r.msg||'')+'">',
'<p class="lead" style="margin-top:14px">記録はこのブラウザに保存されています（キー: catgame.v1）。同じURLで開くと続きから始まります。</p>',
nav('out', null)
  ].join('');
};

/* ---------------- 描画とイベント ---------------- */
function render(){
  const fn = R[state.step] || R.intro;
  app.innerHTML = fn();
  renderRail(); renderRolebar(); drawPreviews(); save();
  app.focus({preventScroll:true});
}

function toggle(key, vid, multi){
  if(multi){
    const arr = state.profile[key];
    const i = arr.indexOf(vid);
    if(i>=0) arr.splice(i,1); else arr.push(vid);
  } else {
    state[key] = (state[key]===vid) ? '' : vid;
  }
}

document.addEventListener('click', e=>{
  const t = e.target.closest('button, input[type=checkbox]');
  if(!t) return;
  if(t.dataset.go !== undefined && t.dataset.go !== ''){ if(t.disabled) return; state.step = t.dataset.go; if(t.dataset.go==='out' && !state.tab) state.tab='plan'; render(); window.scrollTo(0,0); return; }
  if(t.dataset.pick){ toggle(t.dataset.pick, t.dataset.id, t.dataset.multi==='1'); render(); return; }
  if(t.dataset.coat){ state.coat = t.dataset.coat; render(); return; }
  if(t.dataset.consadd){ if(state.cons.length<3){ state.cons.push({id:t.dataset.consadd, num:(CT.CONSTRAINTS.find(c=>c.id===t.dataset.consadd)||{}).num}); } render(); return; }
  if(t.dataset.consdel !== undefined && t.dataset.consdel !== ''){ state.cons.splice(+t.dataset.consdel, 1); render(); return; }
  if(t.dataset.copy){ const J = CT.judge(state); const outs = CT.buildAll(state, J); copyText(outs[t.dataset.copy], t); return; }
  if(t.dataset.retro){ state.retro[t.dataset.retro] = t.dataset.v; render(); return; }
  if(t.dataset.agree !== undefined && t.dataset.agree !== ''){
    const a = state.agree[t.dataset.agree] || {agree:true, reason:''};
    a.agree = t.checked; state.agree[t.dataset.agree] = a; save(); render(); return;
  }
});

document.addEventListener('input', e=>{
  const t = e.target;
  if(t.dataset.role !== undefined){ state.roles[t.dataset.role] = t.value; save(); renderRolebar(); return; }
  if(t.dataset.profileOther !== undefined){ state.profile.other = t.value; save(); return; }
  if(t.dataset.personaA !== undefined){ state.persona = t.value + 'のに' + ((state.persona||'').split('のに')[1]||''); save(); return; }
  if(t.dataset.personaB !== undefined){ state.persona = (state.persona||'').split('のに')[0] + 'のに' + t.value + 'でできない'; save(); return; }
  if(t.dataset.consnum !== undefined){ state.cons[+t.dataset.consnum].num = t.value; save(); return; }
  if(t.dataset.agreereason !== undefined){ const a = state.agree[t.dataset.agreereason] || {agree:false, reason:''}; a.reason = t.value; state.agree[t.dataset.agreereason] = a; save(); return; }
  if(t.dataset.title !== undefined){ state.title = t.value; save(); return; }
  if(t.dataset.retrotext !== undefined){ state.retro[t.dataset.retrotext] = t.value; save(); return; }
});

/* ヘッダ */
function bindHeader(){
  const chip = $('#verChip'), panel = $('#verPanel');
  if(chip && CT.VERSION) chip.textContent = CT.VERSION.tag;
  if(panel && CT.VERSION) panel.innerHTML = '<div class="vp-date">'+esc(CT.VERSION.date)+'</div>';
  const r = $('#btnRestart');
  if(r) r.addEventListener('click', ()=>{ if(window.confirm('最初からやり直しますか？（保存した内容を消します）')){ try{ localStorage.removeItem(KEY); }catch(e){} state = fresh(); render(); } });
  const p = $('#btnPrint');
  if(p) p.addEventListener('click', ()=>window.print());
}

function boot(){ load(); bindHeader(); render(); }
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
