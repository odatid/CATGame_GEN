/* =========================================================
   CATGame_GEN v0.3.0 — 画面（9ステップ＋役割バー）
   v0.3.0の変更: 出力タブ切替のバグ修正/候補は各3つまで+カテゴリ別その他/
   目的を12カテゴリから選ぶ/手段は中心+サブ+組み立て案3種/
   しばりはおすすめ4案+引き直し+自分で決める/点検にゲーム性チェック4軸/
   ネコの見た目は柄10種/ゲーム案にEMS注釈と具体障害
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
  return {step:'intro', tab:'plan', title:'', subject:'sub_cat', emsConfirmed:false, genreHint:'', pattern:'',
    roles:{shikiri:'', kiroku:'', tedate:'', shibari:''},
    profile:{good:[], bad:[], feat:[], target:[],
             other:{good:'', bad:'', feat:'', target:''}},
    purpose:'', purposeOther:'', persona:'',
    action:'', variant:0, subAction:'', coat:'shima',
    consMode:'pack', packPage:0, packLabel:'', cons:[],
    agree:{}, retro:{}};
}
let state = fresh();

function save(){ try{ localStorage.setItem(KEY, JSON.stringify(state)); }catch(e){} }
function load(){
  try{
    const raw = localStorage.getItem(KEY);
    if(raw){ const o = JSON.parse(raw); if(o && o.step){
      const f = fresh(); state = Object.assign(f, o);
      /* 旧版(v0.7以前)の保存データを正規化する(配列・その他欄・新しい項目) */
      if(!state.profile || typeof state.profile!=='object') state.profile = f.profile;
      ['good','bad','feat','target'].forEach(function(k){
        if(!Array.isArray(state.profile[k])) state.profile[k] = [];
      });
      if(!state.profile.other || typeof state.profile.other!=='object' || Array.isArray(state.profile.other)){
        state.profile.other = {good:'',bad:'',feat:'',target:''};
      }
      if(typeof state.emsConfirmed!=='boolean') state.emsConfirmed = false;
      if(typeof state.genreHint!=='string') state.genreHint = '';
      if(typeof state.pattern!=='string') state.pattern = '';
      if(!Array.isArray(state.cons)) state.cons = [];
      state.cons = state.cons.filter(function(c){ return c && typeof c.id==='string'; });
      if(!state.roles || typeof state.roles!=='object') state.roles = f.roles;
      if(!state.agree || typeof state.agree!=='object') state.agree = {};
      if(!state.retro || typeof state.retro!=='object') state.retro = {};
      /* 古い画面(step)が今の版に無い場合は最初から */
      if(!STEPS.some(function(x){ return x.id===state.step; })) state.step = 'intro';
    } }
  }catch(e){ try{ state = fresh(); }catch(e2){} }
}

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
function renderRail(){
  const idx = STEPS.findIndex(s=>s.id===state.step);
  railEl.innerHTML = STEPS.map((s,i)=>{
    const locked = (s.id==='out') && !state.action;
    const cls = [s.id===state.step?'on':'', i<idx?'done':''].join(' ').trim();
    return '<button type="button" class="'+cls+'" data-go="'+s.id+'" '+(locked?'disabled':'')+'>'
      + '<span class="n">'+s.n+'</span><span>'+esc(s.t)+'</span></button>';
  }).join('');
}

function chips(arr, key, multi){
  return '<div class="chips">' + arr.map(o=>{
    const on = multi ? state.profile[key].indexOf(o.id)>=0 : state[key]===o.id;
    return '<button type="button" class="chip'+(on?' on':'')+'" data-pick="'+key+'" data-id="'+o.id+'" data-multi="'+(multi?1:0)+'">'+esc(o.label)+'</button>';
  }).join('') + '</div>';
}
function otherInput(cat){
  return '<input type="text" data-othcat="'+cat+'" placeholder="その他・自由記入（ここに出したものがいちばん強ければ、選ばなくてよい）" value="'+esc(state.profile.other[cat]||'')+'">';
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
  return '<canvas class="preview" width="140" height="160" data-catpose="'+pose+'" data-coat="'+(coat||state.coat)+'"></canvas>';
}
/* しばりパックの文面（障害の種類で自然な日本語に変わる） */
function badInfo(){
  const id0 = state.profile.bad[0];
  return CT.CANDS.bad.find(x=>x.id===id0) || {label:'掃除機', kind:'move'};
}
function obstPhrase(b){
  if(b.kind==='sound')  return b.label + 'が鳴ったらミスになる';
  if(b.kind==='static') return b.label + 'に触れるとミスになる';
  return b.label + 'が動き回っていて、当たるとミスになる';
}
function packText(p){
  const who = (state.subject==='sub_human') ? 'ネコ' : '飼い主';
  const bs = (state.profile.bad || []).map(id => (CT.CANDS.bad.find(x=>x.id===id) || {})).filter(Boolean);
  const ob  = (bs[0] && bs[0].label) || '掃除機';
  const ob2 = (bs[1] && bs[1].label) || 'カラス';
  const ob3 = (bs[2] && bs[2].label) || '犬';
  const ph = (b) => (b.kind==='sound') ? b.label+'が鳴ったらミス' : (b.kind==='static') ? b.label+'に触れるとミス' : b.label+'が動き回っていて当たるとミス';
  return String(p.text || '')
    .split('{ob}').join(ph(bs[0] || {label:'掃除機',kind:'move'}))
    .split('{ob2}').join(ph(bs[1] || {label:'カラス',kind:'move'}))
    .split('{ob3}').join(ph(bs[2] || {label:'犬',kind:'move'}))
    .split('{who}').join(who);
}
function drawPreviews(){
  document.querySelectorAll('canvas[data-catpose]').forEach(cv=>{
    const ctx = cv.getContext('2d');
    ctx.clearRect(0,0,cv.width,cv.height);
    CT.drawCat(ctx, cv.width/2, cv.height-12, 38, cv.dataset.catpose, 1, 1, 1, cv.dataset.coat);
  });
}

const R = {};

R.intro = () => [
'<section class="card"><div class="eyebrow">STEP 00 / はじめる</div>',
'<h2 class="step">ゲームは「目的・手段・制約」でできている。</h2>',
'<p class="lead">EMS（Ends and Means Structure／手段目的構造）を、グループで1本のネコのゲーム案にまとめます。ツールは案を作って配りません。あなたたちが書いた3つを点検して返します。</p>',
'<div class="lbl">E ＝ Ends（目的）</div><p class="lead" style="margin:0">プレイヤーが欲しい状態を1文で。「◯◯するゲーム」。</p>',
'<div class="lbl">M ＝ Means（手段）</div><p class="lead" style="margin:0">プレイヤーが使える操作。ネコのアクションから中心の1つ（＋サブ1つ）。</p>',
'<div class="lbl">S ＝ Structure（構造）</div><p class="lead" style="margin:0">制約はここに加える刺激。「〜せずに」「〜しながら」。数値で決める。</p>',
'<div class="lbl">点検は ゲーム性チェック ＋ 3色</div><p class="lead" style="margin:0">ユニークさ・ひねり・おかしさ・共感 の4軸と、あまい（黄）／むり（赤）／ちょうどよい（緑）。点数は出ません。理由を1文つけます。</p>',
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
'<p class="lead">各グループ、<b>特に強く出た意見を3つまで</b>選びます。足りなければ「その他」に書く。</p>',
'<div class="lbl">ネコが得意なこと（3つまで）</div>' + chips(CT.CANDS.good, 'good', true) + otherInput('good'),
'<div class="lbl">ネコが苦手なもの（3つまで）</div>' + chips(CT.CANDS.bad, 'bad', true) + otherInput('bad'),
'<div class="lbl">ネコの特徴・かわいいところ（3つまで）</div>' + chips(CT.CANDS.feat, 'feat', true) + otherInput('feat'),
'<div class="lbl">猫のゲームを買う人（3つまで）</div>' + chips(CT.CANDS.target, 'target', true) + otherInput('target'),
nav('intro', 'purpose')
].join('');

R.purpose = () => {
  const human = state.subject==='sub_human';
  const groups = human ? CT.PURPOSE_GROUPS_HUMAN : CT.PURPOSE_GROUPS;
  return [
'<section class="card"><div class="eyebrow">STEP 02 / ねらい（目的・E）</div>',
'<h2 class="step">作りたいゲームはどれ？</h2>',
'<div class="lbl">誰を操作する？（グループの案の中心に寄せる・切り替えると選び直しになります）</div>',
'<div class="chips">' + CT.SUBJECTS.map(s=>'<button type="button" class="chip'+((human?(s.id==='sub_human'):(s.id==='sub_cat'))?' on':'')+'" data-subject="'+s.id+'">'+esc(s.label)+'</button>').join('') + '</div>',
'<p class="lead">ここで作りたいゲームを決めます。漠然としているときは、この中から選べば企画になります。カテゴリごとに並んでいます。</p>',
groups.map(g=>'<div class="lbl">'+esc(g.label)+'</div>' + chips(g.items, 'purpose', false)).join(''),
'<div class="lbl">その他（ここに書けば、それが目的になります）</div>',
'<input type="text" data-purposeother placeholder="自由に書く（例: ネコがケーキを守る）" value="'+esc(state.purposeOther||'')+'">',
'<div class="lbl">こんなジャンルも考えられます（行き詰まったら・押すと EMS の入り口へ飛びます）</div>',
'<div class="chips">' + CT.GENRE_HINTS.map(h=>'<button type="button" class="chip small" data-genre="'+h.id+'">'+esc(h.label)+'：'+esc(h.desc)+'</button>').join('') + '</div>',
''+
'<div class="lbl">' + esc(CT.PERSONA_LABEL) + '</div>',
'<div class="cons-row"><input type="text" data-persona-a placeholder="◯◯したい" value="'+esc((state.persona||'').split('のに')[0]||'')+'"><span class="unit">のに</span></div>',
'<div class="cons-row"><input type="text" data-persona-b placeholder="□□でできない" value="'+esc(((state.persona||'').split('のに')[1]||'').replace('でできない',''))+'"><span class="unit">でできない</span></div>',
'<p class="lead" style="margin-top:6px">' + esc(CT.PERSONA_EX) + '</p>',
agreeBlock('purpose', 'ねらいは しきり役 がまとめて全員に確認'),
nav('profile', 'action')
  ].join('');
};

R.action = () => {
  const human = state.subject==='sub_human';
  const LIST = human ? CT.HUMAN_ACTIONS : CT.ACTIONS;
  const act = LIST.find(a=>a.id===state.action);
  const rest = LIST.filter(a=>a.id!==state.action);
  return [
'<section class="card"><div class="eyebrow">STEP 03 / てだて（手段・M）</div>',
'<h2 class="step">' + (human ? 'このゲームで、飼い主（人）がすることは？' : 'このゲームで中心となる猫のアクションは？') + '</h2>',
'<p class="lead">1つ選ぶと「ゲームになる組み立て」が3つ出ます。選び直せます。' + (human ? '（ネコは共演者として出てきます）' : '') + '</p>',
chips(LIST, 'action', false),
(act ? [
'<div class="lbl">組み立て（このゲームでは、どう使う？）</div>',
'<div class="chips">' + act.variants.map((v,i)=>'<button type="button" class="chip'+(state.variant===i?' on':'')+'" data-variant="'+i+'">'+esc(v)+'</button>').join('') + '</div>',
'<div class="lbl">サブとなるアクション（任意・ゲームが成立するか不安なときは足す）</div>',
'<div class="chips"><button type="button" class="chip'+(!state.subAction?' on':'')+'" data-sub="">サブなし</button>'
  + rest.map(a=>'<button type="button" class="chip'+(state.subAction===a.id?' on':'')+'" data-sub="'+a.id+'">'+esc(a.label)+'</button>').join('') + '</div>',
'<p class="lead">' + esc(act.why) + '</p>'
] : ['<p class="lead">わからないときは、あとで決めてよい（先へ進めます）。</p>']).join(''),
'<div class="lbl">ネコの見た目（柄10種。クリックで選ぶ・絵が変わります）</div>',
'<div class="coatgrid">' + CT.COATS.map(c=>'<button type="button" class="coatcard'+(state.coat===c.id?' on':'')+'" data-coat="'+c.id+'">' + catCanvas('idle', c.id) + '<span>'+esc(c.label)+'</span></button>').join('') + '</div>',
catCanvas(state.action ? (state.variant===2?'run':'idle') : 'idle', state.coat),
agreeBlock('action', '手段は てだて役 が決めて全員に確認'),
nav('purpose', 'cons')
  ].join('');
};

R.cons = () => {
  const used = state.cons.map(c=>c.id);
  const rest = CT.CONSTRAINTS.filter(c=>used.indexOf(c.id)<0);
  const start = state.packPage * CT.PACKS_PAGE;
  const page = CT.PACKS.slice(start, start + CT.PACKS_PAGE);
  const ob = (state.profile.bad.length ? (CT.CANDS.bad.find(b=>b.id===state.profile.bad[0])||{}).label : '') || '掃除機';
  const packs = page.map(p=>{
    const on = JSON.stringify(state.cons.map(c=>c.id+c.num)) === JSON.stringify(p.items.map(i=>i.id+i.num));
    return '<button type="button" class="packbtn'+(on?' on':'')+'" data-pack="'+p.id+'"><b>'+esc(p.label)+'</b><span>'+esc(packText(p))+'</span></button>';
  }).join('');
  const rows = state.cons.map((c,i)=>{
    const def = CT.CONSTRAINTS.find(d=>d.id===c.id);
    return '<div class="cons-row"><span class="cname">'+esc(def.label)+'</span>'
      + '<span class="ctpl">'+esc(def.tpl)+'</span>'
      + '<input type="number" data-consnum="'+i+'" value="'+esc(c.num)+'" placeholder="数値">'
      + '<span class="unit">'+esc(def.unit)+'</span>'
      + '<button type="button" class="del" data-consdel="'+i+'">外す</button></div>';
  }).join('');
  const manual = state.consMode==='manual'
    ? (rest.length ? '<div class="chips">' + rest.map(c=>'<button type="button" class="chip" data-consadd="'+c.id+'">＋ '+esc(c.label)+'</button>').join('') + '</div>' : '<p class="lead">3つ入っています。</p>')
    : '';
  return [
'<section class="card"><div class="eyebrow">STEP 04 / しばり（制約・Sに加える刺激）</div>',
'<h2 class="step">どんなルールなら、頑張りたくなる？</h2>',
'<p class="lead">しばりがあるとゲームはぐっと面白くなります。おすすめを4つ出します。<b>選んだら数値はその場で変えてよい</b>（点検でまた見られます）。</p>',
'<div class="packgrid">' + packs + '</div>',
'<div class="chips" style="margin-top:10px">'
  + '<button type="button" class="chip" data-packpage>別の案を出す（おすすめを引き直す）</button>'
  + '<button type="button" class="chip'+(state.consMode==='manual'?' on':'')+'" data-manual>自分で決める（型から選ぶ）</button>'
  + (state.cons.length ? '<button type="button" class="chip" data-consclear>選び直す（しばりを空にする）</button>' : '')
  + '</div>',
(state.cons.length ? '<div class="lbl">いまのしばり（数値は自由に変えられます）</div>' + rows : ''),
manual,
'<div class="lbl">出てくる障害（具体）</div>',
'<p class="lead" style="margin:0">' + esc(ob) + '（「ネコのこと」で選んだ苦手から。変えたければ STEP 01 で選び直す）</p>',
agreeBlock('cons', 'しばりは しばり役 が決めて全員に確認'),
nav('action', 'check', '点検へ →')
  ].join('');
};

R.check = () => {
  const inf = CT.inferEMS(state);
  const needConfirm = !inf.ok && !state.emsConfirmed;
  const head = [
'<section class="card"><div class="eyebrow">STEP 05 / 点検</div>',
'<h2 class="step">ゲーム性チェック</h2>'
  ];
  if(needConfirm){
    return head.concat([
'<div class="lbl">EMSの確認（わからないで進んできた場合の確認です）</div>',
'<div class="oneline">'+esc(inf.sentence)+'</div>',
'<p class="lead">回答から想定できるEMSはこれです。あってる？</p>',
'<div class="nav"><button type="button" class="btn ghost" data-emsfix>違う（決める画面へ飛ぶ）</button>',
'<button type="button" class="btn" data-emsok>合っている（このEMSで点検する）</button></div>',
'<p class="lead">「違う」を押すと、まだ決まっていない画面（02 ねらい ／ 03 てだて ／ 04 しばり）に飛びます。</p>',
nav(state.step, null)
    ].join('')).join('');
  }
  const J = CT.judge(state);
  const G = CT.gameCheck(state);
  const W = CT.JUDGE_WORDS[J.color];
  const P = CT.planOf(state);
  return head.concat([
G.map(g=>'<div class="checkrow"><span class="ax">'+esc(g.name)+'</span><span class="mark m'+g.mark+'">'+g.mark+'</span><span class="cm">'+esc(g.comment)+'</span></div>').join(''),
'<div class="lbl">EMS判定（3色・点数なし）</div>',
'<div class="verdict '+J.color+'">'+esc(W.word)+'（'+J.color+'）</div>',
'<p class="lead" style="margin:4px 0 0">'+esc(W.note)+'</p>',
'<p class="reason">'+esc(J.reason)+'</p>',
(J.fixes.length ? '<ul class="fixes">'+J.fixes.map(f=>'<li>'+esc(f)+'</li>').join('')+'</ul>' : ''),
'<div class="lbl">いまの案（EMS）</div>',
'<div class="oneline">'+esc(CT.oneLine(P))+'</div>',
'<p class="lead">わからないままでも先に進めます（止まりません）。直したら、もう一度この画面に戻ってくれば再点検されます。</p>',
'<div class="nav"><button type="button" class="btn ghost" data-go="cons">← 直す（しばり）</button>'
 + '<button type="button" class="btn ghost" data-go="action">← 直す（てだて）</button>'
 + '<button type="button" class="btn" data-go="plan">ゲーム案へ →</button></div>'
  ].join('')).join('');
};

R.plan = () => {
  const P = CT.planOf(state);
  return [
'<section class="card"><div class="eyebrow">STEP 06 / ゲーム案</div>',
'<h2 class="step">1本にまとめる（ここで初めてタイトル）</h2>',
'<div class="oneline">'+esc(CT.oneLine(P))+'</div>',
'<div class="lbl">EMSで見る（注釈つき）</div>',
'<div class="emsblock">',
'<div class="emsrow"><span class="emstag">目的（E）</span>' + esc(CT.goalOf(P) || '未記入') + '</div>',
'<div class="emsrow"><span class="emstag">手段（M）</span>中心: ' + esc(P.centerVerb || '未記入') + (P.subVerb ? '　／　サブ: ' + esc(P.subVerb) : '') + '</div>',
'<div class="emsrow"><span class="emstag">制約（S）</span>' + esc(P.cons.length ? P.cons.map(c=>c.def.tpl.replace('◯◯', String(c.num))).join('、') + (P.packLabel ? '（' + P.packLabel + '）' : '') : '未記入') + '</div>',
'<div class="emsrow"><span class="emstag">障害（具体）</span>' + esc(P.obstacles.join('、')) + '</div>',
'<div class="emsrow"><span class="emstag">舞台（背景）</span>' + esc(CT.stageOf(P.purpose ? P.purpose.id : '').label) + '</div>',
'<div class="emsrow"><span class="emstag">BGM</span>' + esc(CT.bgmOf(P.purpose ? P.purpose.id : '').label) + '（明るい・歌える方向で作り起こす）</div>',
'<div class="emsrow"><span class="emstag">成功条件</span>' + esc(P.success) + '</div>',
'</div>',
'<div class="lbl">タイトル（空なら自動で入ります）</div>',
'<input type="text" data-title placeholder="ネコが〜するゲーム" value="'+esc(state.title)+'">',
'<div class="lbl">展開（つくり方の目安）</div>',
'<p class="lead" style="margin:0">'+CT.PHASES.map(p=>esc(p.at+' '+p.name)).join('<br>')+'</p>',
nav('check', 'out', '出力へ →')
  ].join('');
};

R.out = () => {
  const J = CT.judge(state);
  const G = CT.gameCheck(state);
  const outs = CT.buildAll(state, J, G);
  const names = {plan:'企画書', image:'イメージ1枚', assets:'素材シート', web:'Webプロト', unity:'Unity依頼', proposal:'提案書'};
  const tab = state.tab || 'plan';
  if(!outs[tab]) state.tab = tab = 'plan';
  return [
'<section class="card"><div class="eyebrow">STEP 07 / 出力</div>',
'<h2 class="step">6種をコピーして、AIに貼る</h2>',
'<p class="lead">Webプロトが授業の到達点。Unity依頼は後日の移植実験用。字数はそのまま出ます。</p>',
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

function render(){
  try{
    const fn = R[state.step] || R.intro;
    app.innerHTML = fn();
    renderRail(); renderRolebar(); drawPreviews(); save();
    app.focus({preventScroll:true});
  }catch(err){
    /* 画面が固まって見えない、を防ぐ。エラーの内容をその場に出す(原因を消さない) */
    try{
      app.innerHTML = '<section class="card"><div class="eyebrow">表示エラー</div>'
        + '<h2 class="step">画面の作り直しで問題が出ました</h2>'
        + '<p class="lead">「最初から」を押すと必ず復帰できます(保存は消えます)。</p>'
        + '<pre class="out">'+esc(err && err.message ? err.message : String(err))+'</pre>'
        + '<div class="nav"><button type="button" class="btn" data-restart2>最初からやり直す</button></div></section>';
    }catch(e2){}
    if(window.console && console.error) console.error(err);
  }
}

function toggle(key, vid, multi){
  if(multi){
    const arr = state.profile[key];
    const i = arr.indexOf(vid);
    if(i>=0){ arr.splice(i,1); return; }
    if(arr.length >= CT.PICK_LIMIT){ toast('3つまでです（いちばん強い意見を残す）'); return; }
    arr.push(vid);
  } else {
    state[key] = (state[key]===vid) ? '' : vid;
    if(key==='purpose'){ state.emsConfirmed = false; }
  }
}

document.addEventListener('click', e=>{
  const t = e.target.closest('button, input[type=checkbox]');
  if(!t) return;
  if(t.dataset.tab){ state.tab = t.dataset.tab; render(); return; }
  if(t.dataset.genre){
    const h = CT.GENRE_HINTS.find(x=>x.id===t.dataset.genre);
    if(h){
      state.genreHint = h.id;
      state.purpose = h.set.purpose; state.purposeOther = '';
      state.pattern = h.set.pattern;
      state.action=''; state.variant=0; state.subAction=''; state.cons=[]; state.packLabel='';
      state.emsConfirmed = false;
      state.step = 'action';
      toast('『' + h.label + '』で考えます');
      render(); window.scrollTo(0,0);
    }
    return;
  }
  if('restart2' in t.dataset){ try{ localStorage.removeItem(KEY); }catch(e){} state = fresh(); render(); window.scrollTo(0,0); return; }
  if('emsok' in t.dataset){ state.emsConfirmed = true; render(); return; }
  if('emsfix' in t.dataset){
    const inf = CT.inferEMS(state);
    const first = inf.missing[0];
    state.step = (first==='purpose') ? 'purpose' : (first==='action') ? 'action' : 'cons';
    render(); window.scrollTo(0,0); return;
  }
  if(t.dataset.subject){ if(state.subject!==t.dataset.subject){ state.subject = t.dataset.subject; state.purpose=''; state.purposeOther=''; state.action=''; state.variant=0; state.subAction=''; state.cons=[]; state.packLabel=''; } render(); return; }
  if(t.dataset.go !== undefined && t.dataset.go !== ''){ if(t.disabled) return; state.step = t.dataset.go; render(); window.scrollTo(0,0); return; }
  if(t.dataset.pick){ toggle(t.dataset.pick, t.dataset.id, t.dataset.multi==='1'); render(); return; }
  if(t.dataset.coat){ state.coat = t.dataset.coat; render(); return; }
  if(t.dataset.variant !== undefined && t.dataset.variant !== ''){ state.variant = +t.dataset.variant; render(); return; }
  if(t.dataset.sub !== undefined){ state.subAction = t.dataset.sub; if(t.dataset.sub==='') { state.subAction=''; } render(); return; }
  if(t.dataset.pack){ const p = CT.PACKS.find(x=>x.id===t.dataset.pack); if(p){ state.cons = p.items.map(i=>({id:i.id, num:i.num})); state.packLabel = p.label; state.consMode='pack'; } render(); return; }
  if('packpage' in t.dataset){ state.packPage = (state.packPage+1) % Math.ceil(CT.PACKS.length/CT.PACKS_PAGE); render(); return; }
  if('manual' in t.dataset){ state.consMode = 'manual'; render(); return; }
  if('consclear' in t.dataset){ state.cons = []; state.packLabel=''; render(); return; }
  if(t.dataset.consadd){ if(state.cons.length<3){ state.cons.push({id:t.dataset.consadd, num:(CT.CONSTRAINTS.find(c=>c.id===t.dataset.consadd)||{}).num}); state.packLabel=''; } render(); return; }
  if(t.dataset.consdel !== undefined && t.dataset.consdel !== ''){ state.cons.splice(+t.dataset.consdel, 1); render(); return; }
  if(t.dataset.copy){ const J=CT.judge(state), G=CT.gameCheck(state); const outs = CT.buildAll(state, J, G); copyText(outs[t.dataset.copy], t); return; }
  if(t.dataset.retro){ state.retro[t.dataset.retro] = t.dataset.v; render(); return; }
  if(t.dataset.agree !== undefined && t.dataset.agree !== ''){
    const a = state.agree[t.dataset.agree] || {agree:true, reason:''};
    a.agree = t.checked; state.agree[t.dataset.agree] = a; save(); render(); return;
  }
});

document.addEventListener('input', e=>{
  const t = e.target;
  if(t.dataset.role !== undefined){ state.roles[t.dataset.role] = t.value; save(); renderRolebar(); return; }
  if(t.dataset.othcat !== undefined){ state.profile.other[t.dataset.othcat] = t.value; save(); return; }
  if(t.dataset.personaA !== undefined){ state.persona = t.value + 'のに' + ((state.persona||'').split('のに')[1]||''); save(); return; }
  if(t.dataset.personaB !== undefined){ state.persona = (state.persona||'').split('のに')[0] + 'のに' + t.value + 'でできない'; save(); return; }
  if(t.dataset.purposeother !== undefined){ state.purposeOther = t.value; save(); return; }
  if(t.dataset.consnum !== undefined){ state.cons[+t.dataset.consnum].num = t.value; save(); return; }
  if(t.dataset.agreereason !== undefined){ const a = state.agree[t.dataset.agreereason] || {agree:false, reason:''}; a.reason = t.value; state.agree[t.dataset.agreereason] = a; save(); return; }
  if(t.dataset.title !== undefined){ state.title = t.value; save(); return; }
  if(t.dataset.retrotext !== undefined){ state.retro[t.dataset.retrotext] = t.value; save(); return; }
});

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
