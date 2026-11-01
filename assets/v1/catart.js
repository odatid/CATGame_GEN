/* =========================================================
   CATGame_GEN — 猫の描画 v0.2.0（四角と三角だけで描く）
   表現ルール: 実在の写真を使わない／図形で描く／色は3色まで／
   柄は しま・まだら・単色 のどれか／鳴き声は「にゃー」だけ。
   数値仕様は PK//PROTO の PICO_SPEC と同じ構造（比率固定で再現する）。
   基準: 頭の幅 W=1.00。頭 H0.92。胴 W0.84×H0.68。足 H0.20。
   顔の目盛り（頭頂0.00→顎1.00）: 目0.42／鼻0.58／口0.70／ひげ0.50-0.66。
   動きは 拡縮(sx/sy)・傾き(lean)・足の開き(split)・しっぽ(tail) で作る。
   この関数そのものを CAT_DRAW_SRC として出力に同梱する（toString）。
   ------------------------------------------------------------ */
window.CT = window.CT || {};

/* ポーズ6種。演出の状態と1対1（PICO_POSES と同じ考え方） */
const CAT_POSES = {
  idle:    {lean:0,   split:0.02, mouth:0.3, tail:0.4},
  run:     {lean:8,   split:0.10, mouth:0.5, tail:0.8},
  jump:    {lean:0,   split:0.04, mouth:1,   tail:1},
  land:    {lean:0,   split:0.16, mouth:0.5, tail:0.2},
  success: {lean:-4,  split:0.12, mouth:1,   tail:1},
  fail:    {lean:10,  split:0.04, mouth:0,   tail:0}
};

/* 色（3色まで・固定。決定的） */
function catPalette(coat){
  return {body:'#E8A34D', ink:'#2B2622', white:'#F7F3EA'};
}

/* 本体。原点は足元(y=0)、上はマイナス。座標はすべて頭幅W=1.00基準の比率 */
function drawCat(ctx, x, y, s, pose, sx, sy, dir, coat){
  var p = (typeof pose==='string') ? (CAT_POSES[pose]||CAT_POSES.idle) : (pose||CAT_POSES.idle);
  if(!coat) coat = {mode:'shima'};
  var C = catPalette(coat);
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
  /* 頭（四角・W1.00×H0.92・胴の上に接する） */
  var hy = -1.78;
  ctx.fillRect(-0.50, hy, 1.00, 0.92);
  /* 耳（三角・中に白の三角） */
  ctx.fillStyle = C.body;
  ctx.beginPath(); ctx.moveTo(-0.50, hy+0.02); ctx.lineTo(-0.20, hy+0.02); ctx.lineTo(-0.40, hy-0.24); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo( 0.20, hy+0.02); ctx.lineTo( 0.50, hy+0.02); ctx.lineTo( 0.40, hy-0.24); ctx.closePath(); ctx.fill();
  ctx.fillStyle = C.white;
  ctx.beginPath(); ctx.moveTo(-0.42, hy+0.02); ctx.lineTo(-0.27, hy+0.02); ctx.lineTo(-0.37, hy-0.12); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo( 0.27, hy+0.02); ctx.lineTo( 0.42, hy+0.02); ctx.lineTo( 0.37, hy-0.12); ctx.closePath(); ctx.fill();
  /* 柄（しま=細い四角の縞／まだら=四角の斑点／単色=描かない） */
  ctx.fillStyle = C.ink;
  if(coat.mode==='shima'){
    ctx.fillRect(-0.34, hy, 0.07, 0.30); ctx.fillRect(-0.04, hy, 0.07, 0.36); ctx.fillRect(0.26, hy, 0.07, 0.30);
    ctx.fillRect(-0.20, -0.86, 0.07, 0.40); ctx.fillRect(0.10, -0.86, 0.07, 0.34);
  } else if(coat.mode==='madara'){
    ctx.fillRect(-0.34, hy+0.04, 0.10, 0.10); ctx.fillRect(0.10, hy+0.10, 0.10, 0.10);
    ctx.fillRect(-0.10, -0.72, 0.10, 0.10); ctx.fillRect(0.22, -0.50, 0.10, 0.10);
  }
  /* 顔（目盛りは頭頂0.00→顎1.00。目は細めた横線のまま・変えるのは口だけ） */
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

/* 出力に同梱するソース（この文字列そのものが検証済みのコード） */
const CAT_DRAW_SRC = 'var CAT_POSES = ' + JSON.stringify(CAT_POSES) + ';\n'
  + catPalette.toString() + '\n' + drawCat.toString();

/* 画像AI向けの短い版（比率だけ5行） */
function catSpecShort(){
  return [
    '2.0頭身。頭の幅を1.00としたとき高さ0.92。頭は四角、耳だけ三角、他はすべて四角（矩形）で描く。丸・楕円・曲線を使わない。',
    '顔の目盛り（頭頂0.00→顎1.00）：目0.42／鼻0.58／口0.70。目は細めた横線のまま動かさない。変えるのは口の開きだけ。',
    '色は3色まで（例：茶白 #E8A34D／墨 #2B2622／白 #F7F3EA）。柄は「しま」「まだら」「単色」のどれか。',
    'ひげは細い四角を左右3本。しっぽは小さな四角を3つ階段状に。',
    '実在の猫の写真・実在キャラクター・ロゴは使わない。鳴き声の表記は「にゃー」だけ。'
  ].join('\n');
}

CT.CAT_POSES = CAT_POSES;
CT.catPalette = catPalette;
CT.drawCat = drawCat;
CT.CAT_DRAW_SRC = CAT_DRAW_SRC;
CT.catSpecShort = catSpecShort;
