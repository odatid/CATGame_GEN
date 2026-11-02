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

  ,pt_moveplat: {
    id:'pt_moveplat', label:'うごく床型',
    brief:'うごく床型：動く足場を渡って進む（Moving Platform・Elevator・Falling・Spring）',
    lever:'GameSettings → Move Speed / Enemy Speed（Slow・Normal・Fast）',
    dur: 45,
    unity:{scene:'SC_Base_Side', kit:['Moving Platform','Elevator Platform','Falling Platform','Spring Platform','Goal']},
    detail: function(P){
      const L=[];
      L.push('▼ レベル構造: うごく床型（Unity: Moving Platform 系）');
      L.push('・この日に使う仕かけ（Unityキット）: Moving Platform / Elevator Platform / Falling Platform / Spring Platform / Goal');
      L.push('・シーン: SC_Base_Side');
      L.push('・シーンは SC_Base_Side（横）を想定。動く床が3〜5枚あり、それぞれ動き方が違う（左右・上下・乗ると落ちる・乗ると高く跳ぶ）。');
      L.push('・床の動きは往復（行って戻る）。プレイヤーは「いつ乗るか」をはかる。');
      if(P && P.centerVerb){ L.push('・中心アクション「'+P.centerVerb+'」: 動く床への乗り移りのタイミングに使う。'); }
      if(P && P.purpose){ L.push('・ゴール: '+P.purpose.goal+'（Goal Prefab を終点に置く）。'); }
      L.push('・調整レバー: '+this.lever+'（ゲーム性チェックの点検後に最初に動かす場所）');
      return L.join('\n');
    }
  },
  pt_collect: {
    id:'pt_collect', label:'あつめる型',
    brief:'あつめる型：散らばった物をぜんぶ集めてゴールへ（Collectible・Goal）',
    lever:'GameSettings → Required Item Count / Game Time',
    dur: 45,
    unity:{scene:'SC_Base_Top', kit:['Collectible','Goal','Timer','Patrol Enemy']},
    detail: function(P){
      const L=[];
      L.push('▼ レベル構造: あつめる型（Unity: Collectible 系）');
      L.push('・この日に使う仕かけ（Unityキット）: Collectible / Goal / Timer / Required Item Count');
      L.push('・シーン: SC_Base_Top');
      L.push('・シーンは SC_Base_Top（俯瞰）を想定。集める物（猫缶・魚・毛糸）を部屋の隅と袋小路に配置する。');
      L.push('・全部集むと Goal が開く（Required Item Count と連動）。遠い場所の物ほど価値が高い（得点を上乗せ）。');
      if(P && P.centerVerb){ L.push('・中心アクション「'+P.centerVerb+'」: 移動しながら取る操作に使う。'); }
      if(P && P.purpose){ L.push('・ゴール: '+P.purpose.goal+'。'); }
      L.push('・調整レバー: '+this.lever);
      return L.join('\n');
    }
  },
  pt_hide: {
    id:'pt_hide', label:'かくれる型',
    brief:'かくれる型：隠れながら目的を遂げる（Hide Object・Patrol Enemy・音ゲージ）',
    lever:'GameSettings → Enemy Speed / Game Time',
    dur: 45,
    unity:{scene:'SC_Base_Top', kit:['Hide Object','Patrol Enemy','Collectible','Goal']},
    detail: function(P){
      const L=[];
      L.push('▼ レベル構造: かくれる型（Unity: Hide Object 系）');
      L.push('・この日に使う仕かけ（Unityキット）: Hide Object / Patrol Enemy / Goal');
      L.push('・シーン: SC_Base_Top');
      L.push('・巡回する敵（Patrol Enemy）の視線を抜けて、隠れ場所（Hide Object）に中継しながら進む。');
      L.push('・音ゲージ制約と組み合わせる: 走ると音が上がり、隠れると下がる。敵に見つかるとミス。');
      if(P && P.centerVerb){ L.push('・中心アクション「'+P.centerVerb+'」: 隠れ場所から次へ移る判断に使う。'); }
      if(P && P.purpose){ L.push('・ゴール: '+P.purpose.goal+'。'); }
      L.push('・調整レバー: '+this.lever);
      return L.join('\n');
    }
  },
  pt_switch: {
    id:'pt_switch', label:'しかけ解き型',
    brief:'しかけ解き型：スイッチと押し箱で道を開ける（Switch・Push Box・Switch Gate）',
    lever:'GameSettings → Game Time（解く時間）/ Move Speed',
    dur: 45,
    unity:{scene:'SC_Base_Top', kit:['Switch','Switch Gate','Push Box','Pressure Switch','Goal']},
    detail: function(P){
      const L=[];
      L.push('▼ レベル構造: しかけ解き型（Unity: Switch 系）');
      L.push('・この日に使う仕かけ（Unityキット）: Switch / Switch Gate / Push Box / Pressure Switch / Goal');
      L.push('・シーン: SC_Base_Top');
      L.push('・「解く→道が開く→進む」を1セットにして3回繰り返す。押し箱は重し（Pressure Switch）にも足場にもなる。');
      L.push('・スイッチを押す順番に正解がある（看板 Sign Board にヒントを出してよい）。');
      if(P && P.centerVerb){ L.push('・中心アクション「'+P.centerVerb+'」: 箱を押す・乗る操作に使う。'); }
      if(P && P.purpose){ L.push('・ゴール: '+P.purpose.goal+'（Switch Gate の向こう）。'); }
      L.push('・調整レバー: '+this.lever);
      return L.join('\n');
    }
  },
  pt_escape: {
    id:'pt_escape', label:'だっしゅつ型',
    brief:'だっしゅつ型：迫る危険から高所・出口へ（Timer・Hazard Area）',
    lever:'GameSettings → Game Time / Enemy Speed',
    dur: 45,
    unity:{scene:'SC_Base_Vertical', kit:['Hazard Area','Timer','Moving Platform','Goal']},
    detail: function(P){
      const L=[];
      L.push('▼ レベル構造: だっしゅつ型（Unity: Hazard Area + Timer 系）');
      L.push('・この日に使う仕かけ（Unityキット）: Hazard Area / Timer / Moving Platform / Goal');
      L.push('・シーン: SC_Base_Vertical');
      L.push('・危険エリア（Hazard Area＝水・煙など）が下からじわじわ迫る（Timer と連動して一定速度で上昇）。触れるとミス。');
      L.push('・縦長マップ（SC_Base_Vertical 想定）。最下層の安全高台から開始する（開始直後の被弾の理不尽をなくす）。');
      if(P && P.centerVerb){ L.push('・中心アクション「'+P.centerVerb+'」: 高く登る・逃げる操作に使う。'); }
      if(P && P.purpose){ L.push('・ゴール: '+P.purpose.goal+'。'); }
      L.push('・調整レバー: '+this.lever+'（危険の迫る速さ）');
      return L.join('\n');
    }
  }

};

CT.patternOf = function(id){
  return (CT.PATTERNS && CT.PATTERNS[id]) ? CT.PATTERNS[id] : null;
};
