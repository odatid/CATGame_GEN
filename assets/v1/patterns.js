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
  ,pg_puzzle: {
    id:'pg_puzzle', label:'手番パズル型',
    brief:'手番制パズル型：時間が止まっている。置く場所を考える',
    lever:'TUNING.hintCount = 2（ヒントの回数。0で無し）',
    dur: 30,
    detail: function(P){
      const L=[];
      L.push('▼ レベル構造: 手番制パズル型（パズル）');
      L.push('・時間は手番の間だけ止まる。落ちてくる物・動く敵は出さない（考えることに集中させる）。');
      L.push('・盤面: 960×540の中に、置ける場所とゴール（ネコの行き先）を用意する。');
      if(P && P.centerVerb){ L.push('・中心アクション「'+P.centerVerb+'」: 手番ごとに1つ置く。置いた物は動かせない（置き直しはリセット）。'); }
      if(P && P.purpose){ L.push('・ゴール: '+P.purpose.goal+'。置き切ったら自動でネコが動いて結果が見える演出を入れる。'); }
      L.push('・調整レバー: '+this.lever);
      return L.join('\n');
    }
  },
  pg_actpuzzle: {
    id:'pg_actpuzzle', label:'落ち配置型',
    brief:'落ち配置型（アクションパズル）：落ちてくる物を置きながら解く',
    lever:'TUNING.dropSpeed = 1.0（0.7で易しく・1.3で難しく）',
    dur: 45,
    detail: function(P){
      const L=[];
      L.push('▼ レベル構造: 落ち配置型（アクションパズル）');
      L.push('・物が一定間隔で上から落ちてくる。落とす場所を左右で選んで、積む・はめる・埋める。');
      L.push('・積んだ物は消えない（スイカゲーム型）。崩れは物理風の揺れで表現（完全物理エンジンは不要）。');
      if(P && P.purpose){ L.push('・ゴール: '+P.purpose.goal+'。高さのラインを超えたら失敗（水位ではなく高さ制限）。'); }
      if(P && P.centerVerb){ L.push('・中心アクション「'+P.centerVerb+'」: 落とす場所の選択そのもの。'); }
      L.push('・調整レバー: '+this.lever);
      return L.join('\n');
    }
  },
  pg_puzzact: {
    id:'pg_puzzact', label:'しかけ移動型',
    brief:'しかけ移動型（パズルアクション）：床が動く中で解きながら進む',
    lever:'TUNING.floorSpeed = 1.0（床の動く速さ。0.7で易しく）',
    dur: 45,
    detail: function(P){
      const L=[];
      L.push('▼ レベル構造: しかけ移動型（パズルアクション）');
      L.push('・マップ: 横960px×高さ約1,200px。床・ブロック・スイッチが動く。');
      L.push('・「解く」→「道が開く」→「進む」の3拍子を1セットにし、3回繰り返す。');
      if(P && P.centerVerb){ L.push('・中心アクション「'+P.centerVerb+'」: 動く床への乗り移りのタイミングに使う。'); }
      if(P && P.purpose){ L.push('・ゴール: '+P.purpose.goal+'。'); }
      L.push('・調整レバー: '+this.lever);
      return L.join('\n');
    }
  },
  pg_rogue: {
    id:'pg_rogue', label:'変化挑戦型',
    brief:'変化挑戦型（ローグライク・ローグライト）：挑戦のたびに仕かけが変わる',
    lever:'TUNING.shuffleStep = 1（挑戦ごとの変化の強さ）',
    dur: 30,
    detail: function(P){
      const L=[];
      L.push('▼ レベル構造: 変化挑戦型（ローグライク・ローグライト）');
      L.push('・塔の仕かけ（足場の位置・障害の種類）はパターン4種を配列で用意し、挑戦ごとに順番に切り替える（ランダムでなく巡回・決定的。毎回変わる感覚は出る）。');
      L.push('・失敗したら最初から。ただし「ローグライト」の案では、2回目以降は楽になる道が開く（安全な足場が1つ増える）。');
      if(P && P.purpose){ L.push('・ゴール: '+P.purpose.goal+'。'); }
      if(P && P.centerVerb){ L.push('・中心アクション「'+P.centerVerb+'」: 塔を登る操作として使う。'); }
      L.push('・調整レバー: '+this.lever);
      L.push('・難度: 10回挑戦して1回登れる強さが狙い。しばりは1つまで（EMS判定の「むり」になりやすい）。');
      return L.join('\n');
    }
  }

};

CT.patternOf = function(id){
  return (CT.PATTERNS && CT.PATTERNS[id]) ? CT.PATTERNS[id] : null;
};
