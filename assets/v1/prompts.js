/* =========================================================
   CATGame_GEN — 出力層 v0.3.0（6種・決定的組み立て・乱数なし）
   v0.3.0の変更: 手段=中心+サブ・組み立て案（variants）反映/
   障害を具体名で（グループが選んだ「苦手」から）/
   企画書・提案書にEMS注釈つき/ネコの見た目（柄バリエーション）を出力に反映
   ------------------------------------------------------------ */
window.CT = window.CT || {};
(function(){
'use strict';
const F = '```';

/* PK時代の語を猫に置き換える（組み立て時に決定的に） */
function pk(t){
  return String(t)
    .split('ピコ太郎').join('ネコ')
    .split('ピコ').join('ネコ')
    .split('Pico').join('Cat')
    .split('pico').join('cat');
}

/* ---------------- 状態→案（plan） ---------------- */
function planOf(st){
  st = st || {};
  const ALLACT = CT.ACTIONS.concat(CT.HUMAN_ACTIONS || []);
  const act = ALLACT.find(a=>a.id===st.action) || null;
  const v = (typeof st.variant==='number' && act && act.variants[st.variant]) ? st.variant : 0;
  const centerVerb = act ? act.variants[v] : '';
  const sub = CT.ACTIONS.find(a=>a.id===st.subAction) || null;
  let pur = (CT.PURPOSES.concat(CT.PURPOSES_HUMAN || [])).find(p=>p.id===st.purpose) || null;
  if(st.purposeOther && st.purposeOther.trim()){ pur = pur || {id:'p_custom', label:'その他', goal:st.purposeOther.trim(), rates:{uni:1,twi:0,fun:1,emp:1}}; }
  const cons = (st.cons||[]).map(c=>({ def: CT.CONSTRAINTS.find(d=>d.id===c.id), num: parseFloat(c.num) }))
    .filter(c=>c.def && isFinite(c.num));
  const tc = cons.find(c=>c.def.id==='c_time');
  const dur = tc ? tc.num : 30;
  const title = (st.title && st.title.trim()) ? st.title.trim() : ((pur ? pur.label : 'ねこ') + 'ゲーム');
  const pr = st.profile || {};
  const others = pr.other || {};
  const nm = (arr, ids, oth) => {
    const base = (ids||[]).map(id => { const x = arr.find(y=>y.id===id); return x ? x.label : null; }).filter(Boolean);
    if(oth && oth.trim()) base.push(oth.trim());
    return base;
  };
  const obstacles = nm(CT.CANDS.bad, pr.bad).slice(0,3);
  if(obstacles.length===0) obstacles.push('掃除機');
  /* 制約の文面を自然な日本語に（障害の具体名・起こされる相手を埋める） */
  cons.forEach(c=>{
    if(c.def.id==='c_phys'){
      const names = obstacles.slice(0, c.num);
      c.disp = names.join('・') + (c.num > names.length ? 'など' : '') + 'を避けながら';
    } else if(c.def.id==='c_info'){
      const tgt = (st.subject==='sub_human') ? 'ネコ' : '飼い主';
      c.disp = tgt + 'を起こさずに（音ゲージ' + c.num + '%を維持）';
    } else {
      c.disp = c.def.tpl.replace('◯◯', String(c.num));
    }
  });
  const consText = cons.map(c=>'・'+c.disp).join('\n');
  const success = (cons.length ? cons.map(c=>c.disp).join('、') + '、' : '')
    + (pur ? pur.goal : '目的を達成する');
  return {
    subject: (st.subject==='sub_human') ? CT.SUBJECTS[1] : CT.SUBJECTS[0],
    title, action:act, variantIdx:v, centerVerb, sub, subVerb: sub ? sub.verb : '',
    purpose:pur, cons, dur, consText, success, obstacles,
    packLabel: st.packLabel || '',
    coatId: st.coat || 'shima',
    good: nm(CT.CANDS.good, pr.good, others.good),
    bad: nm(CT.CANDS.bad, pr.bad, others.bad),
    feat: nm(CT.CANDS.feat, pr.feat, others.feat),
    target: nm(CT.CANDS.target, pr.target, others.target),
    persona: st.persona || ''
  };
}
function goalOf(P){ return P.purpose ? P.purpose.goal : ''; }
function oneLine(P){
  const verb = P.centerVerb || '（手段をえらぶ）';
  const goal = goalOf(P) || '（目的をえらぶ）';
  const cons = P.cons.length ? P.cons.map(c=>c.disp).join('、') + '、' : '';
  return (P.subject ? P.subject.word : 'ネコが') + verb + 'して、' + cons + goal + 'ゲーム。';
}

/* ---------------- 1. 1枚企画書（EMS注釈つき） ---------------- */
function promptPlan(P, J, G){
  return [
'【1枚企画書 — ' + P.title + '】',
'',
'■ EMS（Ends and Means Structure／手段目的構造）',
'【目的（E）】' + goalOf(P),
'【手段（M）】中心: ' + (P.centerVerb || '未記入') + '（ネコの' + (P.action ? P.action.label : '未記入') + '）',
(P.subVerb ? '　　　　　サブ: ' + P.subVerb + '（ネコの' + P.sub.label + '）' : ''),
'【制約（S・構造に加える刺激）】',
(P.consText || '・未記入（数値のない制約は使えません）'),
(P.packLabel ? '（しばりの型: ' + P.packLabel + '）' : ''),
'【出てくる障害（具体）】' + P.obstacles.join('、'),
'',
'■ EMS判定（点数でなく3色）',
J ? (J.color + '（' + J.verdict + '）: ' + J.reason) : '未判定',
'',
'■ ゲーム性チェック',
G.map(g=>g.name + ' ' + g.mark + ' — ' + g.comment).join('\n'),
'',
'■ この案はどこから来たか（グループの総意）',
'ネコの得意: ' + (P.good.join('／') || '未記入'),
'ネコの苦手: ' + (P.bad.join('／') || '未記入'),
'ネコの特徴: ' + (P.feat.join('／') || '未記入'),
'買う人: ' + (P.target.join('／') || '未記入'),
CT.PERSONA_LABEL + ': ' + (P.persona || '未記入（例: ' + CT.PERSONA_EX + '）'),
'',
'■ 成功条件', P.success,
'■ 1プレイ', P.dur + '秒',
'',
'この企画書は「目的・手段・制約を変えない」で使うこと。'
  ].join('\n');
}

/* ---------------- 2. ゲームイメージ画像 ---------------- */
function promptImage(P){
  return [
'ゲームのイメージ画像を1枚描いてください。',
'',
'【猫の描き方（数値で固定・このとおりに描く）】',
CT.catSpecShort(P.coatId),
'',
'【シーン】',
'タイトル: ' + P.title,
'していること: ' + (P.centerVerb || '未記入') + (P.subVerb ? '（サブ: ' + P.subVerb + '）' : ''),
'出てくる障害: ' + P.obstacles.join('、'),
'今のピンチ: ' + (P.cons[0] ? P.cons[0].def.tpl.replace('◯◯', String(P.cons[0].num)) : '未記入'),
'ゴール: ' + goalOf(P),
'見た目の方向: ' + ((P.target[0] || 'かわいい') + '向け・コミカル'),
'',
'【禁止】実在の猫の写真／実在キャラクター／ロゴ／画像内の文字。'
  ].join('\n');
}

/* ---------------- 3. 2Dアセットシート（A4・12マス） ---------------- */
function promptAssets(P){
  const rows = [
    '1 猫プレイヤー（立ち）', '2 猫プレイヤー（' + (P.centerVerb || '中心アクション') + '）',
    '3 猫（' + (CT.coatOf(P.coatId).label) + '・立ち）', '4 猫（' + (CT.coatOf(P.coatId).label) + '・走り）',
    '5 障害1: ' + (P.obstacles[0] || '掃除機'), '6 障害2: ' + (P.obstacles[1] || 'カラス'),
    '7 ゴール: ' + (P.purpose ? P.purpose.label : '猫缶'), '8 集める物（猫缶・魚・毛糸）',
    '9 仕掛け（段ボール箱・二役）', '10 背景（部屋・夜）', '11 UI（タイマー・ゲージ）', '12 タイトルロゴ用の猫マーク'
  ];
  return [
'【2Dアセットシート（A4・12マス）】ゲームに必要な素材を12個、1枚に並べてください。',
'すべて四角と三角だけで描く。1体は3色まで。写真・実在キャラ・ロゴは使わない。',
'',
CT.catSpecShort(P.coatId),
'',
rows.join('\n')
  ].join('\n');
}

/* ---------------- 4. WEBプロト生成プロトコル（HTML1ファイル拘束入り） ---------------- */
function webCore(){
  return pk(CT.ENGINE.CORE_CODE).split('drawPico').join('drawCat');
}
function promptWeb(P, J){
  return [
'HTML/CSS/JavaScriptを1ファイルにまとめて、' + P.dur + '秒で遊べるWebミニゲームを作ってください。',
'',
'【このプロンプトの読み方（最初に読む）】',
'動く完成コードを3つ、最初に貼ります。あなたの仕事は、その3つを貼ったうえで、',
'敵・当たり判定・得点（updateGame と drawGameObjects）だけを足すことです。',
'骨格も音も猫の絵も自分で書き起こさない。貼ってから足す。それが唯一の合格条件です。',
'',
'【最重要の拘束】',
CT.ENGINE.LOCK,
'',
'【出力の形（ここを守る）】',
'・返すのは JavaScript の断片ではなく .html ファイル1つ。',
'・1行目は <!DOCTYPE html>、最終行は </html>。',
'・保存してダブルクリックした瞬間に遊べること（file:// で動く。外部ファイル・CDN・Webフォントを1つも読まない）。',
'・骨（DOCTYPE・charset・viewport・style・canvas#game・script 1つ）を使い、その中に実装する。',
'',
'【仕様（変更禁止）】',
'・タイトル: ' + P.title,
'・EMS（目的・手段・制約を変えない）:',
'　目的（E）: ' + goalOf(P),
'　手段（M）: 中心=' + (P.centerVerb || '未記入') + (P.subVerb ? '／サブ=' + P.subVerb : ''),
'　制約（S）: ' + (P.cons.length ? P.cons.map(c=>c.disp).join('、') : '未記入'),
'・出てくる障害（具体）: ' + P.obstacles.join('、'),
'・成功条件: ' + P.success,
'・画面: TITLE → PLAY → RESULT（RESULTからRETRYで再開）',
'',
'【参照コード1: 骨格】' + F + 'js',
webCore(),
F,
'',
'【参照コード2: 音（Web Audioで合成・音源ファイルは読まない）】' + F + 'js',
pk(CT.ENGINE.AUDIO_CODE),
F,
'',
'【参照コード3: 猫の描画（drawCat・柄「' + CT.coatOf(P.coatId).label + '」）】' + F + 'js',
CT.CAT_DRAW_SRC,
F,
'',
pk(CT.ENGINE.INPUT_SPEC),
'',
pk(CT.ENGINE.JUICE_SCALE),
'',
pk(CT.ENGINE.EFFECT_CHECK),
'',
pk(CT.ENGINE.PERF_RULE),
'',
pk(CT.ENGINE.WIGGLE_SPEC),
'',
pk(CT.ENGINE.NES_BGM_WEB),
'',
'【展開（このとおりに作る）】',
CT.PHASES.map(p=>'・' + p.at + '｜' + p.name + '｜速さ ' + p.speed + '｜' + p.note).join('\n'),
'・速度倍率は1つの変数 speedMul に集約し、キャラ・障害物・BGMを同じ値から導く。',
'',
'【EMS判定の結果（この案の調子）】',
J ? (J.color + '（' + J.verdict + '）: ' + J.reason) : '未判定',
'判定が緑になるよう、上の制約の数値を勝手に変えない。',
'・1プレイの成功率が「10回に2〜3回」になるよう初期値を決める（0回にも10回にもしない）。',
'・失敗画面に失敗の理由を1行だけ出す（例: 「幅が足りなかった」）。',
'',
'【実装条件】',
'・Canvas 2D APIのみ。猫は必ず同梱の drawCat で描く（自分で猫を描き直さない）。',
'・コード冒頭に TUNING オブジェクトを置き、主要な数値を日本語コメント付きでまとめる。',
'・Consoleにエラーを出さない。配列は必ず初期化する。イベント登録は1回だけ。',
'・スマホでも遊べるように、画面内に大きなタップ領域を用意する。'
  ].join('\n');
}

/* ---------------- 5. Unity依頼プロトコル（後日の移植実験用） ---------------- */
function promptUnity(P){
  return [
'【UnityMCP 依頼プロトコル — ネコのゲームツクール（CatGameKit）】',
'基準: 和洋九段×TID 1Dayミニゲームジャム 準備依頼書（2026-09-11）。',
'当日新規コーディングなし。Prefab配置と Inspector 設定だけで組めること。',
'',
'■ この案を Unity に移す',
'タイトル: ' + P.title,
'【目的（E）】' + goalOf(P),
'【手段（M）】中心: ' + (P.centerVerb || '未記入') + (P.subVerb ? '／サブ: ' + P.subVerb : ''),
'【制約（S）→ GameSettings への反映】',
(P.consText || '・未記入'),
'・c_time → Game Time / c_count → Required Item Count / c_space → Move Speed & ステージ幅 /',
' c_phys → Enemy Speed・Hazard 配置数 / c_info → 音ゲージ（Hide Object と組み合わせ）',
'【出てくる障害（具体）】' + P.obstacles.join('、') + '（見た目だけ差し替え。機能は Patrol/Chase を使い回す）',
'',
'■ 使うギミック（優先度A）',
'Moving Platform / Switch / Push Box / Hazard Area / Patrol Enemy / Collectible / Goal / Timer / Hide Object',
'・仕掛けは Trigger → Action の共通ルールで組む（コードを書かない）。',
'・シーンは SC_Base_Side か SC_Base_Top のどちらか1つ。',
'',
'■ 変えるのはここだけ',
'タイトル・ロゴ・BGM選択・配色・GameSettings の数値。それ以外は触らない。'
  ].join('\n');
}

/* ---------------- 6. 提案書（来場者・保護者向け・EMS注釈つき） ---------------- */
function promptProposal(P){
  return [
'【提案書（来場者・保護者向け・1枚）】',
'',
CT.PERSONA_LABEL + ': ' + (P.persona || '（' + CT.PERSONA_EX + ' の型で書く）'),
'→ この課題に答えるゲーム: ' + P.title,
'',
'■ EMSで読む（今日学んだ構造）',
'【目的（E）】' + goalOf(P),
'【手段（M）】' + (P.subject ? P.subject.word : 'ネコが') + (P.centerVerb || '（手段）') + 'して' + (P.subVerb ? '、' + P.subVerb : ''),
'【制約（S）】' + (P.cons.length ? P.cons.map(c=>c.disp).join('、') : '（制約）'),
'',
'なぜネコなのか: ' + (P.feat.join('／') || 'ネコの得意・苦手・特徴をルールに反映するため'),
'遊ぶ人: ' + (P.target.join('／') || '未記入'),
'',
'今日学んだこと: ゲームは「目的・手段・制約」の構造でできている。私たちはその3つを自分たちで決めた。'
  ].join('\n');
}

function buildAll(st, J, G){
  const P = planOf(st);
  return {
    plan: promptPlan(P, J, G),
    image: promptImage(P),
    assets: promptAssets(P),
    web: promptWeb(P, J),
    unity: promptUnity(P),
    proposal: promptProposal(P)
  };
}

CT.planOf = planOf;
CT.oneLine = oneLine;
CT.goalOf = goalOf;
CT.buildAll = buildAll;

})();
