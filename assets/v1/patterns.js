/* =========================================================
   CATGame_GEN — 型ライブラリ v0.6.0（作り方の型・EMS確定前でも選べる）
   一覧表(19型)のデータ化。まず 逃げ切り型(pg_run) を実装してテストする。
   detail(P) は plan（EMS確定後の案）から【システム詳細】を決定的に組み立てる。
   乱数なし・同じ入力なら同じ出力。
   ------------------------------------------------------------ */
window.CT = window.CT || {};

CT.PATTERNS = {
  pg_run: {
    id: 'pg_run',
    label: '逃げ切り型',
    brief: '水面上昇型：下から迫る水から、足場を選んで高所へ逃げ切る',
    lever: 'TUNING.waterSpeed = 1.0（0.8で易しく・1.2で難しく。水位の上昇速度につなげる）',
    dur: 45,
    detail: function(P){
      const c = P.cons || [];
      const dur = P.dur;
      const rise = 1100;
      const speed = (rise / dur).toFixed(1);
      const L = [];
      L.push('▼ レベル構造: 水面上昇型（逃げ切り）');
      L.push('・マップ: 横960px×高さ約1,600pxの縦長。最下層の安全高台から開始する（開始直後の水没・被弾の理不尽をなくす）。');
      L.push('・水位: 下端から' + dur + '秒かけて約' + rise + 'px上昇（約' + speed + 'px/秒）。水位に浸かったらミス。水位は常に見える（水面は光る帯＋波の動き）。');
      L.push('・足場: ベランダ風の横足場をジグザグに配置（右→左上→右上）。崩れる足場を2〜3割混ぜて、足場選びに緊張を作る。');
      if(P.centerVerb){
        L.push('・中心アクション「' + P.centerVerb + '」: ' + ((P.action && P.action.id==='a_climb') ? '壁に面した足場から、壁接触中にもう1回だけ跳べる（壁ジャンプ）。これで折り返し登坂が成立する。' : '水から逃げる移動の中心に置く。'));
      }
      if(P.subVerb){
        L.push('・サブ「' + P.subVerb + '」: 近づく障害（カラス等）を押し戻せる。使った後は2秒のクールダウン。押し戻しは得点にしない（逃げ切りの道具）。');
      }
      if(c.some(x=>x.def.id==='c_phys')){
        const obs = (P.obstacles || []).slice(0,3);
        L.push('・障害: ' + obs.join('・') + '。水は水位そのもので表現し、音は「音波リング」が水平に飛来する（避けて進む。伏せ回避はこの型では足さない）。');
      }
      L.push('・調整レバー: ' + this.lever);
      L.push(CT.CAMERA_SPEC);
      L.push('・速度倍率 speedMul はキャラ・障害・BGMに共通。水位の速さだけは waterSpeed を掛ける（展開表の加速とは別のつまみにする）。');
      return L.join('\n');
    }
  }
};

CT.patternOf = function(id){
  return (CT.PATTERNS && CT.PATTERNS[id]) ? CT.PATTERNS[id] : null;
};
