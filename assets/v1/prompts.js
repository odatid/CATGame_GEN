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

/* ---------------- カメラとスクロールの仕様（MAPが画面より大きいときは必須） ---------------- */
const CAMERA_SPEC = [
'【カメラとスクロール（MAPが画面(960×540)より大きいときは必須）】',
'・カメラ変数は camX / camY の2つだけ。update() の最後（updateGame の直後）で更新する。',
'・基本の追従: camX を「プレイヤーが画面の中央より少し先を見る」位置へ寄せる。',
'　camX += ((player.x + (player.vx>=0 ? 120 : -120)) - (camX + W/2)) * Math.min(1, dt*6);',
'　camY も同様に、プレイヤーが上へ登るなら少し先を見る（+60px上）。lerp係数は dt*6（遅すぎると酔う・速すぎると落ち着かない）。',
'・クランプ（必須）: camX は 0〜MAP_W-W、camY は 0〜MAP_H-H に必ず収める。端で 世界が はみ出して見えるのは不合格。',
'・描画への適用（1か所だけ）: renderPlayScreen() の冒頭、揺れの translate の前に ctx.translate(-camX, -camY) を足す。',
'　背景も床も敵も全部世界座標のまま描いてよい（カメラが全部運ぶ）。HUD（SCORE/TIME/ライフ）はカメラの外＝translate の後に描く（動かない）。',
'・TITLE と RESULT ではカメラを使わない（camX=camY=0 に戻す。固定座標で描く。タイトルが真っ黒になる事故の2つ目の原因）。',
'・数字ポップ・粒も世界座標でよい（カメラと一緒に動く。HUDだけ固定）。'
].join('\n');

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
  const gh = (st.genreHint && CT.GENRE_HINTS) ? CT.GENRE_HINTS.find(h=>h.id===st.genreHint) : null;
  return {
    genreLabel: gh ? gh.label : '',
    patternId: st.pattern || '',
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
(P.genreLabel ? 'ジャンルの方向: ' + P.genreLabel : 'ジャンルの方向: 選ばなかった（アクション寄りで組み立てる）'),
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
  const stage = CT.stageOf(P.purpose ? P.purpose.id : '');
  return [
'ゲームのイメージ画像を1枚描いてください。',
'',
'【猫の描き方（数値で固定・このとおりに描く）】',
CT.catSpecShort(P.coatId),
'',
'【シーン】',
'舞台: ' + stage.label + '（' + stage.items + '）',
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
  const stage = CT.stageOf(P.purpose ? P.purpose.id : '');
  const rows = [
    '1 猫プレイヤー（立ち）', '2 猫プレイヤー（' + (P.centerVerb || '中心アクション') + '）',
    '3 猫（' + (CT.coatOf(P.coatId).label) + '・立ち）', '4 猫（' + (CT.coatOf(P.coatId).label) + '・走り）',
    '5 障害1: ' + (P.obstacles[0] || '掃除機'), '6 障害2: ' + (P.obstacles[1] || 'カラス'),
    '7 ゴール: ' + (P.purpose ? P.purpose.label : '猫缶'), '8 集める物（猫缶・魚・毛糸）',
    '9 仕掛け（段ボール箱・二役）', '10 背景（' + stage.label + '）', '11 UI（タイマー・ゲージ）', '12 タイトルロゴ用の猫マーク'
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
function webCore(P){
  var t = pk(CT.ENGINE.CORE_CODE).split('drawPico').join('drawCat');
  if(P && P.dur && P.dur !== 30){
    t = t.split('duration: 30,').join('duration: ' + P.dur + ',');
    t = t.split('30秒で確定（30秒か、長くても40秒。60秒にしない）').join('【仕様】の秒数に合わせてある（勝手に戻さない）');
  }
  if(P && P.coatId){
    t = t.split("drawCat(ctx, player.x + swayX(), player.y, 34, pose, player.sx, player.sy, 1)")
         .join("drawCat(ctx, player.x + swayX(), player.y, 34, pose, player.sx, player.sy, 1, '" + P.coatId + "')");
  }
  return t;
}
/* ジュースの誇張レベル（FB: もっと誇張してほしい） */
const JUICE_MORE = [
'【ジュースの誇張レベル（必須・この倍率をそのまま使う）】',
'・スクワッシュ&ストレッチを強める: ジャンプ時 sx0.75/sy1.30、着地時 sx1.45/sy0.62。戻すのは0.09秒（イージング付き）。',
'・粒（パーティクル）は24個までではなく60個まで。着地とゴールで2重に出す（色は2色）。',
'・数字ポップは1.6倍の大きさで、回転しながら浮かせる（±12度）。',
'・画面シェイクは最大16px・0.25秒（被弾とゴール時のみ。常用しない）。',
'・ヒットストップ: 被弾の瞬間0.05秒だけ全体を止める。',
'・ゴール: 画面全体のフラッシュ（白0.1秒）+ 粒60 + ニャー（音）+ スコア表示のバウンド。',
'・待機中も完全には止めない（尻尾の揺れとまばたき。ネコの命を見せる）。'
].join('\n');
/* 効果音（FB: SEは鳴らしてほしい・ニャーも入れる） */
const SFX_SPEC = [
'【効果音（必須・全部Web Audioで合成。音源ファイルは読まない）】',
'・ジャンプ: 上昇スイープ（200Hz→600Hz・矩形波・0.12秒）',
'・着地: 低いパルス（80Hz・0.08秒・ゲインを急に下げる）',
'・取得: 2音のアルペジオ（660Hz→990Hz・三角波）',
'・ミス: 下降スイープ（400Hz→120Hz・のこぎり波・0.2秒）',
'・ゴール: ファンファーレ4音（C-E-G-C・矩形波）',
'・ニャー（甘え・成功時）: サイン波を600Hz→900Hz→500Hzと滑らかに曲げる（0.35秒・ビブラート付き）。表記は「にゃー」',
'・ニャー（不満・ミス時）: 低め（300Hz前後）で短い（0.2秒）・途中で音程を下げる',
'・SEはイベントと1対1にする。無音のまま進まないこと（BGMもSEも参照コード2の作り方を使う）。'
].join('\n');
/* いらすとや（任意・規約の範囲を明記） */
const IRASUTOYA = [
'【任意: いらすとやの素材を使う場合】',
'・ネコや小物の絵を、いらすとや（https://www.irasutoya.com/）に合わせたテイストにする場合は、',
'  学生が自分で同サイトからPNGをダウンロードして、このHTMLと同じフォルダに置くこと。',
'・置いた画像は <img> か drawImage で読めてよい（file:// で動く範囲内）。',
'・同サイトの規約: 商用利用・加工は可、クレジット表記は不要。ただし**再配布・自作の絵のように見せること・画像URLへの直接リンクは不可**。',
'・GitHub等に公開するとき、いらすとやの画像ファイルをリポジトリに含めない（上の「再配布不可」に当たるため）。',
'・画像を使わない場合も、このままの図形ネコで必ず遊べること（画像が無くても壊れない）。'
].join('\n');
function promptWeb(P, J){
  const pat = (P.patternId && CT.PATTERNS && CT.PATTERNS[P.patternId]) ? CT.PATTERNS[P.patternId] : null;
  const patBlock = pat ? ['【システム詳細（作り方の型: ' + pat.label + '）】', pat.detail(P), ''] : [];
  const stage = CT.stageOf(P.purpose ? P.purpose.id : '');
  const bgm = CT.bgmOf(P.purpose ? P.purpose.id : '');
  const sideView = ['pg_run','pg_climb','pg_balance','pg_battle','hg_find','hg_catch'].some(g=>
    (P.purpose && (P.purpose.id===g || (CT['PURPOSE_GROUPS_'+g] && false))));
  const sideActs = ['a_climb','a_squeeze','a_knock','a_night'];
  const useSide = ['pg_run','pg_climb','pg_balance','pg_battle','pg_chaos','hg_find','hg_catch','hg_guard']
    .some(g=>{ const grp = CT.PURPOSE_GROUPS.concat(CT.PURPOSE_GROUPS_HUMAN).find(x=>x.id===g);
               return P.purpose && grp && grp.items.some(i=>i.id===P.purpose.id); })
    || (P.action && sideActs.indexOf(P.action.id)>=0);
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
...patBlock,
CAMERA_SPEC,
'',
'【参照コード1: 骨格】' + F + 'js',
webCore(P),
F,
'',
'【参照コード2: 音（Web Audioで合成・音源ファイルは読まない）】' + F + 'js',
pk(CT.ENGINE.AUDIO_CODE),
F,
'',
'【参照コード3: 猫の描画（drawCat=正面・drawCatSide=横向き・柄「' + CT.coatOf(P.coatId).label + '」）】' + F + 'js',
CT.CAT_DRAW_SRC,
F,
'',
'【猫の見せ方】',
'・この案は' + (useSide ? '横向き（drawCatSide）を使う。dir で進行方向に反転する' : '正面（drawCat）を使ってよい。横向き（drawCatSide）でもよい') + '。',
'・柄は「' + CT.coatOf(P.coatId).label + '」で固定。目は細めた横線のまま、変えるのは口だけ（猫らしさの核）。',
'',
'【BGMの方向（この案ではこの1本を作り起こす・既存曲の旋律を複製しない）】',
'『' + bgm.label + '』: ' + bgm.spec + '。作り方は参照コード2のとおり（Web Audioで合成）。',
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
JUICE_MORE,
'',
SFX_SPEC,
'',
'【背景（決定的に描く・この舞台で作る）】',
'舞台: ' + stage.label + '（空・壁の色 ' + stage.sky + '）',
'描くもの: ' + stage.items,
'・背景はすべて四角・三角・線で描く（先に背景を描いてから、その手前にゲームを置く）。',
'・【必須】drawBackground と drawFloor を、この舞台の絵に置き換えること（「タイトル画面が真っ黒になる」最大の原因は、'
 + 'この置き換えを怠って既定の暗い背景のままにすること。他の関数は書き換えない）。',
'・【必須】TITLE と RESULT 画面にも、ネコを1匹描くこと（render() が drawBackground のあとに描けばよい）。「タイトルだけ猫がいない」画面は不合格。',
'・「3色まで」のルールはネコ本体に適用。背景は地味な同系色で、ネコが映えるようにする。',
'',
IRASUTOYA,
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
