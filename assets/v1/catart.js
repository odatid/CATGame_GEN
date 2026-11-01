/* =========================================================
   CATGame_GEN — 猫の描画 v0.3.0（四角と三角だけで描く・柄バリエーション10種）
   表現ルール: 実在の写真を使わない／図形で描く／1体は3色まで／
   柄は しま・まだら・単色 の発展形（三毛・ハチワレ・シャム風など）／
   鳴き声は「にゃー」だけ。
   基準: 頭の幅 W=1.00。頭 H0.92。胴 W0.84×H0.68。足 H0.20。
   顔の目盛り（頭頂0.00→顎1.00）: 目0.42／鼻0.58／口0.70。
   動きは 拡縮(sx/sy)・傾き(lean)・足の開き(split)・しっぽ(tail) で作る。
   ------------------------------------------------------------ */
window.CT = window.CT || {};

const CAT_POSES = {
  idle:    {lean:0,   split:0.02, mouth:0.3, tail:0.4},
  run:     {lean:8,   split:0.10, mouth:0.5, tail:0.8},
  jump:    {lean:0,   split:0.04, mouth:1,   tail:1},
  land:    {lean:0,   split:0.16, mouth:0.5, tail:0.2},
  success: {lean:-4,  split:0.12, mouth:1,   tail:1},
  fail:    {lean:10,  split:0.04, mouth:0,   tail:0}
};

/* 柄バリエーション10種（1体3色以内・すべて固定値で再現する） */
const COATS = [
  {id:'shima',   label:'茶トラ（しま）', mode:'shima',  body:'#E8A34D', ink:'#2B2622', white:'#F7F3EA'},
  {id:'shiro',   label:'白猫（単色）',   mode:'tan',    body:'#F7F3EA', ink:'#2B2622', white:'#F7F3EA'},
  {id:'kuro',    label:'黒猫（単色）',   mode:'tan',    body:'#3A3430', ink:'#F7F3EA', white:'#F7F3EA'},
  {id:'hachi',   label:'ハチワレ',       mode:'madara', body:'#F7F3EA', ink:'#2B2622', white:'#F7F3EA'},
  {id:'buchi',   label:'白×黒斑',        mode:'madara', body:'#F7F3EA', ink:'#2B2622', white:'#F7F3EA'},
  {id:'mike',    label:'三毛',           mode:'mike',   body:'#F7F3EA', ink:'#2B2622', white:'#F7F3EA', spot:'#E8A34D'},
  {id:'shamu',   label:'シャム風',       mode:'shamu',  body:'#E8D9C5', ink:'#6B4A2F', white:'#F7F3EA'},
  {id:'haitora', label:'灰トラ（しま）', mode:'shima',  body:'#9A9A9A', ink:'#2B2622', white:'#F7F3EA'},
  {id:'chatora', label:'茶トラ深色',     mode:'shima',  body:'#C77F3B', ink:'#2B2622', white:'#F7F3EA'},
  {id:'guma',    label:'クリーム白',     mode:'tan',    body:'#EFD9A7', ink:'#2B2622', white:'#F7F3EA'}
];

function coatOf(id){
  for(var i=0;i<COATS.length;i++){ if(COATS[i].id===id) return COATS[i]; }
  return COATS[0];
}

/* 本体。原点は足元(y=0)、上はマイナス。座標は頭幅W=1.00基準の比率 */
function drawCat(ctx, x, y, s, pose, sx, sy, dir, coat){
  var p = (typeof pose==='string') ? (CAT_POSES[pose]||CAT_POSES.idle) : (pose||CAT_POSES.idle);
  var c = (typeof coat==='string') ? coatOf(coat) : (coat||COATS[0]);
  var C = {body:c.body, ink:c.ink, white:c.white, spot:c.spot||null};
  ctx.save();
  ctx.translate(x, y);
  ctx.scale((dir||1)*s, s);
  ctx.scale(sx||1, sy||1);
  ctx.rotate((p.lean||0)*Math.PI/180);
  /* 足（四角2本・開き split） */
  var sp = p.split||0;
  ctx.fillStyle = C.body;
  ctx.fillRect(-0.36-sp, -0.20, 0.20, 0.20);
  ctx.fillRect( 0.16+sp, -0.20, 0.20, 0.20);
  /* 胴 */
  ctx.fillRect(-0.42, -0.86, 0.84, 0.68);
  /* 胸（白） */
  ctx.fillStyle = C.white;
  ctx.fillRect(-0.10, -0.80, 0.20, 0.56);
  /* しっぽ（四角3つの階段・tailで跳ね上げる） */
  ctx.fillStyle = C.body;
  var t = p.tail||0;
  ctx.fillRect(0.40, -0.90 - t*0.10, 0.13, 0.13);
  ctx.fillRect(0.47, -1.04 - t*0.22, 0.13, 0.13);
  ctx.fillRect(0.52, -1.18 - t*0.34, 0.13, 0.13);
  /* 頭（四角・W1.00×H0.92） */
  var hy = -1.78;
  ctx.fillRect(-0.50, hy, 1.00, 0.92);
  /* 耳（三角・中に白の三角） */
  ctx.fillStyle = C.body;
  ctx.beginPath(); ctx.moveTo(-0.50, hy+0.02); ctx.lineTo(-0.20, hy+0.02); ctx.lineTo(-0.40, hy-0.24); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo( 0.20, hy+0.02); ctx.lineTo( 0.50, hy+0.02); ctx.lineTo( 0.40, hy-0.24); ctx.closePath(); ctx.fill();
  ctx.fillStyle = C.white;
  ctx.beginPath(); ctx.moveTo(-0.42, hy+0.02); ctx.lineTo(-0.27, hy+0.02); ctx.lineTo(-0.37, hy-0.12); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo( 0.27, hy+0.02); ctx.lineTo( 0.42, hy+0.02); ctx.lineTo( 0.37, hy-0.12); ctx.closePath(); ctx.fill();
  /* 柄 */
  ctx.fillStyle = C.ink;
  if(c.mode==='shima'){
    ctx.fillRect(-0.34, hy, 0.07, 0.30); ctx.fillRect(-0.04, hy, 0.07, 0.36); ctx.fillRect(0.26, hy, 0.07, 0.30);
    ctx.fillRect(-0.20, -0.86, 0.07, 0.40); ctx.fillRect(0.10, -0.86, 0.07, 0.34);
  } else if(c.mode==='madara'){
    ctx.fillRect(-0.36, hy+0.02, 0.16, 0.12); ctx.fillRect(0.20, hy+0.06, 0.14, 0.12);
    ctx.fillRect(-0.24, -0.78, 0.18, 0.20); ctx.fillRect(0.16, -0.50, 0.16, 0.16);
  } else if(c.mode==='mike'){
    ctx.fillStyle = C.spot;
    ctx.fillRect(-0.40, hy+0.02, 0.18, 0.14); ctx.fillRect(0.10, hy+0.04, 0.20, 0.16);
    ctx.fillRect(-0.26, -0.80, 0.20, 0.18);
    ctx.fillStyle = C.ink;
    ctx.fillRect(0.22, hy+0.02, 0.16, 0.12); ctx.fillRect(0.10, -0.56, 0.18, 0.16);
  } else if(c.mode==='shamu'){
    ctx.fillRect(-0.26, hy+0.44, 0.52, 0.10);
    ctx.fillRect(-0.36, hy-0.16, 0.18, 0.10); ctx.fillRect(0.18, hy-0.16, 0.18, 0.10);
    ctx.fillRect(0.42, -0.30, 0.13, 0.30);
  }
  /* 顔（目は細めた横線のまま・変えるのは口だけ） */
  var fy = function(h){ return hy + h*0.92; };
  ctx.fillStyle = C.ink;
  ctx.fillRect(-0.26, fy(0.42), 0.16, 0.05);
  ctx.fillRect( 0.10, fy(0.42), 0.16, 0.05);
  ctx.fillRect(-0.05, fy(0.58), 0.10, 0.07);
  var m = p.mouth||0;
  if(m > 0.5){
    ctx.fillStyle = C.white; ctx.fillRect(-0.08, fy(0.68), 0.16, 0.14);
    ctx.fillStyle = C.ink; ctx.fillRect(-0.08, fy(0.68), 0.16, 0.03); ctx.fillRect(-0.08, fy(0.79), 0.16, 0.03);
  } else {
    ctx.fillRect(-0.07, fy(0.70), 0.14, 0.03);
  }
  /* ひげ（細い四角・左右3本） */
  ctx.fillRect(-0.78, fy(0.50), 0.22, 0.025); ctx.fillRect(-0.78, fy(0.58), 0.22, 0.025); ctx.fillRect(-0.78, fy(0.66), 0.22, 0.025);
  ctx.fillRect( 0.56, fy(0.50), 0.22, 0.025); ctx.fillRect( 0.56, fy(0.58), 0.22, 0.025); ctx.fillRect( 0.56, fy(0.66), 0.22, 0.025);
  ctx.restore();
}

/* ---------------- 横向き（側面）の猫 ----------------
   正面より簡単で猫らしく見える。プラットフォーマー・ラン系はこちら。
   これも四角と三角だけ。dir で向きを反転する。
   ------------------------------------------------------------ */
function drawCatSide(ctx, x, y, s, pose, sx, sy, dir, coat){
  var p = (typeof pose==='string') ? (CAT_POSES[pose]||CAT_POSES.idle) : (pose||CAT_POSES.idle);
  var c = (typeof coat==='string') ? coatOf(coat) : (coat||COATS[0]);
  var C = {body:c.body, ink:c.ink, white:c.white, spot:c.spot||null};
  ctx.save();
  ctx.translate(x, y);
  ctx.scale((dir||1)*s, s);
  ctx.scale(sx||1, sy||1);
  ctx.rotate((p.lean||0)*Math.PI/180);
  var stretch = (p.mouth>=1) ? 0.10 : 0;
  /* 足4本（走りは開く） */
  var sp = p.split||0;
  ctx.fillStyle = C.body;
  ctx.fillRect(-0.62, -0.20, 0.16, 0.20);
  ctx.fillRect(-0.34, -0.20, 0.16, 0.20);
  ctx.fillRect( 0.22, -0.20, 0.16, 0.20);
  ctx.fillRect( 0.50, -0.20, 0.16, 0.20);
  /* 胴（横長の四角・跳ぶと伸びる） */
  ctx.fillRect(-0.72, -0.78 - stretch, 1.44, 0.58 + stretch);
  /* しっぽ（後ろから上へ・四角3つの階段） */
  var t = p.tail||0;
  ctx.fillRect(-0.90, -0.92 - t*0.10, 0.14, 0.14);
  ctx.fillRect(-1.02, -1.06 - t*0.22, 0.14, 0.14);
  ctx.fillRect(-1.08, -1.20 - t*0.34, 0.14, 0.14);
  /* 頭（前の上に四角・耳は三角2つ） */
  var hx = 0.44, hy = -1.30 - stretch;
  ctx.fillRect(hx, hy, 0.66, 0.62);
  ctx.beginPath(); ctx.moveTo(hx+0.02, hy+0.02); ctx.lineTo(hx+0.22, hy+0.02); ctx.lineTo(hx+0.06, hy-0.18); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(hx+0.44, hy+0.02); ctx.lineTo(hx+0.64, hy+0.02); ctx.lineTo(hx+0.60, hy-0.18); ctx.closePath(); ctx.fill();
  /* 柄（背中側に） */
  if(c.mode==='shima'){
    ctx.fillRect(-0.50, -0.78 - stretch, 0.07, 0.24);
    ctx.fillRect(-0.24, -0.78 - stretch, 0.07, 0.28);
    ctx.fillRect( 0.02, -0.78 - stretch, 0.07, 0.24);
  } else if(c.mode==='madara'){
    ctx.fillRect(-0.56, -0.74 - stretch, 0.12, 0.12);
    ctx.fillRect(-0.16, -0.68 - stretch, 0.12, 0.12);
  } else if(c.mode==='mike'){
    ctx.fillStyle = C.spot;
    ctx.fillRect(-0.56, -0.74 - stretch, 0.13, 0.12);
    ctx.fillRect(-0.14, -0.70 - stretch, 0.13, 0.12);
    ctx.fillStyle = C.ink;
    ctx.fillRect( 0.10, -0.74 - stretch, 0.13, 0.12);
  } else if(c.mode==='shamu'){
    ctx.fillRect(hx+0.06, hy+0.30, 0.54, 0.10);
  }
  /* 顔（目は横線・鼻・口・ひげ） */
  ctx.fillStyle = C.ink;
  ctx.fillRect(hx+0.34, hy+0.22, 0.12, 0.045);
  ctx.fillRect(hx+0.52, hy+0.34, 0.07, 0.05);
  var m = p.mouth||0;
  if(m > 0.5){ ctx.fillRect(hx+0.46, hy+0.44, 0.16, 0.09); }
  else { ctx.fillRect(hx+0.44, hy+0.44, 0.12, 0.03); }
  ctx.fillRect(hx+0.24, hy+0.30, 0.18, 0.02);
  ctx.fillRect(hx+0.24, hy+0.38, 0.18, 0.02);
  ctx.restore();
}

/* 出力に同梱するソース（この文字列そのものが検証済みのコード） */
const CAT_DRAW_SRC = 'var CAT_POSES = ' + JSON.stringify(CAT_POSES) + ';\n'
  + 'var COATS = ' + JSON.stringify(COATS) + ';\n'
  + coatOf.toString() + '\n'
  + drawCat.toString() + '\n'
  + drawCatSide.toString();

/* 画像AI向けの短い版（比率5行・柄の選択を反映） */
function catSpecShort(coatId){
  var c = coatOf(coatId||'shima');
  return [
    '2.0頭身。頭の幅を1.00としたとき高さ0.92。頭は四角、耳だけ三角、他はすべて四角（矩形）で描く。丸・楕円・曲線を使わない。',
    '顔の目盛り（頭頂0.00→顎1.00）：目0.42／鼻0.58／口0.70。目は細めた横線のまま動かさない。変えるのは口の開きだけ。',
    '1体は3色まで（この体: 地' + c.body + '／線' + c.ink + '／白' + c.white + '）。柄は「' + c.label + '」。',
    'ひげは細い四角を左右3本。しっぽは小さな四角を3つ階段状に。',
    '実在の猫の写真・実在キャラクター・ロゴは使わない。鳴き声の表記は「にゃー」だけ。'
  ].join('\n');
}

CT.CAT_POSES = CAT_POSES;
CT.COATS = COATS;
CT.coatOf = coatOf;
CT.drawCat = drawCat;
CT.drawCatSide = drawCatSide;
CT.CAT_DRAW_SRC = CAT_DRAW_SRC;
CT.catSpecShort = catSpecShort;
